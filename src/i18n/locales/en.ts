import { UiStrings } from '../types';

const en: UiStrings = {
  langCode: 'en',
  appTitle: 'Commit Maker',

  languageSectionTitle: 'Display language',
  languageName: 'English',

  apiKeySectionTitle: 'API Key',
  apiKeyProviderLabel: 'Provider to save',
  apiKeyIssueButton: 'Get API key',
  apiKeyLabel: 'API Key',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: 'Save',
  apiKeyClearButton: 'Clear',

  llmSectionTitle: 'LLM Settings',
  providerLabel: 'Provider',
  modelLabel: 'Model',
  customModelLabel: 'Custom model name',
  customModelPlaceholder: 'example-model',
  reasoningLabel: 'Reasoning Effort (OpenAI only)',
  verbosityLabel: 'Verbosity (OpenAI only)',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI (GPT-5 family)',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: 'Prompt & options',
  presetNamePlaceholder: 'Preset name',
  presetAddButton: 'Add new',
  presetDeleteButton: 'Delete',
  promptTextareaPlaceholder: 'e.g., Write a title within 50 chars and bullet body in English.',
  includeUnstagedLabel: 'Include unstaged changes',
  includeUntrackedLabel: 'Include untracked files',
  includeBinaryLabel: 'Include suspected binary',
  maxPromptLabel: 'Prompt length limit',
  maxPromptUnlimited: 'Unlimited (default)',
  maxPromptLimited: 'Set a limit',
  maxPromptUnitLabel: 'chars',
  maxPromptHint:
    'Use when you need to cap tokens/cost. 0 or blank means unlimited. If exceeded, keep the first 20% and last 80%.',

  generationSectionTitle: 'Generate & result',
  generateButton: 'Generate',
  generateButtonTitle: 'Load diff and generate commit message',
  applyButton: 'Apply to SCM',
  applyButtonTitle: 'Copy result to the Source Control commit box',
  resultPlaceholder: 'Not generated yet.',
  resultHint: 'Review the result, then press "Apply to SCM" to copy it into the Source Control commit input.',
  errorPlaceholder: '-',

  statusIdle: 'Idle',
  statusLoading: 'Generating with LLM…',
  statusReady: 'Done',
  statusError: 'Error',
  badgeUnstagedOn: 'Staged + Unstaged',
  badgeUnstagedOff: 'Staged only',

  apiKeySaved: 'Saved',
  apiKeyNotSaved: 'Not saved',
  apiKeySavedPreviewPrefix: 'Saved: ',
  providerNeedKey: 'Save an API key first',
  modelNeedKey: 'You can pick a model after saving the API key.',
  customModelOption: 'Custom…',

  presetButtonNew: 'Save as new',
  presetButtonSaved: 'Saved',
  presetButtonOverwrite: 'Overwrite',
  presetTitleNew: 'Save as a new preset',
  presetTitleNoChange: 'No changes',
  presetTitleOverwrite: 'Overwrite the selected preset',

  defaultCommitPrompt: [
    'Write a title within 50 characters and, if needed, bullet body lines wrapped to 72 characters.',
    '- Avoid imperative mood; briefly state the change (no opinions or guesses)',
    '- Body lines start with "- "; include only when necessary, each within 72 characters',
    '- Add breaking changes and issue/PR numbers to the body when applicable',
    '- No AI opinions, apologies, or confidence notes. Facts only',
    '- Prefix the title with a Conventional Commit type',
    '- Output in English'
  ].join('\n'),
  defaultPresetLabel: 'Default (locked, editable)',
  providerDescriptionGemini: 'Calls Generative Language API (generateContent) directly.',
  providerDescriptionOpenAi: 'Uses Responses API / Chat Completions compatible endpoint.',
  providerDescriptionClaude: 'Uses Claude 3 messages API.',

  msgApiKeySaved: 'Saved the API key.',
  msgApiKeySavePick: 'Select a provider to save the API key',
  msgApiKeyInputPrompt: 'Enter API key for {provider}',

  msgCommitGenerateTitle: 'Commit message generation (Commit Maker)',
  msgCommitGenerateFetchingDiff: 'Fetching diff…',
  msgCommitGenerateCallingLlm: 'Querying LLM…',
  msgCommitGenerateFailedPrefix: 'Failed to generate commit message: ',
  msgCommitApplyProgress: 'Applying to SCM…',
  msgCommitApplySuccess: 'Applied the commit message to SCM input.',
  msgCommitNotGenerated: 'Generate a commit message first.',
  msgRepoNotFound: 'Git repository not found.',
  msgCancelled: 'Cancelled by user',
  msgDiffEmpty: 'No diff found. Check staged/changes.',
  msgUnsupportedProvider: 'Unsupported provider: {provider}',
  msgApiKeyMissing: '{provider} API key is not set. Save it in settings.',
  msgLlmEmptyOpenAi: 'OpenAI response was empty.',
  msgLlmEmptyGemini: 'Gemini response was empty.',
  msgLlmEmptyClaude: 'Claude response was empty.',
  msgHttpsInvalid: '{label} is invalid.',
  msgHttpsRequired: '{label} must start with https://. Check settings.',
  msgGitDiffFailed: 'Failed to run git diff: {detail}',
  msgGitStatusFailed: 'git status --porcelain failed: {detail}',
  msgUntrackedReadFailed: 'Failed to read untracked file: {path} ({detail})',
  msgUntrackedSkipBinary: 'Skipped untracked file (suspected binary): {path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: attempt {attempt}/{max}',
  logLlmRetry: '{label}: retrying in {delay}ms ({error})',

  toastSaved: '{action} at {timestamp}',
  toastDeleted: 'Deleted at {timestamp}',

  actionCreatedLabel: 'Created',
  actionUpdatedLabel: 'Updated',
  actionDeletedLabel: 'Deleted',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### Staged',
  diffSectionUnstaged: '### Unstaged',
  diffSectionUntracked: '### Untracked {path}',
  diffHeading: '# Diff'
};

export default en;
