import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  findBundledRuntime,
  getLocalRuntimeAsset,
  LOCAL_RUNTIME_ASSETS,
  LOCAL_RUNTIME_VERSION
} from './localRuntime';

export async function runLocalRuntimeTests(): Promise<void> {
  assert.strictEqual(LOCAL_RUNTIME_VERSION, 'b8967');
  assert.ok(LOCAL_RUNTIME_ASSETS.length >= 6);
  assert.strictEqual(getLocalRuntimeAsset('darwin', 'arm64')?.archiveName, 'llama-b8967-bin-macos-arm64.tar.gz');
  assert.strictEqual(getLocalRuntimeAsset('darwin', 'x64')?.archiveName, 'llama-b8967-bin-macos-x64.tar.gz');
  assert.strictEqual(getLocalRuntimeAsset('linux', 'x64')?.archiveName, 'llama-b8967-bin-ubuntu-x64.tar.gz');
  assert.strictEqual(getLocalRuntimeAsset('linux', 'arm64')?.archiveName, 'llama-b8967-bin-ubuntu-arm64.tar.gz');
  assert.strictEqual(getLocalRuntimeAsset('win32', 'x64')?.archiveName, 'llama-b8967-bin-win-cpu-x64.zip');
  assert.strictEqual(getLocalRuntimeAsset('win32', 'arm64')?.archiveName, 'llama-b8967-bin-win-cpu-arm64.zip');
  assert.strictEqual(getLocalRuntimeAsset('freebsd' as NodeJS.Platform, 'x64'), undefined);

  const tmpRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'commit-maker-runtime-test-'));
  try {
    const executable = process.platform === 'win32' ? 'llama-server.exe' : 'llama-server';
    const platform = `${process.platform}-${process.arch}`;
    const binaryPath = path.join(tmpRoot, 'bin', 'llama.cpp', platform, executable);
    await fs.promises.mkdir(path.dirname(binaryPath), { recursive: true });
    await fs.promises.writeFile(binaryPath, '');
    assert.strictEqual(findBundledRuntime({ fsPath: tmpRoot } as any), binaryPath);
  } finally {
    await fs.promises.rm(tmpRoot, { recursive: true, force: true });
  }

  console.log('localRuntime.test.ts passed');
}
