import { UiStrings } from '../types';

const bn: UiStrings = {
  langCode: 'bn',
  appTitle: 'Commit Maker',

  languageSectionTitle: 'প্রদর্শনের ভাষা',
  languageName: 'বাংলা',

  apiKeySectionTitle: 'API কী',
  apiKeyProviderLabel: 'সংরক্ষণের প্রদানকারী',
  apiKeyIssueButton: 'API কী নিন',
  apiKeyLabel: 'API কী',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: 'সংরক্ষণ',
  apiKeyClearButton: 'মুছুন',

  llmSectionTitle: 'LLM সেটিংস',
  providerLabel: 'প্রদানকারী',
  modelLabel: 'মডেল',
  customModelLabel: 'কাস্টম মডেল নাম',
  customModelPlaceholder: 'example-model',
  reasoningLabel: 'Reasoning Effort (শুধু OpenAI)',
  verbosityLabel: 'বিবরণের স্তর (শুধু OpenAI)',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI (GPT-5 পরিবার)',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: 'প্রম্পট ও বিকল্প',
  presetNamePlaceholder: 'প্রিসেট নাম',
  presetAddButton: 'নতুন যোগ করুন',
  presetDeleteButton: 'মুছুন',
  promptTextareaPlaceholder: 'উদা.: বাংলায় ৫০ অক্ষরের মধ্যে শিরোনাম ও বুলেট বডি লিখুন।',
  includeUnstagedLabel: 'unstaged পরিবর্তন অন্তর্ভুক্ত করুন',
  includeUntrackedLabel: 'untracked ফাইল অন্তর্ভুক্ত করুন',
  includeBinaryLabel: 'সম্ভাব্য বাইনারি ফাইল অন্তর্ভুক্ত করুন',
  maxPromptLabel: 'প্রম্পট দৈর্ঘ্য সীমা',
  maxPromptUnlimited: 'সীমাহীন (ডিফল্ট)',
  maxPromptLimited: 'সীমা নির্ধারণ করুন',
  maxPromptUnitLabel: 'অক্ষর',
  maxPromptHint:
    'টোকেন/খরচ সীমাবদ্ধ করতে ব্যবহার করুন। ০ বা ফাঁকা মানে সীমাহীন। সীমা ছাড়ালে প্রথম ২০% ও শেষ ৮০% রাখা হবে।',

  generationSectionTitle: 'জেনারেশন ও ফলাফল',
  generateButton: 'জেনারেট',
  generateButtonTitle: 'diff লোড করে কমিট বার্তা জেনারেট করুন',
  applyButton: 'SCM-এ প্রয়োগ',
  applyButtonTitle: 'ফলাফল Source Control কমিট বক্সে কপি করুন',
  resultPlaceholder: 'এখনও তৈরি হয়নি।',
  resultHint: 'ফলাফল দেখে "SCM-এ প্রয়োগ" চাপুন, কমিট বক্সে কপি হবে।',
  errorPlaceholder: '-',

  statusIdle: 'অপেক্ষমান',
  statusLoading: 'LLM জেনারেট করছে…',
  statusReady: 'সম্পন্ন',
  statusError: 'ত্রুটি',
  badgeUnstagedOn: 'Staged + Unstaged',
  badgeUnstagedOff: 'শুধু Staged',

  apiKeySaved: 'সংরক্ষিত',
  apiKeyNotSaved: 'সংরক্ষিত নয়',
  apiKeySavedPreviewPrefix: 'সংরক্ষিত: ',
  providerNeedKey: 'আগে API কী সংরক্ষণ করুন',
  modelNeedKey: 'API কী সংরক্ষণের পর মডেল নির্বাচন করুন।',
  customModelOption: 'কাস্টম…',

  presetButtonNew: 'নতুন হিসেবে সংরক্ষণ',
  presetButtonSaved: 'সংরক্ষিত',
  presetButtonOverwrite: 'ওভাররাইট',
  presetTitleNew: 'নতুন প্রিসেট হিসেবে সংরক্ষণ',
  presetTitleNoChange: 'কোনো পরিবর্তন নেই',
  presetTitleOverwrite: 'নির্বাচিত প্রিসেট ওভাররাইট করুন',

  defaultCommitPrompt: [
    '৫০ অক্ষরের মধ্যে শিরোনাম লিখুন এবং প্রয়োজনে ৭২ অক্ষর পর্যন্ত বুলেট বডি লাইন দিন।',
    '- বিধেয় ভঙ্গি এড়িয়ে চলুন; পরিবর্তন সংক্ষেপে লিখুন (মতামত/অনুমান নয়)',
    '- বডি লাইন "- " দিয়ে শুরু, প্রয়োজন হলে যোগ করুন, প্রতিটি ৭২ অক্ষরের মধ্যে',
    '- প্রয়োজনে breaking changes ও issue/PR নম্বর বডিতে যোগ করুন',
    '- AI-এর মতামত/দুঃখপ্রকাশ/আত্মবিশ্বাস লিখবেন না; শুধু তথ্য',
    '- শিরোনামের আগে Conventional Commits টাইপ প্রিফিক্স দিন',
    '- আউটপুট বাংলা ভাষায় দিন'
  ].join('\n'),
  defaultPresetLabel: 'ডিফল্ট (লকড, সম্পাদনযোগ্য)',
  providerDescriptionGemini: 'সরাসরি Generative Language API (generateContent) কল করে।',
  providerDescriptionOpenAi: 'Responses API / Chat Completions সামঞ্জস্যপূর্ণ এন্ডপয়েন্ট ব্যবহার করে।',
  providerDescriptionClaude: 'Claude 3 messages API ব্যবহার করে।',

  msgApiKeySaved: 'API কী সংরক্ষিত হয়েছে।',
  msgApiKeySavePick: 'API কী কোন প্রদানকারীতে সংরক্ষণ করবেন নির্বাচন করুন',
  msgApiKeyInputPrompt: '{provider} এর API কী লিখুন',

  msgCommitGenerateTitle: 'কমিট বার্তা জেনারেশন (Commit Maker)',
  msgCommitGenerateFetchingDiff: 'diff আনা হচ্ছে…',
  msgCommitGenerateCallingLlm: 'LLM-এ জিজ্ঞাসা করছে…',
  msgCommitGenerateFailedPrefix: 'কমিট বার্তা জেনারেট ব্যর্থ: ',
  msgCommitApplyProgress: 'SCM-এ প্রয়োগ হচ্ছে…',
  msgCommitApplySuccess: 'কমিট বার্তা SCM ইনপুটে কপি হয়েছে।',
  msgCommitNotGenerated: 'আগে কমিট বার্তা জেনারেট করুন।',
  msgRepoNotFound: 'Git রিপোজিটরি পাওয়া যায়নি।',
  msgCancelled: 'ব্যবহারকারী বাতিল করেছেন',
  msgDiffEmpty: 'কোনো diff নেই। staged/changes দেখুন।',
  msgUnsupportedProvider: 'অসমর্থিত প্রদানকারী: {provider}',
  msgApiKeyMissing: '{provider} এর API কী সেট করা নেই। সেটিংসে সংরক্ষণ করুন।',
  msgLlmEmptyOpenAi: 'OpenAI প্রতিক্রিয়া ফাঁকা ছিল।',
  msgLlmEmptyGemini: 'Gemini প্রতিক্রিয়া ফাঁকা ছিল।',
  msgLlmEmptyClaude: 'Claude প্রতিক্রিয়া ফাঁকা ছিল।',
  msgHttpsInvalid: '{label} অবৈধ।',
  msgHttpsRequired: '{label} অবশ্যই https:// দিয়ে শুরু হতে হবে। সেটিংস দেখুন।',
  msgGitDiffFailed: 'git diff চালাতে ব্যর্থ: {detail}',
  msgGitStatusFailed: 'git status --porcelain ব্যর্থ: {detail}',
  msgUntrackedReadFailed: 'untracked ফাইল পড়া যায়নি: {path} ({detail})',
  msgUntrackedSkipBinary: 'untracked ফাইল এড়ানো হয়েছে (বাইনারি সন্দেহ): {path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: চেষ্টা {attempt}/{max}',
  logLlmRetry: '{label}: {delay}ms পরে পুনরায় চেষ্টা ({error})',

  toastSaved: '{action} ({timestamp})',
  toastDeleted: 'মুছে ফেলা হয়েছে ({timestamp})',

  actionCreatedLabel: 'তৈরি',
  actionUpdatedLabel: 'আপডেট',
  actionDeletedLabel: 'মুছে ফেলা',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### Staged',
  diffSectionUnstaged: '### Unstaged',
  diffSectionUntracked: '### Untracked {path}',
  diffHeading: '# Diff'
};

export default bn;
