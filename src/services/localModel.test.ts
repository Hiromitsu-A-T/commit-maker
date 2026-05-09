import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  DEFAULT_LOCAL_MODEL_ID,
  DEFAULT_LOCAL_MODEL_FILENAME,
  DEFAULT_LOCAL_MODEL_SHA256,
  DEFAULT_LOCAL_MODEL_URL,
  GEMMA4_LOCAL_MODEL_ID,
  LEGACY_DEFAULT_LOCAL_MODEL_ID
} from '../constants';
import { deleteLocalModel, getLocalModelDefinition, getLocalModelOptions, inspectLocalModel, resolveLocalModelId } from './localModel';
import { resolveLocalGenerationSettings, resolveLocalRuntimeArgs } from './localModelProfiles';

function createConfig(values: Record<string, string | undefined> = {}) {
  return {
    inspect: (key: string) => {
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        return { globalValue: values[key] };
      }
      return undefined;
    },
    get: (key: string, fallback: string) => values[key] ?? fallback
  } as any;
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
  } as any;
}

export async function runLocalModelTests(): Promise<void> {
  const defaults = getLocalModelDefinition(createConfig());
  assert.strictEqual(defaults.id, DEFAULT_LOCAL_MODEL_ID);
  assert.strictEqual(defaults.label, 'Qwen3-4B-Instruct-2507 Q4_K_M');
  assert.strictEqual(defaults.url, DEFAULT_LOCAL_MODEL_URL);
  assert.strictEqual(defaults.sha256, DEFAULT_LOCAL_MODEL_SHA256);
  assert.strictEqual(defaults.generationProfile, 'deterministic');
  assert.strictEqual(resolveLocalGenerationSettings(defaults).temperature, 0);

  const thinking = getLocalModelDefinition(createConfig(), 'Qwen3-4B-Thinking-2507-Q4_K_M');
  assert.strictEqual(thinking.label, 'Qwen3-4B-Thinking-2507 Q4_K_M');
  assert.strictEqual(thinking.filename, 'Qwen3-4B-Thinking-2507-Q4_K_M.gguf');
  assert.strictEqual(thinking.sha256, 'ddd52e18200baab281c5c46f70d544ce4d4fe4846eab1608f2fff48a64554212');
  assert.strictEqual(thinking.generationProfile, 'deterministic');
  assert.strictEqual(resolveLocalGenerationSettings(thinking).temperature, 0);

  const gemma = getLocalModelDefinition(createConfig(), GEMMA4_LOCAL_MODEL_ID);
  assert.strictEqual(gemma.label, 'Gemma 4 E4B IT Q4_K_M');
  assert.strictEqual(gemma.filename, 'gemma-4-E4B-it-Q4_K_M.gguf');
  assert.strictEqual(gemma.sha256, '90ce98129eb3e8cc57e62433d500c97c624b1e3af1fcc85dd3b55ad7e0313e9f');
  assert.strictEqual(gemma.sizeBytes, 5_335_289_824);
  assert.strictEqual(gemma.generationProfile, 'gemma4');
  assert.strictEqual(gemma.runtimeProfile, 'gemma4');
  assert.deepStrictEqual(resolveLocalGenerationSettings(gemma), {
    temperature: 0,
    topP: 0.95,
    topK: 64,
    minP: 0
  });
  assert.deepStrictEqual(resolveLocalRuntimeArgs(gemma), []);

  const thinkingWithPackageDefault = getLocalModelDefinition(createConfigWithPackageDefault({
    localModelFilename: DEFAULT_LOCAL_MODEL_FILENAME
  }), 'Qwen3-4B-Thinking-2507-Q4_K_M');
  assert.strictEqual(thinkingWithPackageDefault.filename, 'Qwen3-4B-Thinking-2507-Q4_K_M.gguf');

  const options = getLocalModelOptions();
  assert.deepStrictEqual(options.map(option => option.id), [
    'Qwen3-4B-Instruct-2507-Q4_K_M',
    'Qwen3-4B-Thinking-2507-Q4_K_M',
    GEMMA4_LOCAL_MODEL_ID
  ]);
  assert.strictEqual(resolveLocalModelId(LEGACY_DEFAULT_LOCAL_MODEL_ID), DEFAULT_LOCAL_MODEL_ID);
  assert.strictEqual(resolveLocalModelId('unknown'), DEFAULT_LOCAL_MODEL_ID);

  const customUrl = getLocalModelDefinition(createConfig({
    localModelUrl: 'https://example.com/model.gguf'
  }));
  assert.strictEqual(customUrl.url, 'https://example.com/model.gguf');
  assert.strictEqual(customUrl.sha256, '');

  const customSha = getLocalModelDefinition(createConfig({
    localModelUrl: 'https://example.com/model.gguf',
    localModelSha256: 'abc123',
    localModelFilename: '../custom.gguf'
  }));
  assert.strictEqual(customSha.sha256, 'abc123');
  assert.strictEqual(customSha.filename, 'custom.gguf');

  const tmpRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'commit-maker-local-model-'));
  const legacyPath = path.join(tmpRoot, 'models', LEGACY_DEFAULT_LOCAL_MODEL_ID, DEFAULT_LOCAL_MODEL_FILENAME);
  await fs.promises.mkdir(path.dirname(legacyPath), { recursive: true });
  await fs.promises.writeFile(legacyPath, 'model');
  const inspected = await inspectLocalModel({ globalStorageUri: { fsPath: tmpRoot } } as any, createConfig());
  assert.strictEqual(inspected.id, DEFAULT_LOCAL_MODEL_ID);
  assert.strictEqual(inspected.status, 'ready');
  assert.strictEqual(inspected.path, legacyPath);
  await fs.promises.rm(tmpRoot, { recursive: true, force: true });

  const partialRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'commit-maker-local-model-partial-'));
  const partialPath = path.join(partialRoot, 'models', DEFAULT_LOCAL_MODEL_ID, `${DEFAULT_LOCAL_MODEL_FILENAME}.download`);
  await fs.promises.mkdir(path.dirname(partialPath), { recursive: true });
  await fs.promises.writeFile(partialPath, 'partial');
  const partial = await inspectLocalModel({ globalStorageUri: { fsPath: partialRoot } } as any, createConfig());
  assert.strictEqual(partial.status, 'notDownloaded');
  assert.strictEqual(partial.hasPartialDownload, true);
  assert.strictEqual(partial.downloadedBytes, 7);
  await deleteLocalModel({ globalStorageUri: { fsPath: partialRoot } } as any, createConfig(), DEFAULT_LOCAL_MODEL_ID);
  assert.strictEqual(fs.existsSync(partialPath), false);
  await fs.promises.rm(partialRoot, { recursive: true, force: true });

  console.log('localModel.test.ts passed');
}
