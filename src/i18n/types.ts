import { LanguageCode } from './languages';

export interface UiStrings {
  langCode: string;
  appTitle: string;

  languageSectionTitle: string;
  languageName: string;

  apiKeySectionTitle: string;
  apiKeyProviderLabel: string;
  apiKeyIssueButton: string;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  apiKeySaveButton: string;
  apiKeyClearButton: string;

  llmSectionTitle: string;
  providerLabel: string;
  modelLabel: string;
  customModelLabel: string;
  customModelPlaceholder: string;
  reasoningLabel: string;
  verbosityLabel: string;
  providerLabelGemini: string;
  providerLabelOpenAi: string;
  providerLabelClaude: string;

  promptSectionTitle: string;
  presetNamePlaceholder: string;
  presetAddButton: string;
  presetDeleteButton: string;
  promptTextareaPlaceholder: string;
  includeUnstagedLabel: string;
  includeUntrackedLabel: string;
  includeBinaryLabel: string;
  maxPromptLabel: string;
  maxPromptUnlimited: string;
  maxPromptLimited: string;
  maxPromptHint: string;
  maxPromptUnitLabel: string;

  generationSectionTitle: string;
  generateButton: string;
  generateButtonTitle: string;
  applyButton: string;
  applyButtonTitle: string;
  resultPlaceholder: string;
  resultHint: string;
  errorPlaceholder: string;

  statusIdle: string;
  statusLoading: string;
  statusReady: string;
  statusError: string;
  badgeUnstagedOn: string;
  badgeUnstagedOff: string;

  apiKeySaved: string;
  apiKeyNotSaved: string;
  apiKeySavedPreviewPrefix: string;
  providerNeedKey: string;
  modelNeedKey: string;
  customModelOption: string;

  presetButtonNew: string;
  presetButtonSaved: string;
  presetButtonOverwrite: string;
  presetTitleNew: string;
  presetTitleNoChange: string;
  presetTitleOverwrite: string;

  defaultCommitPrompt: string;
  defaultPresetLabel: string;
  providerDescriptionGemini: string;
  providerDescriptionOpenAi: string;
  providerDescriptionClaude: string;

  msgApiKeySaved: string;
  msgApiKeySavePick: string;
  msgApiKeyInputPrompt: string;

  msgCommitGenerateTitle: string;
  msgCommitGenerateFetchingDiff: string;
  msgCommitGenerateCallingLlm: string;
  msgCommitGenerateFailedPrefix: string;
  msgCommitApplyProgress: string;
  msgCommitApplySuccess: string;
  msgCommitNotGenerated: string;
  msgRepoNotFound: string;
  msgCancelled: string;
  msgDiffEmpty: string;
  msgUnsupportedProvider: string;
  msgApiKeyMissing: string;
  msgLlmEmptyOpenAi: string;
  msgLlmEmptyGemini: string;
  msgLlmEmptyClaude: string;
  msgHttpsInvalid: string;
  msgHttpsRequired: string;
  msgGitDiffFailed: string;
  msgGitStatusFailed: string;
  msgUntrackedReadFailed: string;
  msgUntrackedSkipBinary: string;
  msgHttpError: string;
  logLlmAttempt: string;
  logLlmRetry: string;

  toastSaved: string;
  toastDeleted: string;

  actionCreatedLabel: string;
  actionUpdatedLabel: string;
  actionDeletedLabel: string;
  promptGuard: string;
  userInstructionLabel: string;
  diffSectionStaged: string;
  diffSectionUnstaged: string;
  diffSectionUntracked: string;
  diffHeading: string;
}

export type StringsMap = Record<LanguageCode, UiStrings>;
