import { LanguageCode, isLanguageCode, SUPPORTED_LANG_CODES } from './i18n/languages';

export type ProviderId = 'openai' | 'gemini' | 'claude' | 'codex' | 'local';
export type ProviderSetupMode = 'apiKey' | 'codexAuth' | 'localModel';
export type ReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
export type CodexReasoningEffort = 'low' | 'medium' | 'high' | 'xhigh';
export type VerbositySetting = 'low' | 'medium' | 'high';
export type CommitStatus = 'idle' | 'loading' | 'ready' | 'error';
export type MaxPromptMode = 'unlimited' | 'limited';
export type LocalGenerationProfileId = 'deterministic' | 'gemma4' | 'lfm25';
export type LocalRuntimeProfileId = 'default' | 'qwen3Thinking' | 'gemma4' | 'lfm25';
export type LocalRuntimeVersionId = 'b8967' | 'b9441';

export interface ProviderOption {
  id: ProviderId;
  label: string;
  badge: string;
  description: string;
  apiKeyPlaceholder: string;
  requiresApiKey: boolean;
  setupMode: ProviderSetupMode;
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

export type LocalModelStatus = 'notDownloaded' | 'downloading' | 'ready' | 'loading' | 'error';

export interface LocalModelState {
  id: string;
  label: string;
  status: LocalModelStatus;
  sizeLabel: string;
  downloadedBytes?: number;
  totalBytes?: number;
  path?: string;
  hasPartialDownload?: boolean;
  error?: string;
}

export interface LocalModelDefinition {
  id: string;
  label: string;
  filename: string;
  url: string;
  sha256: string;
  sizeBytes: number;
  contextSize: number;
  runtimeVersion?: LocalRuntimeVersionId;
  generationProfile?: LocalGenerationProfileId;
  generation?: Partial<LocalModelGenerationSettings>;
  runtimeProfile?: LocalRuntimeProfileId;
  runtime?: Partial<LocalModelRuntimeSettings>;
  legacyIds?: string[];
}

export interface LocalModelGenerationSettings {
  temperature?: number;
  topP?: number;
  topK?: number;
  minP?: number;
  repeatPenalty?: number;
  presencePenalty?: number;
  reasoningFormat?: string;
  chatTemplateKwargs?: Record<string, unknown>;
}

export interface LocalModelRuntimeSettings {
  reasoning?: 'off' | 'on';
  reasoningBudget?: number;
  cacheRamMb?: number;
  ctxCheckpoints?: number;
}

export interface LocalModelOption {
  id: string;
  label: string;
  sizeLabel: string;
}

export interface PromptPreset {
  id: string;
  label: string;
  prompt: string;
  isDefault?: boolean;
}


export function isProviderId(value: unknown): value is ProviderId {
  return value === 'openai' || value === 'gemini' || value === 'claude' || value === 'codex' || value === 'local';
}

export function isReasoningEffort(value: unknown): value is ReasoningEffort {
  return (
    value === 'none' ||
    value === 'minimal' ||
    value === 'low' ||
    value === 'medium' ||
    value === 'high' ||
    value === 'xhigh'
  );
}

export function isCodexReasoningEffort(value: unknown): value is CodexReasoningEffort {
  return value === 'low' || value === 'medium' || value === 'high' || value === 'xhigh';
}

export function isVerbositySetting(value: unknown): value is VerbositySetting {
  return value === 'low' || value === 'medium' || value === 'high';
}

export { isLanguageCode, SUPPORTED_LANG_CODES, LanguageCode };
