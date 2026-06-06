import {
  ProviderCapability,
  ProviderId,
  PromptPreset,
  ProviderOption,
  CodexReasoningEffort,
  ReasoningEffort,
  VerbositySetting,
  LocalModelDefinition,
  LocalRuntimeVersionId
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
export const COMMIT_API_KEY_PROVIDER_STORAGE_KEY = 'commitMaker.apiKeyProvider';
export const COMMIT_MODEL_STORAGE_KEY = 'commitMaker.commitModel';
export const COMMIT_INCLUDE_UNSTAGED_STORAGE_KEY = 'commitMaker.commitIncludeUnstaged';
export const COMMIT_INCLUDE_UNTRACKED_STORAGE_KEY = 'commitMaker.commitIncludeUntracked';
export const COMMIT_INCLUDE_BINARY_STORAGE_KEY = 'commitMaker.commitIncludeBinary';
export const COMMIT_REASONING_STORAGE_KEY = 'commitMaker.commitReasoning';
export const COMMIT_CODEX_REASONING_STORAGE_KEY = 'commitMaker.commitCodexReasoning';
export const COMMIT_VERBOSITY_STORAGE_KEY = 'commitMaker.commitVerbosity';
export const COMMIT_MAX_PROMPT_CHARS_STORAGE_KEY = 'commitMaker.commitMaxPromptChars';
export const COMMIT_LOCAL_MODEL_STORAGE_KEY = 'commitMaker.localModelId';
export const COMMIT_LANGUAGE_STORAGE_KEY = 'commitMaker.language';
export const LEGACY_DEFAULT_LOCAL_MODEL_ID = 'commit-maker-local-qwen3-4b';
export const DEFAULT_LOCAL_MODEL_ID = 'Qwen3-4B-Instruct-2507-Q4_K_M';
export const GEMMA4_LOCAL_MODEL_ID = 'Gemma-4-E4B-it-Q4_K_M';
export const LFM25_LOCAL_MODEL_ID = 'LFM2.5-8B-A1B-Q4_K_M';
export const DEFAULT_LOCAL_RUNTIME_VERSION: LocalRuntimeVersionId = 'b8967';
export const LOCAL_MODEL_DEFINITIONS: LocalModelDefinition[] = [
  {
    id: DEFAULT_LOCAL_MODEL_ID,
    label: 'Qwen3-4B-Instruct-2507 Q4_K_M',
    filename: 'qwen3-4b-instruct-2507-q4_k_m.gguf',
    url: 'https://huggingface.co/Edge-Quant/Qwen3-4B-Instruct-2507-Q4_K_M-GGUF/resolve/main/qwen3-4b-instruct-2507-q4_k_m.gguf',
    sha256: '1571ec5115bcfed4b4327fc27b5f44ea284806caf5331eef89326191c9b031d6',
    sizeBytes: 2_497_279_136,
    contextSize: 262_144,
    runtimeVersion: DEFAULT_LOCAL_RUNTIME_VERSION,
    generationProfile: 'deterministic',
    legacyIds: [LEGACY_DEFAULT_LOCAL_MODEL_ID]
  },
  {
    id: 'Qwen3-4B-Thinking-2507-Q4_K_M',
    label: 'Qwen3-4B-Thinking-2507 Q4_K_M',
    filename: 'Qwen3-4B-Thinking-2507-Q4_K_M.gguf',
    url: 'https://huggingface.co/unsloth/Qwen3-4B-Thinking-2507-GGUF/resolve/main/Qwen3-4B-Thinking-2507-Q4_K_M.gguf',
    sha256: 'ddd52e18200baab281c5c46f70d544ce4d4fe4846eab1608f2fff48a64554212',
    sizeBytes: 2_497_281_152,
    contextSize: 262_144,
    runtimeVersion: DEFAULT_LOCAL_RUNTIME_VERSION,
    generationProfile: 'deterministic',
    runtimeProfile: 'qwen3Thinking'
  },
  {
    id: GEMMA4_LOCAL_MODEL_ID,
    label: 'Gemma 4 E4B IT Q4_K_M',
    filename: 'gemma-4-E4B-it-Q4_K_M.gguf',
    url: 'https://huggingface.co/ggml-org/gemma-4-E4B-it-GGUF/resolve/main/gemma-4-E4B-it-Q4_K_M.gguf',
    sha256: '90ce98129eb3e8cc57e62433d500c97c624b1e3af1fcc85dd3b55ad7e0313e9f',
    sizeBytes: 5_335_289_824,
    contextSize: 32_768,
    runtimeVersion: DEFAULT_LOCAL_RUNTIME_VERSION,
    generationProfile: 'gemma4',
    runtimeProfile: 'gemma4'
  },
  {
    id: LFM25_LOCAL_MODEL_ID,
    label: 'LFM2.5-8B-A1B Q4_K_M',
    filename: 'LFM2.5-8B-A1B-Q4_K_M.gguf',
    url: 'https://huggingface.co/LiquidAI/LFM2.5-8B-A1B-GGUF/resolve/main/LFM2.5-8B-A1B-Q4_K_M.gguf',
    sha256: '4923ec14f06b968b74d663e5949867d2d9c3bf13a20b8be1a9f9af39989b2bb0',
    sizeBytes: 5_155_564_768,
    contextSize: 131_072,
    runtimeVersion: 'b9441',
    generationProfile: 'lfm25',
    runtimeProfile: 'lfm25'
  }
];
export const DEFAULT_LOCAL_MODEL = LOCAL_MODEL_DEFINITIONS[0];
export const DEFAULT_LOCAL_MODEL_FILENAME = DEFAULT_LOCAL_MODEL.filename;
export const DEFAULT_LOCAL_MODEL_URL = DEFAULT_LOCAL_MODEL.url;
export const DEFAULT_LOCAL_MODEL_SHA256 = DEFAULT_LOCAL_MODEL.sha256;
export const DEFAULT_LOCAL_MODEL_SIZE_BYTES = DEFAULT_LOCAL_MODEL.sizeBytes;
export const DEFAULT_LOCAL_CONTEXT_SIZE = 32768;
export const DEFAULT_LOCAL_GPU_LAYERS = 99;
export const DEFAULT_LOCAL_KEEP_ALIVE_MS = 300000;
export const DEFAULT_LOCAL_MAX_OUTPUT_TOKENS = 4096;

export const REASONING_EFFORT_OPTIONS: ReasoningEffort[] = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh'];
export const DEFAULT_REASONING_EFFORT: ReasoningEffort = 'none';
export const CODEX_REASONING_EFFORT_OPTIONS: CodexReasoningEffort[] = ['low', 'medium', 'high', 'xhigh'];
export const DEFAULT_CODEX_REASONING_EFFORT: CodexReasoningEffort = 'low';
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
      requiresApiKey: true,
      setupMode: 'apiKey',
      models: [
        'gemini-2.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-3.5-flash',
        'gemini-3-flash-preview',
        'gemini-2.5-flash',
        'gemini-2.5-pro'
      ],
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
      requiresApiKey: true,
      setupMode: 'apiKey',
      models: [
        'gpt-5.4-nano',
        'gpt-5.4-mini',
        'gpt-5.4',
        'gpt-5.5',
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
      defaultModel: 'gpt-5.4-nano',
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
      requiresApiKey: true,
      setupMode: 'apiKey',
      models: [
        'claude-haiku-4-5',
        'claude-sonnet-4-6',
        'claude-opus-4-8',
        'claude-haiku-4-5-20251001',
        'claude-sonnet-4-5-20250929',
        'claude-opus-4-5-20251101',
        'claude-opus-4-1-20250805',
        'claude-opus-4-20250514',
        'claude-sonnet-4-20250514'
      ],
      defaultModel: 'claude-haiku-4-5',
      issueUrl: 'https://console.anthropic.com/settings/keys',
      defaultEndpoint: 'https://api.anthropic.com/v1/messages',
      defaultSecret: 'commit-maker/api-key/claude',
      supportsReasoning: false,
      supportsVerbosity: false
    },
    {
      id: 'codex',
      label: strings.providerLabelCodex ?? 'OpenAI Codex',
      badge: 'Codex',
      description: strings.providerDescriptionCodex ?? 'Uses Commit Maker dedicated Codex authentication through Codex CLI.',
      apiKeyPlaceholder: '',
      requiresApiKey: false,
      setupMode: 'codexAuth',
      models: [
        'gpt-5.5',
        'gpt-5.4-mini',
        'gpt-5.4',
        'gpt-5.3-codex-spark'
      ],
      defaultModel: 'gpt-5.5',
      issueUrl: 'https://developers.openai.com/codex/auth',
      defaultEndpoint: '',
      defaultSecret: '',
      supportsReasoning: true,
      supportsVerbosity: false
    },
    {
      id: 'local',
      label: strings.providerLabelLocal,
      badge: 'Local',
      description: strings.providerDescriptionLocal,
      apiKeyPlaceholder: '',
      requiresApiKey: false,
      setupMode: 'localModel',
      models: LOCAL_MODEL_DEFINITIONS.map(model => model.id),
      defaultModel: DEFAULT_LOCAL_MODEL_ID,
      issueUrl: 'https://huggingface.co/Edge-Quant/Qwen3-4B-Instruct-2507-Q4_K_M-GGUF',
      defaultEndpoint: 'http://127.0.0.1',
      defaultSecret: '',
      supportsReasoning: false,
      supportsVerbosity: false
    }
  ];
}

export const PROVIDER_CAPABILITIES: ProviderCapability[] = buildProviderCapabilities(getStrings(DEFAULT_LANGUAGE));

// 派生データ（既存 API 互換のまま残す）
export function buildProviderOptions(capabilities: ProviderCapability[] = PROVIDER_CAPABILITIES): ProviderOption[] {
  return capabilities.map(({ id, label, badge, description, apiKeyPlaceholder, requiresApiKey, setupMode }) => ({
    id,
    label,
    badge,
    description,
    apiKeyPlaceholder,
    requiresApiKey,
    setupMode
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
