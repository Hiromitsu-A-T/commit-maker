import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { DEFAULT_LOCAL_RUNTIME_VERSION } from '../constants';
import { DEFAULT_LANGUAGE, getStrings } from '../i18n/strings';
import { LocalModelDefinition, LocalRuntimeVersionId } from '../types';
import { getExplicitUserConfigurationString } from '../configScope';

export interface RuntimeDownloadProgress {
  downloadedBytes: number;
  totalBytes?: number;
}

interface LocalRuntimeAsset {
  runtimeVersion: LocalRuntimeVersionId;
  platform: NodeJS.Platform;
  arch: NodeJS.Architecture;
  archiveName: string;
  url: string;
  sha256: string;
  type: 'tar.gz' | 'zip';
  executable: string;
}

export const LOCAL_RUNTIME_VERSION = DEFAULT_LOCAL_RUNTIME_VERSION;

export interface EnsureLocalRuntimeOptions {
  runtimeVersion?: LocalRuntimeVersionId;
  abortSignal?: AbortSignal;
  onProgress?: (progress: RuntimeDownloadProgress) => void;
  logger?: (message: string) => void;
}

const RUNTIME_BASE_URL = 'https://github.com/ggml-org/llama.cpp/releases/download';

const LOCAL_RUNTIME_ASSET_CATALOG: Record<LocalRuntimeVersionId, LocalRuntimeAsset[]> = {
  b8967: [
    createLlamaRuntimeAsset(
      'b8967',
      'darwin',
      'arm64',
      'llama-b8967-bin-macos-arm64.tar.gz',
      'be6c8e08305b1986a88174a6aec8b33d11e9a926e2c7fff59c216978b44b2617',
      'tar.gz',
      'llama-server'
    ),
    createLlamaRuntimeAsset(
      'b8967',
      'darwin',
      'x64',
      'llama-b8967-bin-macos-x64.tar.gz',
      'b39de389651e8fc61b9aa7f8efd06a2c7e70d125bc494f4cd31b668c331ce383',
      'tar.gz',
      'llama-server'
    ),
    createLlamaRuntimeAsset(
      'b8967',
      'linux',
      'x64',
      'llama-b8967-bin-ubuntu-x64.tar.gz',
      'f73bf8f1ceb0d3c84302081b3272d48e6a3ddbfb218fb23957e8a1b87d6f0c84',
      'tar.gz',
      'llama-server'
    ),
    createLlamaRuntimeAsset(
      'b8967',
      'linux',
      'arm64',
      'llama-b8967-bin-ubuntu-arm64.tar.gz',
      '554e6efa4a8fd0e47e18cc28fa36bbacde88cf03a3f631334b5a674e2f777e5a',
      'tar.gz',
      'llama-server'
    ),
    createLlamaRuntimeAsset(
      'b8967',
      'win32',
      'x64',
      'llama-b8967-bin-win-cpu-x64.zip',
      '56b8b306043c3facbc8682a42b8c423bf6d813be077f1bafbc91025b9d5a3314',
      'zip',
      'llama-server.exe'
    ),
    createLlamaRuntimeAsset(
      'b8967',
      'win32',
      'arm64',
      'llama-b8967-bin-win-cpu-arm64.zip',
      'df6c4f9ed99f44450d6bff4a923d5a226b9190dab8bd20f76751a3e780e38725',
      'zip',
      'llama-server.exe'
    )
  ],
  b9441: [
    createLlamaRuntimeAsset(
      'b9441',
      'darwin',
      'arm64',
      'llama-b9441-bin-macos-arm64.tar.gz',
      'f96656c029799aa0a9122c1ef59860c33de5e79a4fd85809ff27069c46d43e7b',
      'tar.gz',
      'llama-server'
    ),
    createLlamaRuntimeAsset(
      'b9441',
      'darwin',
      'x64',
      'llama-b9441-bin-macos-x64.tar.gz',
      '77a150379997f5eba3a3db004d82e668559451e70ade60dc5b7eb65817c9748a',
      'tar.gz',
      'llama-server'
    ),
    createLlamaRuntimeAsset(
      'b9441',
      'linux',
      'x64',
      'llama-b9441-bin-ubuntu-x64.tar.gz',
      '3054bf7b3b38e20f7e48d508d56c5d871b09ea199bf470bf025440412f6fb18d',
      'tar.gz',
      'llama-server'
    ),
    createLlamaRuntimeAsset(
      'b9441',
      'linux',
      'arm64',
      'llama-b9441-bin-ubuntu-arm64.tar.gz',
      '152afc5db87a9c9ca6c981068e9912bc0145e2a9ecb09e332d7795edb0f56382',
      'tar.gz',
      'llama-server'
    ),
    createLlamaRuntimeAsset(
      'b9441',
      'win32',
      'x64',
      'llama-b9441-bin-win-cpu-x64.zip',
      'f14b45e660636ab5f0475da2a911eb466b227efbed46fec794b676ec7b55aa7f',
      'zip',
      'llama-server.exe'
    ),
    createLlamaRuntimeAsset(
      'b9441',
      'win32',
      'arm64',
      'llama-b9441-bin-win-cpu-arm64.zip',
      'e9efc745a24a74b0bfe459d33c3c76a6bf2413401f02161673b41236490c31c0',
      'zip',
      'llama-server.exe'
    )
  ]
};

