import { LanguageCode, isLanguageCode, SUPPORTED_LANG_CODES } from './i18n/languages';

export type ProviderId = 'openai' | 'gemini' | 'claude';
export type ReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high';
export type VerbositySetting = 'low' | 'medium' | 'high';
export type CommitStatus = 'idle' | 'loading' | 'ready' | 'error';
export type MaxPromptMode = 'unlimited' | 'limited';

export interface ProviderOption {
  id: ProviderId;
  label: string;
  badge: string;
  description: string;
  apiKeyPlaceholder: string;
}

export interface ProviderCapability extends ProviderOption {
  models: string[];
  defaultModel: string;
  issueUrl: string;
  defaultEndpoint: string;
  defaultSecret: string;
  supportsReasoning: boolean;
  supportsVerbosity: boolean;
}

export interface ApiKeyState {
  ready: boolean;
  preview?: string;
  length?: number;
}

export interface ApiKeySubmission {
  provider: ProviderId;
  value: string;
}

export interface PromptPreset {
  id: string;
  label: string;
  prompt: string;
  isDefault?: boolean;
}


export function isProviderId(value: unknown): value is ProviderId {
  return value === 'openai' || value === 'gemini' || value === 'claude';
}

export function isReasoningEffort(value: unknown): value is ReasoningEffort {
  return (
    value === 'none' ||
    value === 'minimal' ||
    value === 'low' ||
    value === 'medium' ||
    value === 'high'
  );
}

export function isVerbositySetting(value: unknown): value is VerbositySetting {
  return value === 'low' || value === 'medium' || value === 'high';
}

export { isLanguageCode, SUPPORTED_LANG_CODES, LanguageCode };
