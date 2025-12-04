import { ProviderId, ReasoningEffort, VerbositySetting, MaxPromptMode, LanguageCode } from './types';
import { UiStrings } from './i18n/types';

// Webview -> Extension
export type WebviewInboundMessage =
  | { type: 'ready' }
  | { type: 'apiKeyProviderChanged'; value: ProviderId }
  | { type: 'submitApiKey'; value: string; provider: ProviderId }
  | { type: 'commitPromptChanged'; value: string }
  | { type: 'savePromptPreset'; title: string; body: string }
  | { type: 'applyPromptPreset'; id: string }
  | { type: 'deletePromptPreset'; id: string }
  | { type: 'commitProviderChanged'; value: ProviderId }
  | { type: 'commitModelChanged'; value: string }
  | { type: 'commitCustomModelChanged'; value: string }
  | { type: 'commitIncludeUnstagedChanged'; value: boolean }
  | { type: 'commitIncludeUntrackedChanged'; value: boolean }
  | { type: 'commitIncludeBinaryChanged'; value: boolean }
  | { type: 'commitMaxPromptChanged'; value: { mode: MaxPromptMode; value: number | null } }
  | { type: 'commitReasoningChanged'; value: ReasoningEffort }
  | { type: 'commitVerbosityChanged'; value: VerbositySetting }
  | { type: 'commitGenerate'; value: { includeUnstaged: boolean; includeUntracked: boolean; includeBinary: boolean } }
  | { type: 'commitApply' }
  | { type: 'openExternal'; url: string }
  | { type: 'languageChanged'; value: LanguageCode };

// Extension -> Webview
export interface PanelState {
  language: LanguageCode;
  apiKeyProvider: ProviderId;
  apiKeys: Record<ProviderId, { ready: boolean; preview?: string; length?: number }>;
  commitPrompt: string;
  promptPresets: { id: string; label: string; prompt: string; isDefault?: boolean }[];
  activePromptPresetId?: string;
  commitProvider: ProviderId;
  commitModel: string;
  commitCustomModel: string;
  commitModelSuggestions: string[];
  commitRecommendedModelsLabel: string;
  commitStatus: 'idle' | 'loading' | 'ready' | 'error';
  commitResult?: string;
  commitLastError?: string;
  commitIncludeUnstaged: boolean;
  commitIncludeUntracked: boolean;
  commitIncludeBinary: boolean;
  commitMaxPromptChars?: number | null;
  commitMaxPromptMode?: MaxPromptMode;
  commitReasoning: ReasoningEffort;
  commitVerbosity: VerbositySetting;
  strings: UiStrings;
  promptToast?: string;
}

export type WebviewOutboundMessage = { type: 'state'; state: PanelState };
