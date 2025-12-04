import { DEFAULT_PROVIDER, DEFAULT_REASONING_EFFORT, DEFAULT_VERBOSITY, MODEL_SUGGESTIONS_BY_PROVIDER, DEFAULT_MODEL_BY_PROVIDER } from './constants';
import { MaxPromptMode, ProviderId } from './types';

export const DEFAULT_INCLUDE_FLAGS = {
  includeUnstaged: true,
  includeUntracked: true,
  includeBinary: true
};

export const DEFAULT_PROMPT_LIMIT = {
  maxPromptChars: null as number | null,
  maxPromptMode: 'unlimited' as MaxPromptMode
};

export function getDefaultModelForProvider(provider: ProviderId): string {
  const suggestions = MODEL_SUGGESTIONS_BY_PROVIDER[provider];
  if (suggestions && suggestions.length > 0) {
    return suggestions[0];
  }
  return DEFAULT_MODEL_BY_PROVIDER[provider];
}
