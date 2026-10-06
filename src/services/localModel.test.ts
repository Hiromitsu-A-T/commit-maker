import type * as vscode from 'vscode';
import assert from 'assert';
import * as crypto from 'crypto';
import fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  DEFAULT_LOCAL_MODEL_ID,
  DEFAULT_LOCAL_MODEL_FILENAME,
  DEFAULT_LOCAL_MODEL_SHA256,
  DEFAULT_LOCAL_MODEL_URL,
  GEMMA4_LOCAL_MODEL_ID,
  LFM25_LOCAL_MODEL_ID,
  LEGACY_DEFAULT_LOCAL_MODEL_ID,
  QWEN35_2B_LOCAL_MODEL_ID
} from '../constants';
import { deleteLocalModel, downloadLocalModel, getLocalModelDefinition, getLocalModelOptions, getLocalModelPath, inspectLocalModel, resolveLocalModelId } from './localModel';
import { resolveLocalGenerationSettings, resolveLocalRuntimeArgs } from './localModelProfiles';
import { withMockFetch } from '../testSupport';

function createConfig(values: Record<string, string | undefined> = {}) {
  return {
    inspect: (key: string) => {
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        return { globalValue: values[key] };
      }
      return undefined;
    },
    get: (key: string, fallback: string) => values[key] ?? fallback
  } as unknown as vscode.WorkspaceConfiguration;
}

function createConfigWithPackageDefault(defaults: Record<string, string | undefined> = {}) {
  return {
    inspect: (key: string) => {
      if (Object.prototype.hasOwnProperty.call(defaults, key)) {
        return { defaultValue: defaults[key] };
      }
      return undefined;
    },
    get: (key: string, fallback: string) => defaults[key] ?? fallback
  } as unknown as vscode.WorkspaceConfiguration;
}

function createWorkspaceConfig(values: Record<string, string | undefined> = {}) {
  return {
    inspect: (key: string) => {
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        return { workspaceValue: values[key] };
      }
      return undefined;
    },
    get: (key: string, fallback: string) => values[key] ?? fallback
  } as unknown as vscode.WorkspaceConfiguration;
}

