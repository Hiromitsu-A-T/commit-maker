import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawn } from 'child_process';
import { LOCAL_MODEL_DEFINITIONS } from '../src/constants';
import { ensureLocalRuntime, resolveLocalRuntimeVersion } from '../src/services/localRuntime';

async function main(): Promise<void> {
  const storageRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'commit-maker-local-runtime-'));
  const context = {
    globalStorageUri: { fsPath: storageRoot }
  };
  const extensionUri = { fsPath: process.cwd() };
  const config = {
    get(key: string): string | undefined {
      if (key === 'localRuntimePath') return undefined;
      return undefined;
    },
    inspect(): undefined {
      return undefined;
    }
  };

  try {
    const runtimeVersions = [...new Set(LOCAL_MODEL_DEFINITIONS.map(resolveLocalRuntimeVersion))];
    for (const runtimeVersion of runtimeVersions) {
      const runtimePath = await ensureLocalRuntime(context as any, extensionUri as any, config as any, {
        runtimeVersion,
        onProgress: createProgressLogger(),
        logger: message => console.log(message)
      });
      console.log(`Runtime path (${runtimeVersion}): ${runtimePath}`);
      const output = await runRuntimeVersion(runtimePath);
      const expected = new RegExp(`version:\\s*${runtimeVersion.slice(1)}\\b`);
      if (!expected.test(output)) {
        throw new Error(`Unexpected llama.cpp ${runtimeVersion} version output:\n${output}`);
      }
      console.log(`Local runtime ${runtimeVersion} smoke passed`);
    }
  } finally {
    await fs.promises.rm(storageRoot, { recursive: true, force: true }).catch(() => undefined);
  }
}

function createProgressLogger(): (progress: { downloadedBytes: number; totalBytes?: number }) => void {
  let lastBucket = -1;
  return progress => {
    if (!progress.totalBytes) return;
    const percent = Math.floor((progress.downloadedBytes / progress.totalBytes) * 100);
    const bucket = Math.min(100, Math.floor(percent / 10) * 10);
    if (bucket === lastBucket) return;
    lastBucket = bucket;
    console.log(`Downloading llama.cpp runtime: ${bucket}%`);
  };
}

function runRuntimeVersion(runtimePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(runtimePath, ['--version'], {
      cwd: path.dirname(runtimePath),
      stdio: 'pipe'
    });
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('llama-server --version timed out'));
    }, 120000);
    const chunks: string[] = [];
    child.stdout.on('data', chunk => chunks.push(String(chunk)));
    child.stderr.on('data', chunk => chunks.push(String(chunk)));
    child.once('error', error => {
      clearTimeout(timer);
      reject(error);
    });
    child.once('exit', code => {
      clearTimeout(timer);
      const output = chunks.join('');
      if (code === 0) resolve(output);
      else reject(new Error(`llama-server --version exited with code ${code}\n${output}`));
    });
  });
}

main().catch(error => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
