import { PROMPT_PRESETS } from './constants';
import { PromptPreset } from './types';

export interface UpsertResult {
  presets: PromptPreset[];
  activeId: string;
  prompt: string;
  action: 'created' | 'updated';
}

export interface ApplyResult {
  presets: PromptPreset[];
  activeId: string;
  prompt: string;
}

export function normalizePresets(list: PromptPreset[], defaults: PromptPreset[] = PROMPT_PRESETS): PromptPreset[] {
  const defaultIds = defaults.map(d => d.id);
  // 既存の旧デフォルト (default-ja など) を除去
  const filtered = list.filter(p => {
    if (p.isDefault && !defaultIds.includes(p.id)) return false;
    if (p.id.startsWith('default-') && !defaultIds.includes(p.id)) return false;
    return true;
  });
  const merged = filtered.map(p => {
    const match = defaults.find(d => d.id === p.id);
    if (match) {
      return { ...p, ...match, isDefault: true };
    }
    return p;
  });
  const hasDefault = merged.some(p => defaultIds.includes(p.id));
  const withDefault = hasDefault ? merged : [...defaults, ...merged];
  // ensure default comes first
  const sorted = withDefault.sort((a, b) => {
    const aDefault = defaultIds.includes(a.id) ? 0 : 1;
    const bDefault = defaultIds.includes(b.id) ? 0 : 1;
    if (aDefault !== bDefault) return aDefault - bDefault;
    return 0;
  });
  return sorted;
}

export function resolveActivePresetId(
  presets: PromptPreset[],
  candidateId?: string,
  defaults: PromptPreset[] = PROMPT_PRESETS
): string {
  if (candidateId && presets.some(p => p.id === candidateId)) {
    return candidateId;
  }
  return presets[0]?.id ?? defaults[0]?.id ?? PROMPT_PRESETS[0].id;
}

export function upsertPreset(
  presets: PromptPreset[],
  activeId: string | undefined,
  title: string,
  body: string,
  defaults: PromptPreset[] = PROMPT_PRESETS
): UpsertResult {
  const normalized = normalizePresets(presets, defaults);
  const name = title.trim();
  let targetId: string | undefined;
  let action: UpsertResult['action'] = 'updated';

  if (activeId) {
    const current = normalized.find(p => p.id === activeId);
    if (current && !current.isDefault) {
      targetId = activeId;
    }
  }

  if (!targetId) {
    const existing = normalized.find(p => !p.isDefault && p.label === name);
    if (existing) {
      targetId = existing.id;
    }
  }

  let nextPresets: PromptPreset[];
  if (!targetId) {
    targetId = `custom-${Date.now()}`;
    action = 'created';
    nextPresets = [...normalized, { id: targetId, label: name, prompt: body }];
  } else {
    nextPresets = normalized.map(p => (p.id === targetId ? { ...p, label: name, prompt: body } : p));
  }

  const withDefault = normalizePresets(nextPresets, defaults);
  const nextActiveId = resolveActivePresetId(withDefault, targetId, defaults);
  return { presets: withDefault, activeId: nextActiveId, prompt: body, action };
}

export function applyPresetById(
  presets: PromptPreset[],
  id: string,
  defaults: PromptPreset[] = PROMPT_PRESETS
): ApplyResult | undefined {
  const normalized = normalizePresets(presets, defaults);
  const preset = normalized.find(p => p.id === id);
  if (!preset) return undefined;
  return {
    presets: normalized,
    activeId: preset.id,
    prompt: preset.prompt
  };
}

export function deletePresetById(
  presets: PromptPreset[],
  id: string,
  defaults: PromptPreset[] = PROMPT_PRESETS
): ApplyResult | undefined {
  const normalized = normalizePresets(presets, defaults);
  const target = normalized.find(p => p.id === id);
  if (!target || target.isDefault) return undefined;
  const remaining = normalizePresets(normalized.filter(p => p.id !== id), defaults);
  const nextActiveId = resolveActivePresetId(remaining, remaining[0]?.id, defaults);
  const nextPrompt = remaining.find(p => p.id === nextActiveId)?.prompt ?? defaults[0]?.prompt ?? PROMPT_PRESETS[0].prompt;
  return { presets: remaining, activeId: nextActiveId, prompt: nextPrompt };
}
