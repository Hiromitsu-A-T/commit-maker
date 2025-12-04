import * as vscode from 'vscode';
import {
  ACTIVE_PROMPT_PRESET_STORAGE_KEY,
  PROMPT_PRESETS_STORAGE_KEY,
  PROMPT_PRESETS
} from './constants';
import { PromptPreset } from './types';
import { normalizePresets, resolveActivePresetId } from './promptPresets';

export function loadPromptPresetsFromStorage(
  context: vscode.ExtensionContext,
  fallback: PromptPreset[] = PROMPT_PRESETS
): { presets: PromptPreset[]; activeId: string } {
  const storedGlobal = context.globalState.get<PromptPreset[]>(PROMPT_PRESETS_STORAGE_KEY);
  const storedWorkspace = context.workspaceState.get<PromptPreset[]>(PROMPT_PRESETS_STORAGE_KEY);
  const stored = storedGlobal ?? storedWorkspace ?? fallback;
  const presets = normalizePresets(stored || [], fallback);

  const activeStoredGlobal = context.globalState.get<string>(ACTIVE_PROMPT_PRESET_STORAGE_KEY);
  const activeStoredWorkspace = context.workspaceState.get<string>(ACTIVE_PROMPT_PRESET_STORAGE_KEY);
  const activeStored = activeStoredGlobal ?? activeStoredWorkspace ?? presets[0]?.id;
  const activeId = resolveActivePresetId(presets, activeStored, fallback);

  // 旧ワークスペース保存からグローバルへ自動移行
  if (!storedGlobal && storedWorkspace) {
    void persistPromptPresets(context, presets, activeId);
  }

  return { presets, activeId };
}

export async function persistPromptPresets(
  context: vscode.ExtensionContext,
  presets: PromptPreset[],
  activeId: string
): Promise<void> {
  await context.globalState.update(PROMPT_PRESETS_STORAGE_KEY, presets);
  await context.globalState.update(ACTIVE_PROMPT_PRESET_STORAGE_KEY, activeId);
}