export const LOCAL_RUNTIME_ASSETS: LocalRuntimeAsset[] = LOCAL_RUNTIME_ASSET_CATALOG[DEFAULT_LOCAL_RUNTIME_VERSION];

function createLlamaRuntimeAsset(
  runtimeVersion: LocalRuntimeVersionId,
  platform: NodeJS.Platform,
  arch: NodeJS.Architecture,
  archiveName: string,
  sha256: string,
  type: LocalRuntimeAsset['type'],
  executable: string
): LocalRuntimeAsset {
  return {
    runtimeVersion,
    platform,
    arch,
    archiveName,
    url: `${RUNTIME_BASE_URL}/${runtimeVersion}/${archiveName}`,
    sha256,
    type,
    executable
  };
}

export async function ensureLocalRuntime(
  context: vscode.ExtensionContext,
  extensionUri: vscode.Uri,
  config: vscode.WorkspaceConfiguration,
  options: EnsureLocalRuntimeOptions = {}
): Promise<string> {
  const runtimeVersion = options.runtimeVersion ?? DEFAULT_LOCAL_RUNTIME_VERSION;
  const configured = getExplicitUserConfigurationString(config, 'localRuntimePath')?.trim();
  if (configured) {
    if (!path.isAbsolute(configured)) {
      throw new Error(getStrings(DEFAULT_LANGUAGE).msgLocalRuntimeMissing);
    }
    if (fs.existsSync(configured)) return configured;
    throw new Error(getStrings(DEFAULT_LANGUAGE).msgLocalRuntimeMissing);
  }

  const bundled = findBundledRuntime(extensionUri, runtimeVersion);
  if (bundled) return bundled;

  const asset = getLocalRuntimeAsset(process.platform, process.arch, runtimeVersion);
  if (!asset) {
    throw new Error(getStrings(DEFAULT_LANGUAGE).msgLocalRuntimeMissing);
  }

  const installDir = getRuntimeInstallDir(context, asset);
  const installed = await findRuntimeExecutable(installDir, asset.executable);
  if (installed) return installed;

  options.logger?.(`Local: downloading llama.cpp runtime ${asset.archiveName}`);
  const archivePath = path.join(context.globalStorageUri.fsPath, 'runtimes', 'downloads', asset.archiveName);
  const tmpArchivePath = `${archivePath}.download`;
  const tmpInstallDir = `${installDir}.download`;
  await fs.promises.mkdir(path.dirname(archivePath), { recursive: true });
  await fs.promises.mkdir(path.dirname(installDir), { recursive: true });
  await removeIfExists(tmpArchivePath);
  await fs.promises.rm(tmpInstallDir, { recursive: true, force: true }).catch(() => undefined);

  try {
    await downloadToFile(asset.url, tmpArchivePath, options.abortSignal, options.onProgress);
    const actual = await sha256File(tmpArchivePath);
    if (actual.toLowerCase() !== asset.sha256.toLowerCase()) {
      throw new Error(`SHA256 mismatch: expected ${asset.sha256}, got ${actual}`);
    }
    await fs.promises.rm(installDir, { recursive: true, force: true }).catch(() => undefined);
    await fs.promises.mkdir(tmpInstallDir, { recursive: true });
    await extractArchive(tmpArchivePath, tmpInstallDir, asset.type);

    const executable = await findRuntimeExecutable(tmpInstallDir, asset.executable);
    if (!executable) {
      throw new Error(`Missing ${asset.executable} in ${asset.archiveName}`);
    }
    if (process.platform !== 'win32') {
      await fs.promises.chmod(executable, 0o755);
    }
    await fs.promises.rename(tmpInstallDir, installDir);
    await removeIfExists(tmpArchivePath);
    const installedAfterRename = await findRuntimeExecutable(installDir, asset.executable);
    if (!installedAfterRename) {
      throw new Error(`Missing ${asset.executable} after runtime install`);
    }
    return installedAfterRename;
  } catch (error) {
    await removeIfExists(tmpArchivePath);
    await fs.promises.rm(tmpInstallDir, { recursive: true, force: true }).catch(() => undefined);
    throw error;
  }
}

export function getLocalRuntimeAsset(
  platform: NodeJS.Platform = process.platform,
  arch: NodeJS.Architecture = process.arch,
  runtimeVersion: LocalRuntimeVersionId = DEFAULT_LOCAL_RUNTIME_VERSION
): LocalRuntimeAsset | undefined {
  return getLocalRuntimeAssets(runtimeVersion).find(asset => asset.platform === platform && asset.arch === arch);
}

