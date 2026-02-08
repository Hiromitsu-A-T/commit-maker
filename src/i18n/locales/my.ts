import { UiStrings } from '../types';

const my: UiStrings = {
  langCode: 'my',
  appTitle: 'Commit Maker',

  languageSectionTitle: 'ပြသဘာသာစကား',
  languageName: 'မြန်မာ',

  apiKeySectionTitle: 'API Key',
  apiKeyProviderLabel: 'သိမ်းမည့် ပေးသွင်းသူ',
  apiKeyIssueButton: 'API key ရယူရန်',
  apiKeyLabel: 'API Key',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: 'သိမ်းမည်',
  apiKeyClearButton: 'ရှင်းလင်း',

  llmSectionTitle: 'LLM ပြင်ဆင်မှု',
  providerLabel: 'ပေးသွင်းသူ',
  modelLabel: 'မော်ဒယ်',
  customModelLabel: 'စိတ်ကြိုက်မော်ဒယ်နာမည်',
  customModelPlaceholder: 'example-model',
  reasoningLabel: 'Reasoning Effort (OpenAI သီးသန့်)',
  verbosityLabel: 'အကြောင်းအရာအသေးစိတ် (OpenAI သီးသန့်)',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI (GPT-5 မျိုးစု)',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: 'Prompt နှင့် ရွေးစရာများ',
  presetNamePlaceholder: 'Preset နာမည်',
  presetAddButton: 'အသစ်ထည့်',
  presetDeleteButton: 'ဖျက်',
  promptTextareaPlaceholder: 'ဥပမာ။ မြန်မာဘာသာဖြင့် ခေါင်းစဥ် 50 အက္ခရာနှင့် bullet နည်းဖြင့် ရေးပါ',
  includeUnstagedLabel: 'စတိတ်မလုပ်ထားသော ပြောင်းလဲမှုများ ထည့်သွင်း',
  includeUntrackedLabel: 'Untracked ဖိုင်များ ထည့်သွင်း',
  includeBinaryLabel: 'Binary ဖြစ်နိုင်သော ဖိုင်များ ထည့်သွင်း',
  maxPromptLabel: 'Prompt အရှည် ကန့်သတ်',
  maxPromptUnlimited: 'ကန့်သတ်မထား (မူလ)',
  maxPromptLimited: 'ကန့်သတ် သတ်မှတ်ရန်',
  maxPromptUnitLabel: 'အက္ခရာ',
  maxPromptHint:
    'Token/ကုန်ကျစရိတ် လျှော့ချလိုသော် 0 သို့မဟုတ် ဗလာဆို အကန့်အသတ်မရှိ။ ကျော်လွန်လျှင် ရှေ့ 20% နှင့် နောက် 80% ထားမည်။',

  generationSectionTitle: 'ဖန်တီးခြင်းနှင့် ရလဒ်',
  generateButton: 'ဖန်တီးရန်',
  generateButtonTitle: 'diff ကိုဖတ်ပြီး commit စာသား ဖန်တီးရန်',
  applyButton: 'SCM သို့ ထည့်ရန်',
  applyButtonTitle: 'ရလဒ်ကို Source Control commit box ထဲ ကူးရန်',
  resultPlaceholder: 'မဖန်တီးရသေးပါ။',
  resultHint: 'ရလဒ်စစ်ပြီး “SCM သို့ ထည့်ရန်” နှိပ်ပါ။ Commit box ထဲသို့ ကူးပါမည်။',
  errorPlaceholder: '-',

  statusIdle: 'စောင့်ဆိုင်း中',
  statusLoading: 'LLM ဖန်တီး中…',
  statusReady: 'ပြီးဆုံး',
  statusError: 'အမှား',
  badgeUnstagedOn: 'Staged + Unstaged',
  badgeUnstagedOff: 'Staged သီးသန့်',

  apiKeySaved: 'သိမ်းပြီး',
  apiKeyNotSaved: 'မသိမ်းရသေး',
  apiKeySavedPreviewPrefix: 'သိမ်းပြီး: ',
  providerNeedKey: 'API key ကို ဦးစွာ သိမ်းပါ',
  modelNeedKey: 'API key သိမ်းပြီးမှ မော်ဒယ် ရွေးနိုင်ပါသည်။',
  customModelOption: 'စိတ်ကြိုက်…',

  presetButtonNew: 'အသစ်သိမ်း',
  presetButtonSaved: 'သိမ်းပြီး',
  presetButtonOverwrite: 'ထပ်ရေးသိမ်း',
  presetTitleNew: 'Preset အသစ်အဖြစ် သိမ်းမည်',
  presetTitleNoChange: 'ပြောင်းလဲမှုမရှိ',
  presetTitleOverwrite: 'ရွေးထားသော preset ကို ထပ်ရေးသိမ်းမည်',

  defaultCommitPrompt: [
    'ပြောင်းလဲမှုကို ခေါင်းစဥ် 50 အက္ခရာအတွင်း၊ လိုသော် bullet စာကြောင်းများ 72 အက္ခရာအတွင်း ဖြင့် ရေးပါ။',
    '- မင်းခိုင်းစကား မသုံးဘဲ ပြောင်းလဲမှုကို တိုတိုလေး ရေးပါ (ထင်မြင်ချက်/ခန့်မှန်းမှု မပါ)',
    '- Bullet ကို "- " ဖြင့် စပါ၊ လိုအပ်သော်ဘဲ ထည့်ပါ၊ တစ်ကြောင်းလျှင် 72 အက္ခရာ မကျော်ရ',
    '- Breaking change အပါအဝင် ISSUE/PR နံပါတ်များ ကို body တွင် ထည့်ပါ',
    '- AI ထင်မြင်ချက်၊ တောင်းပန်ချက်၊ ယုံကြည်ချက် မရေးပါ၊ တိကျသော အချက်အလက်သာ',
    '- Conventional Commits type ကို ခေါင်းစဥ် ရှေ့တွင် prefix ထည့်ပါ',
    '- မြန်မာဘာသာဖြင့် ထုတ်ပေးပါ'
  ].join('\n'),
  defaultPresetLabel: 'ပုံသေ (ဖျက်မရ၊ တည်းဖြတ်နိုင်)',
  providerDescriptionGemini: 'Generative Language API (generateContent) ကိုတိုက်ရိုက် ခေါ်သည်။',
  providerDescriptionOpenAi: 'Responses API / Chat Completions နှင့် တိုက်ညီသော endpoint အသုံးပြုသည်။',
  providerDescriptionClaude: 'Claude 3 messages API ကို အသုံးပြုသည်။',

  msgApiKeySaved: 'API key ကို သိမ်းလိုက်သည်။',
  msgApiKeySavePick: 'API key သိမ်းရန် ပေးသွင်းသူကို ရွေးပါ',
  msgApiKeyInputPrompt: '{provider} အတွက် API key ထည့်ပါ',

  msgCommitGenerateTitle: 'Commit စာသား ဖန်တီးခြင်း (Commit Maker)',
  msgCommitGenerateFetchingDiff: 'diff ရယူ中…',
  msgCommitGenerateCallingLlm: 'LLM ကို မေးမြန်း中…',
  msgCommitGenerateFailedPrefix: 'Commit စာသား ဖန်တီးမှု ပျက်ကွက်: ',
  msgCommitApplyProgress: 'SCM သို့ ထည့်中…',
  msgCommitApplySuccess: 'Commit စာသား ကို SCM commit box ထဲ ထည့်ပြီးပါပြီ။',
  msgCommitNotGenerated: 'အရင်ဆုံး commit စာသား ဖန်တီးပါ။',
  msgRepoNotFound: 'Git repository မတွေ့ပါ။',
  msgCancelled: 'အသုံးပြုသူ သတ်မှတ်၍ ရပ်တန့်ခဲ့သည်',
  msgDiffEmpty: 'diff မရှိပါ။ staged/changes ကို စစ်ပါ။',
  msgUnsupportedProvider: 'မပံ့ပိုးသော ပေးသွင်းသူ: {provider}',
  msgApiKeyMissing: '{provider} အတွက် API key မသတ်မှတ်ရသေးပါ။ ဆက်တင်တွင် သိမ်းပါ။',
  msgLlmEmptyOpenAi: 'OpenAI တုံ့ပြန်ချက် လွတ်နေသည်။',
  msgLlmEmptyGemini: 'Gemini တုံ့ပြန်ချက် လွတ်နေသည်။',
  msgLlmEmptyClaude: 'Claude တုံ့ပြန်ချက် လွတ်နေသည်။',
  msgHttpsInvalid: '{label} မှန်ကန်မှု မရှိပါ။',
  msgHttpsRequired: '{label} သည် https:// ဖြင့် စပါရန် လိုသည်။ ဆက်တင်ကို စစ်ပါ။',
  msgGitDiffFailed: 'git diff မအောင်မြင်: {detail}',
  msgGitStatusFailed: 'git status --porcelain မအောင်မြင်: {detail}',
  msgUntrackedReadFailed: 'Untracked ဖိုင် ဖတ်ခြင်း မအောင်မြင်: {path} ({detail})',
  msgUntrackedSkipBinary: 'Untracked ဖိုင် ဖြတ်သန်း (binary ဖြစ်နိုင်): {path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: ကြိုးစားမှု {attempt}/{max}',
  logLlmRetry: '{label}: {delay}ms ပြန်ကြိုးစားမည် ({error})',

  toastSaved: '{action} ({timestamp})',
  toastDeleted: '{timestamp} တွင် ဖျက်ခဲ့သည်',

  actionCreatedLabel: 'ဖန်တီး',
  actionUpdatedLabel: 'အပ်ဒိတ်',
  actionDeletedLabel: 'ဖျက်',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### Staged',
  diffSectionUnstaged: '### Unstaged',
  diffSectionUntracked: '### Untracked {path}',
  diffHeading: '# Diff'
};

export default my;
