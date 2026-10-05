// モデル固有の許可値と既定値を、画面と API 呼び出しで共有する。
import { ReasoningEffort, VerbositySetting } from './types';

// 空配列は Responses API 非対応、未登録はカスタムモデルの指定を通す。
const ALLOWED_REASONING_BY_MODEL: Record<string, ReasoningEffort[]> = {
  'gpt-5.6': ['none', 'low', 'medium', 'high', 'xhigh', 'max'],
  'gpt-5.6-sol': ['none', 'low', 'medium', 'high', 'xhigh', 'max'],
  'gpt-5.6-terra': ['none', 'low', 'medium', 'high', 'xhigh', 'max'],
  'gpt-5.6-luna': ['none', 'low', 'medium', 'high', 'xhigh', 'max'],
  'gpt-5.5': ['none', 'low', 'medium', 'high', 'xhigh'],
  'gpt-5.4': ['none', 'low', 'medium', 'high', 'xhigh'],
  'gpt-5.4-mini': ['none', 'low', 'medium', 'high', 'xhigh'],
  'gpt-5.4-nano': ['none', 'low', 'medium', 'high', 'xhigh'],
  'gpt-5.4-pro': ['medium', 'high', 'xhigh'],
  'gpt-5.5-pro': ['medium', 'high', 'xhigh'],
  'gpt-5.3-codex': ['low', 'medium', 'high', 'xhigh'],
  'gpt-5.2': ['none', 'low', 'medium', 'high', 'xhigh'],
  'gpt-5.2-pro': ['medium', 'high', 'xhigh'],
  'gpt-5.2-codex': ['low', 'medium', 'high', 'xhigh'],
  'gpt-5.1': ['none', 'low', 'medium', 'high'],
  'gpt-5.1-codex': ['low', 'medium', 'high'],
  'gpt-5.1-codex-max': ['low', 'medium', 'high', 'xhigh'],
  'gpt-5': ['minimal', 'low', 'medium', 'high'],
  'gpt-5-mini': ['minimal', 'low', 'medium', 'high'],
  'gpt-5-nano': ['minimal', 'low', 'medium', 'high'],
  'gpt-5.1-chat-latest': ['medium'],
  'gpt-5-chat-latest': [],
  'gpt-5-pro': ['high'],
  'gpt-5-codex': ['low', 'medium', 'high'],
  'gpt-5.1-codex-mini': ['low', 'medium', 'high']
};

const DEFAULT_REASONING_BY_MODEL: Record<string, ReasoningEffort> = {
  'gpt-5.6': 'medium',
  'gpt-5.6-sol': 'medium',
  'gpt-5.6-terra': 'medium',
  'gpt-5.6-luna': 'medium',
  'gpt-5.5': 'medium',
  'gpt-5.5-pro': 'high',
  'gpt-5.4': 'none',
  'gpt-5.4-mini': 'none',
  'gpt-5.4-nano': 'none',
  'gpt-5.4-pro': 'medium',
  'gpt-5.3-codex': 'medium',
  'gpt-5.2': 'none',
  'gpt-5.2-pro': 'medium',
  'gpt-5.2-codex': 'medium',
  'gpt-5.1': 'none',
  'gpt-5.1-codex': 'medium',
  'gpt-5.1-codex-max': 'medium',
  'gpt-5': 'medium',
  'gpt-5-mini': 'medium',
  'gpt-5-nano': 'medium',
  'gpt-5-pro': 'high',
  'gpt-5-codex': 'medium',
  'gpt-5.1-codex-mini': 'medium',
  'gpt-5.1-chat-latest': 'medium'
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
  const key = model?.trim().toLowerCase() ?? '';
  const configuredDefault = DEFAULT_REASONING_BY_MODEL[key];
  if (configuredDefault && allowed.includes(configuredDefault)) return configuredDefault;
  if (allowed.includes('none')) return 'none';
  if (allowed.includes('medium')) return 'medium';
  return allowed[0];
}

const ALLOWED_VERBOSITY_BY_MODEL: Record<string, VerbositySetting[]> = {
  'gpt-5.1-codex': ['medium'],
  'gpt-5.1-codex-max': ['medium'],
  'gpt-5.2-codex': ['medium'],
  'gpt-5-codex': ['medium'],
  'gpt-5.1-codex-mini': ['medium'],
  'gpt-5.1-chat-latest': ['medium'],
  'gpt-5-chat-latest': []
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
