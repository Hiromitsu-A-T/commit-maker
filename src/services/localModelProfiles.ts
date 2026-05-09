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
  }
};

const RUNTIME_PROFILES: Record<LocalRuntimeProfileId, LocalModelRuntimeSettings> = {
  default: {},
  // Keep Gemma runtime tweaks centralized; add args here only after smoke verification.
  gemma4: {}
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
  if (typeof settings.cacheRamMb === 'number' && Number.isFinite(settings.cacheRamMb)) {
    args.push('--cache-ram', String(settings.cacheRamMb));
  }
  if (typeof settings.ctxCheckpoints === 'number' && Number.isFinite(settings.ctxCheckpoints)) {
    args.push('--ctx-checkpoints', String(settings.ctxCheckpoints));
  }
  return args;
}
