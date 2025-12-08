import {
  ProviderCapability,
  ProviderId,
  PromptPreset,
  ProviderOption,
  ReasoningEffort,
  VerbositySetting
} from './types';
import { DEFAULT_LANGUAGE, getStrings } from './i18n/strings';
import { UiStrings } from './i18n/types';
import { LanguageCode } from './i18n/languages';

export function getDefaultCommitPrompt(language: LanguageCode = DEFAULT_LANGUAGE): string {
  return getStrings(language).defaultCommitPrompt;
}

export function getDefaultPromptPresets(language: LanguageCode = DEFAULT_LANGUAGE): PromptPreset[] {
  const strings = getStrings(language);
  return [
    {
      id: 'default',
      label: strings.defaultPresetLabel,
      prompt: strings.defaultCommitPrompt,
      isDefault: true
    }
  ];
}

export const DEFAULT_COMMIT_PROMPT = getDefaultCommitPrompt();
export const PROMPT_PRESETS: PromptPreset[] = getDefaultPromptPresets();

export const COMMIT_PROMPT_STORAGE_KEY = 'commitMaker.commitPrompt';
export const PROMPT_PRESETS_STORAGE_KEY = 'commitMaker.promptPresets';
export const ACTIVE_PROMPT_PRESET_STORAGE_KEY = 'commitMaker.promptPreset.active';
export const COMMIT_PROVIDER_STORAGE_KEY = 'commitMaker.commitProvider';
export const COMMIT_MODEL_STORAGE_KEY = 'commitMaker.commitModel';
export const COMMIT_INCLUDE_UNSTAGED_STORAGE_KEY = 'commitMaker.commitIncludeUnstaged';
export const COMMIT_INCLUDE_UNTRACKED_STORAGE_KEY = 'commitMaker.commitIncludeUntracked';
export const COMMIT_INCLUDE_BINARY_STORAGE_KEY = 'commitMaker.commitIncludeBinary';
export const COMMIT_REASONING_STORAGE_KEY = 'commitMaker.commitReasoning';
export const COMMIT_VERBOSITY_STORAGE_KEY = 'commitMaker.commitVerbosity';
export const COMMIT_MAX_PROMPT_CHARS_STORAGE_KEY = 'commitMaker.commitMaxPromptChars';
export const COMMIT_LANGUAGE_STORAGE_KEY = 'commitMaker.language';

export const REASONING_EFFORT_OPTIONS: ReasoningEffort[] = ['none', 'minimal', 'low', 'medium', 'high'];
export const DEFAULT_REASONING_EFFORT: ReasoningEffort = 'none';
export const VERBOSITY_OPTIONS: VerbositySetting[] = ['low', 'medium', 'high'];
export const DEFAULT_VERBOSITY: VerbositySetting = 'medium';
export const ANTHROPIC_API_VERSION = '2023-06-01';
export const DEFAULT_CLAUDE_MAX_TOKENS = 2048;
export const DEFAULT_MAX_OUTPUT_TOKENS = 8192;
export const GEMINI_GENERATE_SUFFIX = ':generateContent';

