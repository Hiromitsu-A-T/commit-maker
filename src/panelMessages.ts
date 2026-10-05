import { ProviderId, ReasoningEffort, CodexReasoningEffort, VerbositySetting, MaxPromptMode, LanguageCode, LocalModelState, ApiKeyState, ApiKeySubmission, CommitStatus } from './types';
import { UiStrings } from './i18n/types';

// 画面からの要求。type を検査すると、その種類の引数まで型が絞り込まれる。
export type WebviewInboundMessage =
  | { type: 'ready' }
  | { type: 'apiKeyProviderChanged'; value: ProviderId }
  | ({ type: 'submitApiKey' } & ApiKeySubmission)
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
  | { type: 'commitCodexReasoningChanged'; value: CodexReasoningEffort }
  | { type: 'commitVerbosityChanged'; value: VerbositySetting }
  | { type: 'localModelChanged'; value: string }
  | { type: 'localModelDownload' }
  | { type: 'localModelCancelDownload' }
  | { type: 'localModelDelete' }
  | { type: 'localModelTest' }
  | { type: 'localModelRefresh' }
  | { type: 'codexLogin' }
  | { type: 'codexLogout' }
  | { type: 'codexRefresh' }
  | { type: 'commitGenerate'; value: { includeUnstaged: boolean; includeUntracked: boolean; includeBinary: boolean } }
  | { type: 'commitApply' }
  | { type: 'openExternal'; url: string }
  | { type: 'languageChanged'; value: LanguageCode };

// host が送る描画用の状態。API キーの値は含めず、保存状態と伏せ字だけを渡す。
export interface PanelState {
  language: LanguageCode;
  apiKeyProvider: ProviderId;
  apiKeys: Record<ProviderId, ApiKeyState>;
  commitPrompt: string;
  promptPresets: { id: string; label: string; prompt: string; isDefault?: boolean }[];
  activePromptPresetId?: string;
  commitProvider: ProviderId;
  commitModel: string;
  commitCustomModel: string;
  commitModelSuggestions: string[];
  commitRecommendedModelsLabel: string;
  commitStatus: CommitStatus;
  commitResult?: string;
  commitLastError?: string;
  commitProgress?: string;
  commitIncludeUnstaged: boolean;
  commitIncludeUntracked: boolean;
  commitIncludeBinary: boolean;
  commitMaxPromptChars?: number | null;
  commitMaxPromptMode?: MaxPromptMode;
  commitReasoning: ReasoningEffort;
  commitCodexReasoning: CodexReasoningEffort;
  commitVerbosity: VerbositySetting;
  localModel: LocalModelState;
  strings: UiStrings;
  promptToast?: string;
}

export type WebviewOutboundMessage = { type: 'state'; state: PanelState };
