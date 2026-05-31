import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DEFAULT_LOCAL_RUNTIME_VERSION } from '../constants';
import {
  ensureLocalRuntime,
  findBundledRuntime,
  getLocalRuntimeAsset,
  getLocalRuntimeAssets,
  LOCAL_RUNTIME_ASSETS,
  LOCAL_RUNTIME_VERSION,
  resolveLocalRuntimeVersion
} from './localRuntime';

function createRuntimePathConfig(value: string | undefined, scope: 'globalValue' | 'workspaceValue' = 'globalValue') {
  return {
    inspect: (key: string) => key === 'localRuntimePath' && value !== undefined ? { [scope]: value } : undefined,
    get: () => undefined
  } as any;
}

export async function runLocalRuntimeTests(): Promise<void> {
  assert.strictEqual(LOCAL_RUNTIME_VERSION, DEFAULT_LOCAL_RUNTIME_VERSION);
  assert.strictEqual(getLocalRuntimeAssets(DEFAULT_LOCAL_RUNTIME_VERSION).length, LOCAL_RUNTIME_ASSETS.length);
  assert.strictEqual(getLocalRuntimeAssets('b9441').length, LOCAL_RUNTIME_ASSETS.length);
  assert.ok(LOCAL_RUNTIME_ASSETS.length >= 6);
  assert.strictEqual(getLocalRuntimeAsset('darwin', 'arm64')?.archiveName, 'llama-b8967-bin-macos-arm64.tar.gz');
  assert.strictEqual(getLocalRuntimeAsset('darwin', 'arm64')?.runtimeVersion, DEFAULT_LOCAL_RUNTIME_VERSION);
  assert.strictEqual(getLocalRuntimeAsset('darwin', 'arm64', 'b9441')?.archiveName, 'llama-b9441-bin-macos-arm64.tar.gz');
  assert.strictEqual(getLocalRuntimeAsset('darwin', 'arm64', 'b9441')?.runtimeVersion, 'b9441');
  assert.strictEqual(getLocalRuntimeAsset('darwin', 'x64')?.archiveName, 'llama-b8967-bin-macos-x64.tar.gz');
  assert.strictEqual(getLocalRuntimeAsset('linux', 'x64')?.archiveName, 'llama-b8967-bin-ubuntu-x64.tar.gz');
  assert.strictEqual(getLocalRuntimeAsset('linux', 'arm64')?.archiveName, 'llama-b8967-bin-ubuntu-arm64.tar.gz');
  assert.strictEqual(getLocalRuntimeAsset('win32', 'x64')?.archiveName, 'llama-b8967-bin-win-cpu-x64.zip');
  assert.strictEqual(getLocalRuntimeAsset('win32', 'arm64')?.archiveName, 'llama-b8967-bin-win-cpu-arm64.zip');
  assert.strictEqual(getLocalRuntimeAsset('freebsd' as NodeJS.Platform, 'x64'), undefined);
  assert.strictEqual(resolveLocalRuntimeVersion({} as any), DEFAULT_LOCAL_RUNTIME_VERSION);

  const tmpRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'commit-maker-runtime-test-'));
  try {
    const executable = process.platform === 'win32' ? 'llama-server.exe' : 'llama-server';
    const platform = `${process.platform}-${process.arch}`;
    const versionedPath = path.join(
      tmpRoot,
      'bin',
      'llama.cpp',
      DEFAULT_LOCAL_RUNTIME_VERSION,
      platform,
      executable
    );
    await fs.promises.mkdir(path.dirname(versionedPath), { recursive: true });
    await fs.promises.writeFile(versionedPath, '');
    assert.strictEqual(findBundledRuntime({ fsPath: tmpRoot } as any), versionedPath);
    assert.strictEqual(findBundledRuntime({ fsPath: tmpRoot } as any, 'b9441'), undefined);
  } finally {
    await fs.promises.rm(tmpRoot, { recursive: true, force: true });
  }

  const alternateRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'commit-maker-runtime-alt-test-'));
  try {
    const executable = process.platform === 'win32' ? 'llama-server.exe' : 'llama-server';
    const platform = `${process.platform}-${process.arch}`;
    const alternatePath = path.join(alternateRoot, 'bin', 'llama.cpp', 'b9441', platform, executable);
    await fs.promises.mkdir(path.dirname(alternatePath), { recursive: true });
    await fs.promises.writeFile(alternatePath, '');
    assert.strictEqual(findBundledRuntime({ fsPath: alternateRoot } as any, 'b9441'), alternatePath);
  } finally {
    await fs.promises.rm(alternateRoot, { recursive: true, force: true });
  }

  const legacyRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'commit-maker-runtime-legacy-test-'));
  try {
    const executable = process.platform === 'win32' ? 'llama-server.exe' : 'llama-server';
    const platform = `${process.platform}-${process.arch}`;
    const legacyPath = path.join(legacyRoot, 'bin', 'llama.cpp', platform, executable);
    await fs.promises.mkdir(path.dirname(legacyPath), { recursive: true });
    await fs.promises.writeFile(legacyPath, '');
    assert.strictEqual(findBundledRuntime({ fsPath: legacyRoot } as any), legacyPath);
    assert.strictEqual(findBundledRuntime({ fsPath: legacyRoot } as any, 'b9441'), undefined);
  } finally {
    await fs.promises.rm(legacyRoot, { recursive: true, force: true });
  }

  const configuredRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'commit-maker-runtime-configured-'));
  try {
    const configuredPath = path.join(configuredRoot, process.platform === 'win32' ? 'llama-server.exe' : 'llama-server');
    await fs.promises.writeFile(configuredPath, '');
    const resolved = await ensureLocalRuntime(
      { globalStorageUri: { fsPath: configuredRoot } } as any,
      { fsPath: configuredRoot } as any,
      createRuntimePathConfig(configuredPath)
    );
    assert.strictEqual(resolved, configuredPath);
    await assert.rejects(
      () => ensureLocalRuntime(
        { globalStorageUri: { fsPath: configuredRoot } } as any,
        { fsPath: configuredRoot } as any,
        createRuntimePathConfig('./llama-server')
      ),
      /runtime|llama/i
    );
    const platform = `${process.platform}-${process.arch}`;
    const bundledPath = path.join(
      configuredRoot,
      'bin',
      'llama.cpp',
      DEFAULT_LOCAL_RUNTIME_VERSION,
      platform,
      process.platform === 'win32' ? 'llama-server.exe' : 'llama-server'
    );
    await fs.promises.mkdir(path.dirname(bundledPath), { recursive: true });
    await fs.promises.writeFile(bundledPath, '');
    const workspaceOnly = await ensureLocalRuntime(
      { globalStorageUri: { fsPath: configuredRoot } } as any,
      { fsPath: configuredRoot } as any,
      createRuntimePathConfig(configuredPath, 'workspaceValue')
    );
    assert.strictEqual(workspaceOnly, bundledPath);
  } finally {
    await fs.promises.rm(configuredRoot, { recursive: true, force: true });
  }

  console.log('localRuntime.test.ts passed');
}
