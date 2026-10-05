import * as fs from 'fs';
import { downloadToFile, sha256File } from './fileDownload';
import * as path from 'path';
import * as vscode from 'vscode';
import {
  DEFAULT_LOCAL_MODEL,
  DEFAULT_LOCAL_MODEL_ID,
  LEGACY_DEFAULT_LOCAL_MODEL_ID,
  LOCAL_MODEL_DEFINITIONS
} from '../constants';
import { LocalModelDefinition, LocalModelOption, LocalModelState } from '../types';
import { getExplicitUserConfigurationString } from '../configScope';

import type { DownloadProgress } from './fileDownload';
export type { DownloadProgress } from './fileDownload';

export const LOCAL_MODELS: LocalModelDefinition[] = LOCAL_MODEL_DEFINITIONS;

export function getLocalModelOptions(): LocalModelOption[] {
  return LOCAL_MODELS.map(model => ({
    id: model.id,
    label: model.label,
    sizeLabel: formatBytes(model.sizeBytes),
    uiProfile: model.uiProfile,
    uiBadge: model.uiBadge,
    uiDetails: model.uiDetails
  }));
}

export function resolveLocalModelId(value: string | undefined): string {
  const candidate = value?.trim();
  if (!candidate || candidate === LEGACY_DEFAULT_LOCAL_MODEL_ID) return DEFAULT_LOCAL_MODEL_ID;
  const direct = LOCAL_MODELS.find(model => model.id === candidate);
  if (direct) return direct.id;
  const migrated = LOCAL_MODELS.find(model => model.legacyIds?.includes(candidate));
  return migrated?.id ?? DEFAULT_LOCAL_MODEL_ID;
}

export function getLocalModelDefinition(
  config: vscode.WorkspaceConfiguration,
  modelId?: string
): LocalModelDefinition {
  const base = getCatalogModel(modelId);
  const configuredUrl = getExplicitUserConfigurationString(config, 'localModelUrl');
  const configuredSha256 = getExplicitUserConfigurationString(config, 'localModelSha256');
  const configuredFilename = getExplicitUserConfigurationString(config, 'localModelFilename');
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
  const modelPaths = getLocalModelPaths(context, model);
  const [modelPath] = modelPaths;
  for (const candidatePath of modelPaths) {
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
      // 読めない候補は次の保存場所へ進み、見つからなければ未取得として扱う。
    }
  }
  for (const candidatePath of modelPaths) {
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
      // 部分ファイルも旧 ID の保存場所まで探してから未取得と判断する。
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
  abortSignal?.throwIfAborted();
  const model = getLocalModelDefinition(config, modelId);
  const modelPath = getLocalModelPath(context, model);
  const tmpPath = `${modelPath}.download`;
  await fs.promises.mkdir(path.dirname(modelPath), { recursive: true });
  await removeIfExists(tmpPath);

  try {
    validateDownloadUrl(model.url);
    await downloadToFile(model.url, tmpPath, abortSignal, progress => {
      onProgress({
        downloadedBytes: progress.downloadedBytes,
        totalBytes: progress.totalBytes ?? model.sizeBytes
      });
    });
    if (model.sha256) {
      const actual = await sha256File(tmpPath, abortSignal);
      if (actual.toLowerCase() !== model.sha256.toLowerCase()) {
        throw new Error(`SHA256 mismatch: expected ${model.sha256}, got ${actual}`);
      }
    }
    // 検証中の取り消しも確認してから、正式な保存先へ配置する。
    abortSignal?.throwIfAborted();
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

async function removeIfExists(filePath: string): Promise<void> {
  await fs.promises.rm(filePath, { force: true });
}

function sanitizeFilename(value: string): string {
  const base = path.basename(value.trim());
  return base || DEFAULT_LOCAL_MODEL.filename;
}

function getCatalogModel(modelId: string | undefined): LocalModelDefinition {
  const id = resolveLocalModelId(modelId);
  return LOCAL_MODELS.find(model => model.id === id) ?? DEFAULT_LOCAL_MODEL;
}

function validateDownloadUrl(value: string): void {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Local model URL is invalid.');
  }
  if (url.protocol !== 'https:') {
    throw new Error('Local model URL must use HTTPS.');
  }
}
