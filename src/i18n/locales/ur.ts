import { UiStrings } from '../types';

const ur: UiStrings = {
  langCode: 'ur',
  appTitle: 'Commit Maker',

  languageSectionTitle: 'ڈسپلے زبان',
  languageName: 'اردو',

  apiKeySectionTitle: 'API کلید',
  apiKeyProviderLabel: 'محفوظ کرنے کے لیے فراہم کنندہ',
  apiKeyIssueButton: 'API کلید حاصل کریں',
  apiKeyLabel: 'API کلید',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: 'محفوظ کریں',
  apiKeyClearButton: 'حذف کریں',

  llmSectionTitle: 'LLM سیٹنگز',
  providerLabel: 'فراہم کنندہ',
  modelLabel: 'ماڈل',
  customModelLabel: 'کسٹم ماڈل نام',
  customModelPlaceholder: 'مثال: example-model',
  reasoningLabel: 'Reasoning Effort (صرف OpenAI)',
  verbosityLabel: 'Verbosity (صرف OpenAI)',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI (GPT-5 فیملی)',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: 'پرامپٹ اور اختیارات',
  presetNamePlaceholder: 'پری سیٹ نام',
  presetAddButton: 'نیا شامل کریں',
  presetDeleteButton: 'حذف کریں',
  promptTextareaPlaceholder: 'مثلاً: 50 حروف میں عنوان اور ضرورت ہو تو انگریزی بلٹ باڈی۔',
  includeUnstagedLabel: 'غیر اسٹیجڈ تبدیلیاں شامل کریں',
  includeUntrackedLabel: 'ان ٹریکڈ فائلیں شامل کریں',
  includeBinaryLabel: 'مشکوک بائنری شامل کریں',
  maxPromptLabel: 'پرامپٹ لمبائی حد',
  maxPromptUnlimited: 'غیر محدود (ڈیفالٹ)',
  maxPromptLimited: 'حد مقرر کریں',
  maxPromptUnitLabel: 'حروف',
  maxPromptHint:
    'ٹوکین/کاسٹ محدود رکھنے کے لیے استعمال کریں۔ 0 یا خالی = غیر محدود۔ حد سے زائد ہونے پر ابتدا کے 20% اور آخر کے 80% کو رکھیں۔',

  generationSectionTitle: 'جنریشن اور نتیجہ',
  generateButton: 'جنریٹ کریں',
  generateButtonTitle: 'diff لوڈ کریں اور کمیٹ پیغام بنائیں',
  applyButton: 'SCM پر لگائیں',
  applyButtonTitle: 'نتیجہ سورس کنٹرول کمیٹ باکس میں کاپی کریں',
  resultPlaceholder: 'ابھی تک تیار نہیں ہوا۔',
  resultHint: 'نتیجہ دیکھیں، پھر "SCM پر لگائیں" دبا کر سورس کنٹرول کمیٹ ان پٹ میں کاپی کریں۔',
  errorPlaceholder: '-',

  statusIdle: 'Idle',
  statusLoading: 'LLM سے بنا رہا ہے…',
  statusReady: 'مکمل',
  statusError: 'خرابی',
  badgeUnstagedOn: 'Staged + Unstaged',
  badgeUnstagedOff: 'صرف Staged',

  apiKeySaved: 'محفوظ',
  apiKeyNotSaved: 'محفوظ نہیں',
  apiKeySavedPreviewPrefix: 'محفوظ: ',
  providerNeedKey: 'پہلے API کلید محفوظ کریں',
  modelNeedKey: 'API کلید محفوظ کرنے کے بعد ماڈل منتخب کریں۔',
  customModelOption: 'کسٹم…',

  presetButtonNew: 'نیا محفوظ کریں',
  presetButtonSaved: 'محفوظ',
  presetButtonOverwrite: 'اوور رائٹ',
  presetTitleNew: 'نئے پری سیٹ کے طور پر محفوظ کریں',
  presetTitleNoChange: 'کوئی تبدیلی نہیں',
  presetTitleOverwrite: 'منتخب پری سیٹ اوور رائٹ کریں',

  defaultCommitPrompt: [
    'Write a title within 50 characters and, if needed, bullet body lines wrapped to 72 characters.',
    '- Avoid imperative mood; briefly state the change (no opinions or guesses)',
    '- Body lines start with "- "; include only when necessary, each within 72 characters',
    '- Add breaking changes and issue/PR numbers to the body when applicable',
    '- No AI opinions, apologies, or confidence notes. Facts only',
    '- Prefix the title with a Conventional Commit type',
    '- Output in English'
  ].join('\n'),
  defaultPresetLabel: 'ڈیفالٹ (لاک، ایڈیٹ ایبل)',
  providerDescriptionGemini: 'Generative Language API (generateContent) کو براہِ راست کال کرتا ہے۔',
  providerDescriptionOpenAi: 'Responses API / Chat Completions مطابقتی اینڈ پوائنٹ استعمال کرتا ہے۔',
  providerDescriptionClaude: 'Claude 3 messages API استعمال کرتا ہے۔',

  msgApiKeySaved: 'API کلید محفوظ ہو گئی۔',
  msgApiKeySavePick: 'محفوظ کرنے کے لیے فراہم کنندہ منتخب کریں',
  msgApiKeyInputPrompt: '{provider} کے لیے API کلید درج کریں',

  msgCommitGenerateTitle: 'Commit Maker: کمیٹ پیغام جنریشن',
  msgCommitGenerateFetchingDiff: 'Diff حاصل کر رہا ہے…',
  msgCommitGenerateCallingLlm: 'LLM سے استفسار…',
  msgCommitGenerateFailedPrefix: 'کمیٹ پیغام بنانے میں ناکام: ',
  msgCommitApplyProgress: 'SCM پر لاگو کر رہا ہے…',
  msgCommitApplySuccess: 'کمیٹ پیغام SCM ان پٹ میں لگا دیا گیا۔',
  msgCommitNotGenerated: 'پہلے کمیٹ پیغام جنریٹ کریں۔',
  msgRepoNotFound: 'Git ریپوزٹری نہیں ملی۔',
  msgCancelled: 'صارف نے منسوخ کیا',
  msgDiffEmpty: 'کوئی diff نہیں ملا۔ Staged/changes چیک کریں۔',
  msgUnsupportedProvider: 'غیر معاون فراہم کنندہ: {provider}',
  msgApiKeyMissing: '{provider} کی API کلید سیٹ نہیں۔ سیٹنگز میں محفوظ کریں۔',
  msgLlmEmptyOpenAi: 'OpenAI کا جواب خالی تھا۔',
  msgLlmEmptyGemini: 'Gemini کا جواب خالی تھا۔',
  msgLlmEmptyClaude: 'Claude کا جواب خالی تھا۔',
  msgHttpsInvalid: '{label} غلط ہے۔',
  msgHttpsRequired: '{label} https:// سے شروع ہونا چاہیے۔ سیٹنگز چیک کریں۔',
  msgGitDiffFailed: 'git diff ناکام: {detail}',
  msgGitStatusFailed: 'git status --porcelain ناکام: {detail}',
  msgUntrackedReadFailed: 'ان ٹریکڈ فائل نہیں پڑھ سکا: {path} ({detail})',
  msgUntrackedSkipBinary: 'ان ٹریکڈ فائل اسکپ (ممکنہ بائنری): {path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: کوشش {attempt}/{max}',
  logLlmRetry: '{label}: {delay}ms بعد دوبارہ کوشش ({error})',

  toastSaved: '{action} : {timestamp}',
  toastDeleted: '{timestamp} پر حذف',

  actionCreatedLabel: 'تخلیق',
  actionUpdatedLabel: 'اپ ڈیٹ',
  actionDeletedLabel: 'حذف',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### Staged',
  diffSectionUnstaged: '### Unstaged',
  diffSectionUntracked: '### Untracked {path}',
  diffHeading: '# Diff'
};

export default ur;
