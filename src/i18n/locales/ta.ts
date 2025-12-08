import { UiStrings } from '../types';

const ta: UiStrings = {
  langCode: 'ta',
  appTitle: 'Commit Maker',

  languageSectionTitle: 'காட்சியின் மொழி',
  languageName: 'தமிழ்',

  apiKeySectionTitle: 'API விசை',
  apiKeyProviderLabel: 'சேமிக்க வேண்டிய வழங்குநர்',
  apiKeyIssueButton: 'API விசை பெற',
  apiKeyLabel: 'API விசை',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: 'சேமிக்க',
  apiKeyClearButton: 'அழி',

  llmSectionTitle: 'LLM அமைப்புகள்',
  providerLabel: 'வழங்குநர்',
  modelLabel: 'மாதிரி',
  customModelLabel: 'விருப்ப மாதிரி பெயர்',
  customModelPlaceholder: 'example-model',
  reasoningLabel: 'Reasoning Effort (OpenAI மட்டும்)',
  verbosityLabel: 'விவர அளவு (OpenAI மட்டும்)',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI (GPT-5 தொடர்)',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: 'ப்ராம்ட் & விருப்பங்கள்',
  presetNamePlaceholder: 'பிரிசெட் பெயர்',
  presetAddButton: 'புதியது சேர்க்க',
  presetDeleteButton: 'அழி',
  promptTextareaPlaceholder: 'உதா: தமிழில் 50 எழுத்துகளுக்குள் தலைப்பு மற்றும் புள்ளி வடிவ உடலை எழுதவும்.',
  includeUnstagedLabel: 'unstaged மாற்றங்களை சேர்க்கவும்',
  includeUntrackedLabel: 'untracked கோப்புகளை சேர்க்கவும்',
  includeBinaryLabel: 'இயற்கை இரும (binary) கோப்புகளையும் சேர்க்கவும்',
  maxPromptLabel: 'ப்ராம்ட் நீளம் வரம்பு',
  maxPromptUnlimited: 'வரம்பில்லை (இயல்புநிலை)',
  maxPromptLimited: 'வரம்பு அமைக்க',
  maxPromptUnitLabel: 'எழுத்துகள்',
  maxPromptHint:
    'டோக்கன்/செலவை கட்டுப்படுத்த இப்பயன்பாடு. 0 அல்லது காலியாக இருப்பது வரம்பற்றது. மீறினால் முதல் 20% மற்றும் கடைசி 80% மட்டும் வைக்கப்படும்.',

  generationSectionTitle: 'உருவாக்கம் & முடிவு',
  generateButton: 'உருவாக்கு',
  generateButtonTitle: 'diff ஏற்று commit செய்தியை உருவாக்கு',
  applyButton: 'SCM-க்கு பிரயோகி',
  applyButtonTitle: 'முடிவை Source Control commit புலத்தில் நகலெடுக்கவும்',
  resultPlaceholder: 'இன்னும் உருவாக்கப்படவில்லை.',
  resultHint: 'முடிவை பார்வையிட்டு "SCM-க்கு பிரயோகி" அழுத்தி commit புலத்துக்கு நகலெடுக்கவும்.',
  errorPlaceholder: '-',

  statusIdle: 'காத்திருக்கிறது',
  statusLoading: 'LLM உருவாக்குகிறது…',
  statusReady: 'முடிந்தது',
  statusError: 'பிழை',
  badgeUnstagedOn: 'Staged + Unstaged',
  badgeUnstagedOff: 'Staged மட்டும்',

  apiKeySaved: 'சேமிக்கப்பட்டது',
  apiKeyNotSaved: 'சேமிக்கப்படவில்லை',
  apiKeySavedPreviewPrefix: 'சேமிக்கப்பட்டது: ',
  providerNeedKey: 'முதலில் API விசையை சேமிக்கவும்',
  modelNeedKey: 'API விசை சேமித்த பின் மாதிரியைத் தேர்வு செய்யலாம்.',
  customModelOption: 'விருப்பு…',

  presetButtonNew: 'புதியதாக சேமி',
  presetButtonSaved: 'சேமிக்கப்பட்டது',
  presetButtonOverwrite: 'மேலெழுது',
  presetTitleNew: 'புதிய பிரிசெட் ஆக சேமிக்க',
  presetTitleNoChange: 'மாற்றம் இல்லை',
  presetTitleOverwrite: 'தேர்ந்த பிரிசெட்டை மேலெழுது',

  defaultCommitPrompt: [
    '50 எழுத்துகள் வரை தலைப்பை எழுதவும்; தேவைப்படின் 72 எழுத்துகள் வரை புள்ளி வடிவ உடல் வரிகள்.',
    '- கட்டளைச் சொல்லைத் தவிர்க்கவும்; மாற்றத்தை சுருக்கமாகச் சொல்லவும் (கருத்து/ஊகம் இல்லை)',
    '- உடல் வரிகள் "- " எனத் தொடங்கவும்; தேவைப்பட்டால் மட்டும் சேர்க்கவும், வரி ஒன்றுக்கு 72 எழுத்துகள் வரை',
    '- தேவைக்கு ஏற்ப breaking changes மற்றும் issue/PR எண்களை உடலில் சேர்க்கவும்',
    '- AI கருத்துகள், மன்னிப்பு, நம்பிக்கை சொற்கள் இல்லை. உண்மை மட்டுமே',
    '- தலைப்பின் தொடக்கத்தில் Conventional Commits வகை முன்னொட்டையைச் சேர்க்கவும்',
    '- வெளியீடு தமிழில் இருக்கவேண்டும்'
  ].join('\n'),
  defaultPresetLabel: 'இயல்புநிலை (பூட்டியது, தொகுக்கலாம்)',
  providerDescriptionGemini: 'Generative Language API (generateContent) ஐ நேரடியாக அழைக்கிறது.',
  providerDescriptionOpenAi: 'Responses API / Chat Completions இணக்க endpoint பயன்படுத்துகிறது.',
  providerDescriptionClaude: 'Claude 3 messages API பயன்படுத்துகிறது.',

  msgApiKeySaved: 'API விசை சேமிக்கப்பட்டது.',
  msgApiKeySavePick: 'API விசை சேமிக்க வழங்குநரைத் தேர்ந்தெடுக்கவும்',
  msgApiKeyInputPrompt: '{provider} க்கு API விசை உள்ளிடவும்',

  msgCommitGenerateTitle: 'Commit செய்தி உருவாக்கம் (Commit Maker)',
  msgCommitGenerateFetchingDiff: 'diff பெற்றல்…',
  msgCommitGenerateCallingLlm: 'LLM-ஐ கேட்கிறது…',
  msgCommitGenerateFailedPrefix: 'Commit செய்தி உருவாக்கம் தோல்வி: ',
  msgCommitApplyProgress: 'SCM-க்கு பிரயோகிக்கிறது…',
  msgCommitApplySuccess: 'Commit செய்தி SCM உள்ளீட்டில் நகலெடுக்கப்பட்டது.',
  msgCommitNotGenerated: 'முதலில் commit செய்தி உருவாக்கவும்.',
  msgRepoNotFound: 'Git repository கிடைக்கவில்லை.',
  msgCancelled: 'பயனர் ரத்து செய்தார்',
  msgDiffEmpty: 'diff இல்லை. staged/changes சரிபார்க்கவும்.',
  msgUnsupportedProvider: 'ஆதரிக்கப்படாத வழங்குநர்: {provider}',
  msgApiKeyMissing: '{provider} க்கு API விசை அமைக்கப்படவில்லை. அமைப்பில் சேமிக்கவும்.',
  msgLlmEmptyOpenAi: 'OpenAI பதில் காலியாக இருந்தது.',
  msgLlmEmptyGemini: 'Gemini பதில் காலியாக இருந்தது.',
  msgLlmEmptyClaude: 'Claude பதில் காலியாக இருந்தது.',
  msgHttpsInvalid: '{label} தவறானது.',
  msgHttpsRequired: '{label} https:// இல் தொடங்க வேண்டும். அமைப்புகளை சரிபார்க்கவும்.',
  msgGitDiffFailed: 'git diff இயக்கு தோல்வி: {detail}',
  msgGitStatusFailed: 'git status --porcelain தோல்வி: {detail}',
  msgUntrackedReadFailed: 'untracked கோப்பை வாசிக்க முடியவில்லை: {path} ({detail})',
  msgUntrackedSkipBinary: 'untracked கோப்பு தவிர்க்கப்பட்டது (பைனரி சந்தேகம்): {path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: முயற்சி {attempt}/{max}',
  logLlmRetry: '{label}: {delay}ms இல் மீண்டும் முயற்சி ({error})',

  toastSaved: '{action} ({timestamp})',
  toastDeleted: 'நீக்கப்பட்டது ({timestamp})',

  actionCreatedLabel: 'உருவாக்கப்பட்டது',
  actionUpdatedLabel: 'புதுப்பிக்கப்பட்டது',
  actionDeletedLabel: 'நீக்கப்பட்டது',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### Staged',
  diffSectionUnstaged: '### Unstaged',
  diffSectionUntracked: '### Untracked {path}',
  diffHeading: '# Diff'
};

export default ta;
