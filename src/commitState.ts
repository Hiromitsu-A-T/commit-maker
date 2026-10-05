import { ProviderId, ReasoningEffort, CodexReasoningEffort, VerbositySetting, PromptPreset, LanguageCode, LocalModelState, CommitStatus, MaxPromptMode } from './types';

/** 保存値を復元・正規化した後の状態。生成と画面更新の所有者は controller に揃える。 */
export interface CommitState {
  prompt: string;
  promptPresets: PromptPreset[];
  activePromptPresetId?: string;
  apiKeyProvider: ProviderId;
  provider: ProviderId;
  model: string;
  customModel?: string;
  includeUnstaged: boolean;
  includeUntracked: boolean;
  includeBinary: boolean;
  maxPromptChars: number | null;
  maxPromptMode: MaxPromptMode;
  status: CommitStatus;
  result?: string;
  lastError?: string;
  progressMessage?: string;
  reasoning: ReasoningEffort;
  codexReasoning: CodexReasoningEffort;
  verbosity: VerbositySetting;
  promptToast?: string;
  language: LanguageCode;
  localModelId: string;
  localModel: LocalModelState;
}
