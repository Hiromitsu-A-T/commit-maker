import { MODEL_SUGGESTIONS_BY_PROVIDER } from './constants';
import { PanelState } from './panelMessages';
import { CommitState } from './commitState';
import { STRINGS, DEFAULT_LANGUAGE } from './i18n/strings';

export function toPanelState(state: CommitState): Partial<PanelState> {
  const suggestions = MODEL_SUGGESTIONS_BY_PROVIDER[state.provider] || [];
  const language = state.language || DEFAULT_LANGUAGE;
  return {
    language,
    commitPrompt: state.prompt,
    promptPresets: state.promptPresets,
    activePromptPresetId: state.activePromptPresetId,
    commitProvider: state.provider,
    commitModel: state.model,
    commitCustomModel: state.customModel ?? state.model,
    commitModelSuggestions: [...suggestions],
    commitRecommendedModelsLabel: suggestions.join(', '),
    commitIncludeUnstaged: state.includeUnstaged,
    commitIncludeUntracked: state.includeUntracked,
    commitIncludeBinary: state.includeBinary,
    commitMaxPromptChars: state.maxPromptChars,
    commitMaxPromptMode: state.maxPromptMode,
    commitReasoning: state.reasoning,
    commitVerbosity: state.verbosity,
    strings: STRINGS[language] ?? STRINGS[DEFAULT_LANGUAGE],
    promptToast: state.promptToast
  };
}

export function withStatus(state: CommitState, status: PanelState['commitStatus']): Partial<PanelState> {
  return {
    commitStatus: status,
    commitResult: state.result,
    commitLastError: state.lastError
  };
}
