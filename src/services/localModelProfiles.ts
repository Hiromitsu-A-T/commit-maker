import {
  LocalGenerationProfileId,
  LocalModelDefinition,
  LocalModelGenerationSettings,
  LocalModelRuntimeSettings,
  LocalRuntimeProfileId
} from '../types';

const GENERATION_PROFILES: Record<LocalGenerationProfileId, LocalModelGenerationSettings> = {
  deterministic: {
    temperature: 0
  },
  gemma4: {
    temperature: 0,
    topP: 0.95,
    topK: 64,
    minP: 0
  },
  lfm25: {
    temperature: 0,
    topK: 80,
    repeatPenalty: 1.05
  }
};

const RUNTIME_PROFILES: Record<LocalRuntimeProfileId, LocalModelRuntimeSettings> = {
  default: {},
  qwen3Thinking: {
    reasoningBudget: 512
  },
  // Keep Gemma runtime tweaks centralized; add args here only after smoke verification.
  gemma4: {},
  // LFM2.5 requires a newer llama.cpp runtime; version selection lives on the model definition.
  lfm25: {}
};

export function resolveLocalGenerationSettings(model: LocalModelDefinition): LocalModelGenerationSettings {
  const profile = GENERATION_PROFILES[model.generationProfile ?? 'deterministic'];
  return { ...profile, ...(model.generation ?? {}) };
}

export function resolveLocalRuntimeArgs(model: LocalModelDefinition): string[] {
  const profile = RUNTIME_PROFILES[model.runtimeProfile ?? 'default'];
  const settings = { ...profile, ...(model.runtime ?? {}) };
  const args: string[] = [];
  if (settings.reasoning) {
    args.push('--reasoning', settings.reasoning);
  }
  if (typeof settings.reasoningBudget === 'number' && Number.isFinite(settings.reasoningBudget)) {
    args.push('--reasoning-budget', String(settings.reasoningBudget));
  }
  if (typeof settings.cacheRamMb === 'number' && Number.isFinite(settings.cacheRamMb)) {
    args.push('--cache-ram', String(settings.cacheRamMb));
  }
  if (typeof settings.ctxCheckpoints === 'number' && Number.isFinite(settings.ctxCheckpoints)) {
    args.push('--ctx-checkpoints', String(settings.ctxCheckpoints));
  }
  return args;
}
