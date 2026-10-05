import { DEFAULT_CODEX_REASONING_EFFORT, DEFAULT_REASONING_EFFORT, DEFAULT_VERBOSITY, MODEL_SUGGESTIONS_BY_PROVIDER, DEFAULT_MODEL_BY_PROVIDER } from './constants';
import {
  MaxPromptMode,
  CodexReasoningEffort,
  isCodexReasoningEffort,
  ProviderId,
  ReasoningEffort,
  VerbositySetting,
  isReasoningEffort,
  isVerbositySetting
} from './types';

export const DEFAULT_INCLUDE_FLAGS = {
  includeUnstaged: true,
  includeUntracked: true,
  includeBinary: true
};

export const DEFAULT_PROMPT_LIMIT: { maxPromptChars: number | null; maxPromptMode: MaxPromptMode } = {
  maxPromptChars: null,
  maxPromptMode: 'unlimited'
};

export function getDefaultModelForProvider(provider: ProviderId): string {
  return MODEL_SUGGESTIONS_BY_PROVIDER[provider]?.[0] ?? DEFAULT_MODEL_BY_PROVIDER[provider];
}

export function resolveReasoningSetting(stored: unknown, configured: unknown): ReasoningEffort {
  if (isReasoningEffort(stored)) return stored;
  if (isReasoningEffort(configured)) return configured;
  return DEFAULT_REASONING_EFFORT;
}

export function resolveVerbositySetting(stored: unknown, configured: unknown): VerbositySetting {
  if (isVerbositySetting(stored)) return stored;
  if (isVerbositySetting(configured)) return configured;
  return DEFAULT_VERBOSITY;
}

export function resolveCodexReasoningSetting(stored: unknown, configured: unknown): CodexReasoningEffort {
  if (isCodexReasoningEffort(stored)) return stored;
  if (isCodexReasoningEffort(configured)) return configured;
  return DEFAULT_CODEX_REASONING_EFFORT;
}
