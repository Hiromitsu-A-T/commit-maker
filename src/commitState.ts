import { ProviderId, ReasoningEffort, CodexReasoningEffort, VerbositySetting, PromptPreset, LanguageCode, LocalModelState } from './types';

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
  maxPromptChars?: number | null;
  maxPromptMode?: 'unlimited' | 'limited';
  status: 'idle' | 'loading' | 'ready' | 'error';
  result?: string;
  lastError?: string;
  progressMessage?: string;
  reasoning: ReasoningEffort;
  codexReasoning: CodexReasoningEffort;
  verbosity: VerbositySetting;
  promptToast?: string;
  language: LanguageCode;
  localModelId?: string;
  localModel?: LocalModelState;
}
