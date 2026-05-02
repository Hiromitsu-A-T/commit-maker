import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import {
  DEFAULT_LOCAL_MODEL,
  DEFAULT_LOCAL_MODEL_ID,
  LEGACY_DEFAULT_LOCAL_MODEL_ID,
  LOCAL_MODEL_DEFINITIONS
} from '../constants';
import { LocalModelDefinition, LocalModelOption, LocalModelState } from '../types';

export interface DownloadProgress {
  downloadedBytes: number;
  totalBytes?: number;
}

export const LOCAL_MODELS: LocalModelDefinition[] = LOCAL_MODEL_DEFINITIONS;

export function getLocalModelOptions(): LocalModelOption[] {
  return LOCAL_MODELS.map(model => ({
    id: model.id,
    label: model.label,
    sizeLabel: formatBytes(model.sizeBytes)
  }));
}

export function resolveLocalModelId(value: string | undefined): string {
  const candidate = value?.trim();
  if (!candidate || candidate === LEGACY_DEFAULT_LOCAL_MODEL_ID) return DEFAULT_LOCAL_MODEL_ID;
  return LOCAL_MODELS.some(model => model.id === candidate) ? candidate : DEFAULT_LOCAL_MODEL_ID;
}

export function getLocalModelDefinition(
  config: vscode.WorkspaceConfiguration,
  modelId?: string
): LocalModelDefinition {
  const base = getCatalogModel(modelId);
  const configuredUrl = getConfiguredString(config, 'localModelUrl');
  const configuredSha256 = getConfiguredString(config, 'localModelSha256');
  const configuredFilename = getConfiguredString(config, 'localModelFilename');
  const url = configuredUrl?.trim() || base.url;
  const sha256 = configuredSha256 !== undefined
    ? configuredSha256.trim()
    : url === base.url
      ? base.sha256
      : '';
  const filename = sanitizeFilename(configuredFilename?.trim() || base.filename);
  return {
    ...base,
    url,
    sha256,
    filename
  };
}

export function createDefaultLocalModelState(modelId?: string): LocalModelState {
  const model = getCatalogModel(modelId);
  return {
    id: model.id,
    label: model.label,
    status: 'notDownloaded',
    sizeLabel: formatBytes(model.sizeBytes),
    totalBytes: model.sizeBytes
  };
}

export async function inspectLocalModel(
  context: vscode.ExtensionContext,
  config: vscode.WorkspaceConfiguration,
  modelId?: string
): Promise<LocalModelState> {
  const model = getLocalModelDefinition(config, modelId);
  const [modelPath] = getLocalModelPaths(context, model);
  for (const candidatePath of getLocalModelPaths(context, model)) {
    try {
      const stat = await fs.promises.stat(candidatePath);
      if (stat.isFile() && stat.size > 0) {
        return {
          id: model.id,
          label: model.label,
          status: 'ready',
          sizeLabel: formatBytes(stat.size),
          totalBytes: stat.size,
          path: candidatePath
        };
      }
    } catch {
      // Missing file is the normal first-run state.
    }
  }
  for (const candidatePath of getLocalModelPaths(context, model)) {
    try {
      const partialPath = `${candidatePath}.download`;
      const stat = await fs.promises.stat(partialPath);
      if (stat.isFile() && stat.size > 0) {
        return {
          id: model.id,
          label: model.label,
          status: 'notDownloaded',
          sizeLabel: formatBytes(model.sizeBytes),
          downloadedBytes: stat.size,
          totalBytes: model.sizeBytes,
          path: modelPath,
          hasPartialDownload: true
        };
      }
    } catch {
      // Missing partial download is also normal.
    }
  }
  return {
    id: model.id,
    label: model.label,
    status: 'notDownloaded',
    sizeLabel: formatBytes(model.sizeBytes),
    totalBytes: model.sizeBytes,
    path: modelPath
  };
}

export async function downloadLocalModel(
  context: vscode.ExtensionContext,
  config: vscode.WorkspaceConfiguration,
  modelId: string | undefined,
  abortSignal: AbortSignal | undefined,
  onProgress: (progress: DownloadProgress) => void
): Promise<LocalModelState> {
  const model = getLocalModelDefinition(config, modelId);
  const modelPath = getLocalModelPath(context, model);
  const tmpPath = `${modelPath}.download`;
  await fs.promises.mkdir(path.dirname(modelPath), { recursive: true });
  await removeIfExists(tmpPath);

  try {
    await downloadToFile(model.url, tmpPath, abortSignal, progress => {
      onProgress({
        downloadedBytes: progress.downloadedBytes,
        totalBytes: progress.totalBytes ?? model.sizeBytes
      });
    });
    if (model.sha256) {
      const actual = await sha256File(tmpPath);
      if (actual.toLowerCase() !== model.sha256.toLowerCase()) {
        throw new Error(`SHA256 mismatch: expected ${model.sha256}, got ${actual}`);
      }
    }
    await fs.promises.rename(tmpPath, modelPath);
    return await inspectLocalModel(context, config, model.id);
  } catch (error) {
    await removeIfExists(tmpPath);
    throw error;
  }
}

export async function deleteLocalModel(
  context: vscode.ExtensionContext,
  config: vscode.WorkspaceConfiguration,
  modelId?: string
): Promise<LocalModelState> {
  const model = getLocalModelDefinition(config, modelId);
  for (const modelPath of getLocalModelPaths(context, model)) {
    await removeIfExists(modelPath);
    await removeIfExists(`${modelPath}.download`);
  }
  return await inspectLocalModel(context, config, model.id);
}

export function getLocalModelPath(context: vscode.ExtensionContext, model: LocalModelDefinition): string {
  return path.join(context.globalStorageUri.fsPath, 'models', model.id, model.filename);
}

function getLocalModelPaths(context: vscode.ExtensionContext, model: LocalModelDefinition): string[] {
  const paths = [getLocalModelPath(context, model)];
  for (const legacyId of model.legacyIds ?? []) {
    paths.push(path.join(context.globalStorageUri.fsPath, 'models', legacyId, model.filename));
  }
  return [...new Set(paths)];
}

export function formatBytes(bytes: number | undefined): string {
  if (!bytes || bytes <= 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const digits = unitIndex >= 3 ? 1 : 0;
  return `${value.toFixed(digits)} ${units[unitIndex]}`;
}

async function downloadToFile(
  url: string,
  filePath: string,
  abortSignal: AbortSignal | undefined,
  onProgress: (progress: DownloadProgress) => void
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
        onProgress({ downloadedBytes, totalBytes });
      }
    } else {
      for await (const chunk of body) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        downloadedBytes += buffer.length;
        await writeChunk(out, buffer);
        onProgress({ downloadedBytes, totalBytes });
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

function sanitizeFilename(value: string): string {
  const base = path.basename(value.trim());
  return base || DEFAULT_LOCAL_MODEL.filename;
}

function getCatalogModel(modelId: string | undefined): LocalModelDefinition {
  const id = resolveLocalModelId(modelId);
  return LOCAL_MODELS.find(model => model.id === id) ?? DEFAULT_LOCAL_MODEL;
}

function getConfiguredString(config: vscode.WorkspaceConfiguration, key: string): string | undefined {
  const inspected = config.inspect<string>(key) as any;
  return (
    inspected?.workspaceFolderLanguageValue ??
    inspected?.workspaceLanguageValue ??
    inspected?.globalLanguageValue ??
    inspected?.workspaceFolderValue ??
    inspected?.workspaceValue ??
    inspected?.globalValue
  );
}