export async function runLocalModelTests(): Promise<void> {
  const defaults = getLocalModelDefinition(createConfig());
  assert.strictEqual(defaults.id, DEFAULT_LOCAL_MODEL_ID);
  assert.strictEqual(defaults.label, 'Qwen3.5-4B Q4_K_M');
  assert.strictEqual(defaults.url, DEFAULT_LOCAL_MODEL_URL);
  assert.strictEqual(defaults.sha256, DEFAULT_LOCAL_MODEL_SHA256);
  assert.strictEqual(defaults.sizeBytes, 2_740_937_888);
  assert.strictEqual(defaults.contextSize, 262_144);
  assert.strictEqual(defaults.runtimeVersion, 'b9441');
  assert.strictEqual(defaults.generationProfile, 'deterministic');
  assert.strictEqual(defaults.runtimeProfile, 'qwen35');
  assert.strictEqual(defaults.uiProfile, 'recommended');
  assert.strictEqual(defaults.uiDetails, 'Qwen3.5 4B · Dense · 256K ctx · Q4_K_M');
  assert.strictEqual(resolveLocalGenerationSettings(defaults).temperature, 0);
  assert.deepStrictEqual(resolveLocalRuntimeArgs(defaults), ['--reasoning', 'off']);

  const lowMemory = getLocalModelDefinition(createConfig(), QWEN35_2B_LOCAL_MODEL_ID);
  assert.strictEqual(lowMemory.label, 'Qwen3.5-2B Q4_K_M');
  assert.strictEqual(lowMemory.filename, 'Qwen3.5-2B-Q4_K_M.gguf');
  assert.strictEqual(lowMemory.sha256, 'aaf42c8b7c3cab2bf3d69c355048d4a0ee9973d48f16c731c0520ee914699223');
  assert.strictEqual(lowMemory.sizeBytes, 1_280_835_840);
  assert.strictEqual(lowMemory.contextSize, 262_144);
  assert.strictEqual(lowMemory.runtimeVersion, 'b9441');
  assert.strictEqual(lowMemory.generationProfile, 'deterministic');
  assert.strictEqual(lowMemory.runtimeProfile, 'qwen35');
  assert.strictEqual(lowMemory.uiProfile, 'lowMemory');
  assert.strictEqual(lowMemory.uiDetails, 'Qwen3.5 2B · Dense · 256K ctx · Q4_K_M');
  assert.strictEqual(resolveLocalGenerationSettings(lowMemory).temperature, 0);
  assert.deepStrictEqual(resolveLocalRuntimeArgs(lowMemory), ['--reasoning', 'off']);

  const gemma = getLocalModelDefinition(createConfig(), GEMMA4_LOCAL_MODEL_ID);
  assert.strictEqual(gemma.label, 'Gemma 4 E4B IT Q4_K_M');
  assert.strictEqual(gemma.filename, 'gemma-4-E4B-it-Q4_K_M.gguf');
  assert.strictEqual(gemma.sha256, '85a896a047553e842f25297ee5b031d64ff30147d9c4af17b1e4b394cd1fab87');
  assert.strictEqual(gemma.sizeBytes, 4_977_171_584);
  assert.strictEqual(gemma.runtimeVersion, 'b8967');
  assert.strictEqual(gemma.generationProfile, 'gemma4');
  assert.strictEqual(gemma.runtimeProfile, 'gemma4');
  assert.strictEqual(gemma.uiBadge, 'Dense');
  assert.strictEqual(gemma.uiDetails, 'Gemma 4 E4B IT · 32K ctx · Q4_K_M');
  assert.deepStrictEqual(resolveLocalGenerationSettings(gemma), {
    temperature: 0,
    topP: 0.95,
    topK: 64,
    minP: 0
  });
  assert.deepStrictEqual(resolveLocalRuntimeArgs(gemma), []);

  const lfm = getLocalModelDefinition(createConfig(), LFM25_LOCAL_MODEL_ID);
  assert.strictEqual(lfm.label, 'LFM2.5-8B-A1B Q4_K_M');
  assert.strictEqual(lfm.filename, 'LFM2.5-8B-A1B-Q4_K_M.gguf');
  assert.strictEqual(lfm.sha256, '4923ec14f06b968b74d663e5949867d2d9c3bf13a20b8be1a9f9af39989b2bb0');
  assert.strictEqual(lfm.sizeBytes, 5_155_564_768);
  assert.strictEqual(lfm.contextSize, 131_072);
  assert.strictEqual(lfm.runtimeVersion, 'b9441');
  assert.strictEqual(lfm.generationProfile, 'lfm25');
  assert.strictEqual(lfm.runtimeProfile, 'lfm25');
  assert.strictEqual(lfm.uiBadge, 'MoE');
  assert.strictEqual(lfm.uiDetails, 'LFM2.5 8B-A1B · 128K ctx · Q4_K_M');
  assert.deepStrictEqual(resolveLocalGenerationSettings(lfm), {
    temperature: 0,
    topK: 80,
    repeatPenalty: 1.05
  });
  assert.deepStrictEqual(resolveLocalRuntimeArgs(lfm), []);

  const lowMemoryWithPackageDefault = getLocalModelDefinition(createConfigWithPackageDefault({
    localModelFilename: DEFAULT_LOCAL_MODEL_FILENAME
  }), QWEN35_2B_LOCAL_MODEL_ID);
  assert.strictEqual(lowMemoryWithPackageDefault.filename, 'Qwen3.5-2B-Q4_K_M.gguf');

  const options = getLocalModelOptions();
  assert.deepStrictEqual(options.map(option => option.id), [
    DEFAULT_LOCAL_MODEL_ID,
    QWEN35_2B_LOCAL_MODEL_ID,
    GEMMA4_LOCAL_MODEL_ID,
    LFM25_LOCAL_MODEL_ID
  ]);
  assert.strictEqual(options[0].uiProfile, 'recommended');
  assert.strictEqual(options[1].uiProfile, 'lowMemory');
  assert.strictEqual(options[2].uiProfile, undefined);
  assert.deepStrictEqual(options.map(option => option.uiDetails), [
    'Qwen3.5 4B · Dense · 256K ctx · Q4_K_M',
    'Qwen3.5 2B · Dense · 256K ctx · Q4_K_M',
    'Gemma 4 E4B IT · 32K ctx · Q4_K_M',
    'LFM2.5 8B-A1B · 128K ctx · Q4_K_M'
  ]);
  assert.strictEqual(resolveLocalModelId(LEGACY_DEFAULT_LOCAL_MODEL_ID), DEFAULT_LOCAL_MODEL_ID);
  assert.strictEqual(resolveLocalModelId('Qwen3-4B-Instruct-2507-Q4_K_M'), DEFAULT_LOCAL_MODEL_ID);
  assert.strictEqual(resolveLocalModelId('Qwen3-4B-Thinking-2507-Q4_K_M'), DEFAULT_LOCAL_MODEL_ID);
  assert.strictEqual(resolveLocalModelId('unknown'), DEFAULT_LOCAL_MODEL_ID);

  const customUrl = getLocalModelDefinition(createConfig({
    localModelUrl: 'https://example.com/model.gguf'
  }));
  assert.strictEqual(customUrl.url, 'https://example.com/model.gguf');
  assert.strictEqual(customUrl.sha256, '');

  const workspaceOverride = getLocalModelDefinition(createWorkspaceConfig({
    localModelUrl: 'https://attacker.example/model.gguf',
    localModelSha256: 'abc123',
    localModelFilename: 'attacker.gguf'
  }));
  assert.strictEqual(workspaceOverride.url, DEFAULT_LOCAL_MODEL_URL);
  assert.strictEqual(workspaceOverride.sha256, DEFAULT_LOCAL_MODEL_SHA256);
  assert.strictEqual(workspaceOverride.filename, DEFAULT_LOCAL_MODEL_FILENAME);

  const customSha = getLocalModelDefinition(createConfig({
    localModelUrl: 'https://example.com/model.gguf',
    localModelSha256: 'abc123',
    localModelFilename: '../custom.gguf'
  }));
  assert.strictEqual(customSha.sha256, 'abc123');
  assert.strictEqual(customSha.filename, 'custom.gguf');

  const tmpRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'commit-maker-local-model-'));
  try {
    const legacyPath = path.join(tmpRoot, 'models', LEGACY_DEFAULT_LOCAL_MODEL_ID, DEFAULT_LOCAL_MODEL_FILENAME);
    await fs.promises.mkdir(path.dirname(legacyPath), { recursive: true });
    await fs.promises.writeFile(legacyPath, 'model');
    const inspected = await inspectLocalModel({ globalStorageUri: { fsPath: tmpRoot } } as unknown as vscode.ExtensionContext, createConfig());
    assert.strictEqual(inspected.id, DEFAULT_LOCAL_MODEL_ID);
    assert.strictEqual(inspected.status, 'ready');
    assert.strictEqual(inspected.path, legacyPath);
  } finally {
    await fs.promises.rm(tmpRoot, { recursive: true, force: true });
  }

  const partialRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'commit-maker-local-model-partial-'));
  try {
    const partialPath = path.join(partialRoot, 'models', DEFAULT_LOCAL_MODEL_ID, `${DEFAULT_LOCAL_MODEL_FILENAME}.download`);
    await fs.promises.mkdir(path.dirname(partialPath), { recursive: true });
    await fs.promises.writeFile(partialPath, 'partial');
    const partial = await inspectLocalModel({ globalStorageUri: { fsPath: partialRoot } } as unknown as vscode.ExtensionContext, createConfig());
    assert.strictEqual(partial.status, 'notDownloaded');
    assert.strictEqual(partial.hasPartialDownload, true);
    assert.strictEqual(partial.downloadedBytes, 7);
    await deleteLocalModel({ globalStorageUri: { fsPath: partialRoot } } as unknown as vscode.ExtensionContext, createConfig(), DEFAULT_LOCAL_MODEL_ID);
    assert.strictEqual(fs.existsSync(partialPath), false);
  } finally {
    await fs.promises.rm(partialRoot, { recursive: true, force: true });
  }

  const downloadRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'commit-maker-local-model-cancel-'));
  const originalReadStream = fs.createReadStream;
  try {
    const bytes = Buffer.from('isolated model fixture');
    const config = createConfig({
      localModelUrl: 'https://fixture.example/model.gguf',
      localModelFilename: 'fixture.gguf',
      localModelSha256: crypto.createHash('sha256').update(bytes).digest('hex')
    });
    const context = { globalStorageUri: { fsPath: downloadRoot } } as unknown as vscode.ExtensionContext;
    const modelPath = getLocalModelPath(context, getLocalModelDefinition(config));
    const controller = new AbortController();
    // 転送の完了後、ハッシュ用の読み込みが始まった時点で取り消す。
    fs.createReadStream = (filePath, options) => {
      const stream = originalReadStream(filePath, options);
      if (filePath === `${modelPath}.download`) stream.once('open', () => controller.abort());
      return stream;
    };
    await withMockFetch(async url => {
      assert.strictEqual(String(url), 'https://fixture.example/model.gguf');
      return new Response(bytes);
    }, async () => {
      await assert.rejects(
        () => downloadLocalModel(context, config, undefined, controller.signal, () => {}),
        { name: 'AbortError' }
      );
      assert.strictEqual(controller.signal.aborted, true);
      assert.strictEqual(fs.existsSync(modelPath), false, '検証中に取り消したモデルを配置しない');
      assert.strictEqual(fs.existsSync(`${modelPath}.download`), false);
      fs.createReadStream = originalReadStream;
      const downloaded = await downloadLocalModel(context, config, undefined, undefined, () => {});
      assert.strictEqual(downloaded.status, 'ready');
      assert.deepStrictEqual(await fs.promises.readFile(modelPath), bytes);
    });
  } finally {
    fs.createReadStream = originalReadStream;
    await fs.promises.rm(downloadRoot, { recursive: true, force: true });
  }

  console.log('localModel.test.ts passed');
}
