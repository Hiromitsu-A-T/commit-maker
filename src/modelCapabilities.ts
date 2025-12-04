// GPT-5 系は codex も含め text.verbosity をサポートしているためブロックしない。
import { ReasoningEffort, VerbositySetting } from './types';

export const VERBOSITY_BLOCKLIST: RegExp[] = [];

export function isVerbosityBlocked(model: string | undefined): boolean {
  const normalized = normalizeModelName(model);
  if (!normalized) {
    return false;
  }
  return VERBOSITY_BLOCKLIST.some(pattern => pattern.test(normalized));
}

function normalizeModelName(model: string | undefined): string {
  return (model ?? '').trim().toLowerCase();
}

export function supportsVerbosity(model: string): boolean {
  return !isVerbosityBlocked(model);
}

export function getVerbosityBlocklistPatterns(): string[] {
  return VERBOSITY_BLOCKLIST.map(pattern => pattern.source);
}

const ALLOWED_REASONING_BY_MODEL: Record<string, ReasoningEffort[]> = {
  'gpt-5.1': ['none', 'low', 'medium', 'high'],
  'gpt-5.1-codex': ['low', 'medium', 'high'],
  'gpt-5': ['minimal', 'low', 'medium', 'high'],
  'gpt-5-mini': ['minimal', 'low', 'medium', 'high'],
  'gpt-5-nano': ['minimal', 'low', 'medium', 'high'],
  'gpt-5.1-chat-latest': ['medium'], // 実測: reasoning=medium 固定
  'gpt-5-chat-latest': [], // Responses では reasoning.effort 非対応
  'gpt-5-pro': ['high'],
  'gpt-5-codex': ['low', 'medium', 'high'], // minimal不可
  'gpt-5.1-codex-mini': ['low', 'medium', 'high'] // none/minimal不可
};

export function getAllowedReasoningOptions(model: string | undefined): ReasoningEffort[] | undefined {
  if (!model) return undefined;
  const key = model.trim().toLowerCase();
  return ALLOWED_REASONING_BY_MODEL[key];
}

export function getAllowedReasoningMap(): Record<string, ReasoningEffort[]> {
  return { ...ALLOWED_REASONING_BY_MODEL };
}

export function getDefaultReasoningForModel(model: string | undefined): ReasoningEffort | undefined {
  const allowed = getAllowedReasoningOptions(model);
  if (!allowed || allowed.length === 0) return undefined;
  if (allowed.includes('none')) return 'none';
  if (allowed.includes('medium')) return 'medium';
  return allowed[0];
}

const ALLOWED_VERBOSITY_BY_MODEL: Record<string, VerbositySetting[]> = {
  'gpt-5.1-codex': ['medium'],
  'gpt-5-codex': ['medium'],
  'gpt-5.1-codex-mini': ['medium'],
  'gpt-5.1-chat-latest': ['medium'],
  'gpt-5-chat-latest': [] // Responses では text.verbosity も非対応（全400）
  // それ以外は low/medium/high を許容
};

export function getAllowedVerbosityOptions(model: string | undefined): VerbositySetting[] | undefined {
  if (!model) return undefined;
  const key = model.trim().toLowerCase();
  return ALLOWED_VERBOSITY_BY_MODEL[key];
}

export function getAllowedVerbosityMap(): Record<string, VerbositySetting[]> {
  return { ...ALLOWED_VERBOSITY_BY_MODEL };
}

export function getDefaultVerbosityForModel(model: string | undefined): VerbositySetting | undefined {
  const allowed = getAllowedVerbosityOptions(model);
  if (!allowed || allowed.length === 0) return undefined;
  if (allowed.includes('medium')) return 'medium';
  return allowed[0];
}