export function getLocalRuntimeAssets(
  runtimeVersion: LocalRuntimeVersionId = DEFAULT_LOCAL_RUNTIME_VERSION
): LocalRuntimeAsset[] {
  return LOCAL_RUNTIME_ASSET_CATALOG[runtimeVersion] ?? [];
}

export function resolveLocalRuntimeVersion(model: LocalModelDefinition): LocalRuntimeVersionId {
  return model.runtimeVersion ?? DEFAULT_LOCAL_RUNTIME_VERSION;
}

export function findBundledRuntime(
  extensionUri: vscode.Uri,
  runtimeVersion: LocalRuntimeVersionId = DEFAULT_LOCAL_RUNTIME_VERSION
): string | undefined {
  const executable = process.platform === 'win32' ? 'llama-server.exe' : 'llama-server';
  const platform = `${process.platform}-${process.arch}`;
  const root = extensionUri.fsPath;
  const versionedCandidates = [
    path.join(root, 'bin', 'llama.cpp', runtimeVersion, platform, executable),
    path.join(root, 'resources', 'llama.cpp', runtimeVersion, platform, executable)
  ];
  const legacyCandidates = runtimeVersion === DEFAULT_LOCAL_RUNTIME_VERSION ? [
    path.join(root, 'bin', 'llama.cpp', platform, executable),
    path.join(root, 'bin', platform, executable),
    path.join(root, 'resources', 'llama.cpp', platform, executable)
  ] : [];
  const candidates = [...versionedCandidates, ...legacyCandidates];
  return candidates.find(candidate => fs.existsSync(candidate));
}

function getRuntimeInstallDir(context: vscode.ExtensionContext, asset: LocalRuntimeAsset): string {
  return path.join(context.globalStorageUri.fsPath, 'runtimes', 'llama.cpp', asset.runtimeVersion, `${asset.platform}-${asset.arch}`);
}

async function findRuntimeExecutable(root: string, executable: string): Promise<string | undefined> {
  try {
    const stat = await fs.promises.stat(root);
    if (!stat.isDirectory()) return undefined;
  } catch {
    return undefined;
  }
  const entries = await fs.promises.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const candidate = path.join(root, entry.name);
    if (entry.isFile() && entry.name === executable) {
      return candidate;
    }
    if (entry.isDirectory()) {
      const nested = await findRuntimeExecutable(candidate, executable);
      if (nested) return nested;
    }
  }
  return undefined;
}

async function extractArchive(archivePath: string, targetDir: string, type: LocalRuntimeAsset['type']): Promise<void> {
  if (type === 'tar.gz') {
    await runCommand('tar', ['-xzf', archivePath, '-C', targetDir]);
    return;
  }
  try {
    await runCommand('tar', ['-xf', archivePath, '-C', targetDir]);
  } catch {
    await runCommand('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      `Expand-Archive -LiteralPath ${quotePowerShell(archivePath)} -DestinationPath ${quotePowerShell(targetDir)} -Force`
    ]);
  }
}

function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child: ChildProcessWithoutNullStreams = spawn(command, args, { stdio: 'pipe' });
    const output: string[] = [];
    child.stdout.on('data', chunk => output.push(String(chunk).trim()));
    child.stderr.on('data', chunk => output.push(String(chunk).trim()));
    child.once('error', reject);
    child.once('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(output.filter(Boolean).join('\n') || `${command} exited with code ${code}`));
    });
  });
}

async function downloadToFile(
  url: string,
  filePath: string,
  abortSignal: AbortSignal | undefined,
  onProgress?: (progress: RuntimeDownloadProgress) => void
): Promise<void> {
  const res = await fetch(url, { signal: abortSignal });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`HTTP ${res.status}: ${detail || res.statusText}`);
  }

  const totalHeader = res.headers.get('content-length');
  const totalBytes = totalHeader ? Number(totalHeader) : undefined;
  const out = fs.createWriteStream(filePath, { flags: 'w' });
  let downloadedBytes = 0;

  try {
    const body = res.body as any;
    if (typeof body.getReader === 'function') {
      const reader = body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = Buffer.from(value);
        downloadedBytes += chunk.length;
        await writeChunk(out, chunk);
        onProgress?.({ downloadedBytes, totalBytes });
      }
    } else {
      for await (const chunk of body) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        downloadedBytes += buffer.length;
        await writeChunk(out, buffer);
        onProgress?.({ downloadedBytes, totalBytes });
      }
    }
  } finally {
    await closeWriteStream(out);
  }
}

function writeChunk(stream: fs.WriteStream, chunk: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.write(chunk, error => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function closeWriteStream(stream: fs.WriteStream): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.once('error', reject);
    stream.end(() => resolve());
  });
}

async function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const input = fs.createReadStream(filePath);
    input.on('error', reject);
    input.on('data', chunk => hash.update(chunk));
    input.on('end', () => resolve(hash.digest('hex')));
  });
}

async function removeIfExists(filePath: string): Promise<void> {
  await fs.promises.rm(filePath, { force: true }).catch(() => undefined);
}

function quotePowerShell(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}