// プロバイダー能力を一元管理
export function buildProviderCapabilities(strings: UiStrings): ProviderCapability[] {
  return [
    {
      id: 'gemini',
      label: strings.providerLabelGemini,
      badge: 'Gemini',
      description: strings.providerDescriptionGemini,
      apiKeyPlaceholder: 'AIza...',
      models: ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-pro'],
      defaultModel: 'gemini-2.5-flash-lite',
      issueUrl: 'https://aistudio.google.com/app/api-keys',
      defaultEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
      defaultSecret: 'commit-maker/api-key/gemini',
      supportsReasoning: false,
      supportsVerbosity: false
    },
    {
      id: 'openai',
      label: strings.providerLabelOpenAi,
      badge: 'OpenAI',
      description: strings.providerDescriptionOpenAi,
      apiKeyPlaceholder: 'sk-...',
      models: [
        'gpt-5-nano',
        'gpt-5-mini',
        'gpt-5',
        'gpt-5.1',
        'gpt-5-pro',
        'gpt-5-codex',
        'gpt-5.1-codex',
        'gpt-5.1-codex-mini'
        // 'gpt-5.1-chat-latest', 'gpt-5-chat-latest' は Responses 非対応のためデフォルト候補から除外
      ],
      defaultModel: 'gpt-5-nano',
      issueUrl: 'https://platform.openai.com/api-keys',
      defaultEndpoint: 'https://api.openai.com/v1/responses',
      defaultSecret: 'commit-maker/api-key',
      supportsReasoning: true,
      supportsVerbosity: true
    },
    {
      id: 'claude',
      label: strings.providerLabelClaude,
      badge: 'Claude',
      description: strings.providerDescriptionClaude,
      apiKeyPlaceholder: 'sk-ant-...',
      models: [
        'claude-haiku-4-5-20251001',
        'claude-sonnet-4-5-20250929',
        'claude-opus-4-5-20251101',
        'claude-opus-4-1-20250805',
        'claude-opus-4-20250514',
        'claude-sonnet-4-20250514'
      ],
      defaultModel: 'claude-haiku-4-5-20251001',
      issueUrl: 'https://console.anthropic.com/settings/keys',
      defaultEndpoint: 'https://api.anthropic.com/v1/messages',
      defaultSecret: 'commit-maker/api-key/claude',
      supportsReasoning: false,
      supportsVerbosity: false
    }
  ];
}

export const PROVIDER_CAPABILITIES: ProviderCapability[] = buildProviderCapabilities(getStrings(DEFAULT_LANGUAGE));

// 派生データ（既存 API 互換のまま残す）
export function buildProviderOptions(capabilities: ProviderCapability[] = PROVIDER_CAPABILITIES): ProviderOption[] {
  return capabilities.map(({ id, label, badge, description, apiKeyPlaceholder }) => ({
    id,
    label,
    badge,
    description,
    apiKeyPlaceholder
  }));
}

export function buildProviderIssueUrls(
  capabilities: ProviderCapability[] = PROVIDER_CAPABILITIES
): Record<ProviderId, string> {
  return Object.fromEntries(capabilities.map(p => [p.id, p.issueUrl])) as Record<ProviderId, string>;
}

export function buildModelSuggestionsByProvider(
  capabilities: ProviderCapability[] = PROVIDER_CAPABILITIES
): Record<ProviderId, readonly string[]> {
  const entries = Object.fromEntries(capabilities.map(p => [p.id, p.models]));
  return entries as unknown as Record<ProviderId, readonly string[]>;
}

export function buildDefaultModelByProvider(
  capabilities: ProviderCapability[] = PROVIDER_CAPABILITIES
): Record<ProviderId, string> {
  const entries = Object.fromEntries(capabilities.map(p => [p.id, p.defaultModel]));
  return entries as unknown as Record<ProviderId, string>;
}

export function buildDefaultProviderEndpoints(
  capabilities: ProviderCapability[] = PROVIDER_CAPABILITIES
): Record<ProviderId, string> {
  const entries = Object.fromEntries(capabilities.map(p => [p.id, p.defaultEndpoint]));
  return entries as unknown as Record<ProviderId, string>;
}

export function buildDefaultProviderSecrets(
  capabilities: ProviderCapability[] = PROVIDER_CAPABILITIES
): Record<ProviderId, string> {
  const entries = Object.fromEntries(capabilities.map(p => [p.id, p.defaultSecret]));
  return entries as unknown as Record<ProviderId, string>;
}

export const PROVIDER_OPTIONS: ProviderOption[] = buildProviderOptions();

export const PROVIDER_ISSUE_URLS: Record<ProviderId, string> = buildProviderIssueUrls();

export const MODEL_SUGGESTIONS_BY_PROVIDER: Record<ProviderId, readonly string[]> =
  buildModelSuggestionsByProvider();

export const DEFAULT_PROVIDER: ProviderId = 'gemini';

export const DEFAULT_MODEL_BY_PROVIDER: Record<ProviderId, string> = buildDefaultModelByProvider();

export const DEFAULT_PROVIDER_ENDPOINTS: Record<ProviderId, string> = buildDefaultProviderEndpoints();

export const DEFAULT_PROVIDER_SECRETS: Record<ProviderId, string> = buildDefaultProviderSecrets();
