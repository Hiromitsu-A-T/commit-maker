import { UiStrings } from '../types';

const ar: UiStrings = {
  langCode: 'ar',
  appTitle: 'Commit Maker',

  languageSectionTitle: 'لغة العرض',
  languageName: 'العربية',

  apiKeySectionTitle: 'مفتاح الـ API',
  apiKeyProviderLabel: 'المزوّد للحفظ',
  apiKeyIssueButton: 'الحصول على مفتاح',
  apiKeyLabel: 'مفتاح الـ API',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: 'حفظ',
  apiKeyClearButton: 'مسح',

  llmSectionTitle: 'إعدادات الـ LLM',
  providerLabel: 'المزوّد',
  modelLabel: 'النموذج',
  customModelLabel: 'اسم نموذج مخصص',
  customModelPlaceholder: 'example-model',
  reasoningLabel: 'Reasoning Effort (OpenAI فقط)',
  verbosityLabel: 'درجة التفصيل (OpenAI فقط)',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI (عائلة GPT-5)',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: 'المطالبة والخيارات',
  presetNamePlaceholder: 'اسم الإعداد المسبق',
  presetAddButton: 'إضافة جديد',
  presetDeleteButton: 'حذف',
  promptTextareaPlaceholder: 'مثال: اكتب عنواناً من 50 حرفاً ونصاً بنقاط باللغة العربية.',
  includeUnstagedLabel: 'تضمين التغييرات غير المجهزة',
  includeUntrackedLabel: 'تضمين الملفات غير المتعقبة',
  includeBinaryLabel: 'تضمين الملفات المحتمل أن تكون ثنائية',
  maxPromptLabel: 'حد طول المطالبة',
  maxPromptUnlimited: 'غير محدود (افتراضي)',
  maxPromptLimited: 'تعيين حد',
  maxPromptUnitLabel: 'حرف',
  maxPromptHint:
    'استخدمه للحد من التوكن/التكلفة. 0 أو فراغ = غير محدود. عند التجاوز يُحتفظ بأول 20% وآخر 80%.',

  generationSectionTitle: 'التوليد والنتيجة',
  generateButton: 'توليد',
  generateButtonTitle: 'قراءة diff وتوليد رسالة الالتزام',
  applyButton: 'تطبيق على SCM',
  applyButtonTitle: 'نسخ النتيجة إلى حقل الالتزام في إدارة المصدر',
  resultPlaceholder: 'لم يُولد بعد.',
  resultHint: 'راجع النتيجة ثم اضغط "تطبيق على SCM" لنسخها إلى حقل الالتزام.',
  errorPlaceholder: '-',

  statusIdle: 'جاهز',
  statusLoading: 'توليد عبر LLM…',
  statusReady: 'تم',
  statusError: 'خطأ',
  badgeUnstagedOn: 'Staged + Unstaged',
  badgeUnstagedOff: 'Staged فقط',

  apiKeySaved: 'محفوظ',
  apiKeyNotSaved: 'غير محفوظ',
  apiKeySavedPreviewPrefix: 'محفوظ: ',
  providerNeedKey: 'احفظ مفتاح API أولاً',
  modelNeedKey: 'يمكن اختيار النموذج بعد حفظ المفتاح.',
  customModelOption: 'مخصص…',

  presetButtonNew: 'حفظ كجديد',
  presetButtonSaved: 'تم الحفظ',
  presetButtonOverwrite: 'استبدال',
  presetTitleNew: 'حفظ كإعداد مسبق جديد',
  presetTitleNoChange: 'لا تغيير',
  presetTitleOverwrite: 'استبدال الإعداد المسبق المحدد',

  defaultCommitPrompt: [
    'اكتب عنواناً ≤50 حرفاً، وإذا لزم الأمر، نصاً بنقاط بعرض 72 حرفاً.',
    '- تجنب أسلوب الأمر؛ لخص التغيير بإيجاز (بدون آراء أو تخمينات)',
    '- يبدأ المتن بـ "- "؛ أضف عند الحاجة فقط، كل سطر ≤72 حرفاً',
    '- أضف تغييرات كاسرة وأرقام ISSUE/PR في المتن عند الحاجة',
    '- ممنوع آراء الذكاء الاصطناعي أو الاعتذار أو عبارات الثقة. حقائق فقط',
    '- أضف نوع Conventional Commits كبادئة للعنوان',
    '- اكتب باللغة العربية'
  ].join('\n'),
  defaultPresetLabel: 'افتراضي (غير قابل للحذف، قابل للتعديل)',
  providerDescriptionGemini: 'يتصل مباشرةً بـ Generative Language API (generateContent).',
  providerDescriptionOpenAi: 'يستخدم نقطة نهاية متوافقة مع Responses / Chat Completions.',
  providerDescriptionClaude: 'يستخدم Claude 3 messages API.',

  msgApiKeySaved: 'تم حفظ مفتاح API.',
  msgApiKeySavePick: 'اختر مزوداً لحفظ مفتاح API',
  msgApiKeyInputPrompt: 'أدخل مفتاح API لـ {provider}',

  msgCommitGenerateTitle: 'توليد رسالة الالتزام (Commit Maker)',
  msgCommitGenerateFetchingDiff: 'جلب diff…',
  msgCommitGenerateCallingLlm: 'طلب إلى LLM…',
  msgCommitGenerateFailedPrefix: 'فشل توليد رسالة الالتزام: ',
  msgCommitApplyProgress: 'تطبيق على SCM…',
  msgCommitApplySuccess: 'تم نسخ رسالة الالتزام إلى حقل SCM.',
  msgCommitNotGenerated: 'قم بتوليد رسالة الالتزام أولاً.',
  msgRepoNotFound: 'لم يُعثر على مستودع Git.',
  msgCancelled: 'ألغاه المستخدم',
  msgDiffEmpty: 'لا يوجد diff. تحقق من staged/التغييرات.',
  msgUnsupportedProvider: 'مزود غير مدعوم: {provider}',
  msgApiKeyMissing: 'مفتاح API لـ {provider} غير مضبوط. احفظه في الإعدادات.',
  msgLlmEmptyOpenAi: 'استجابة OpenAI فارغة.',
  msgLlmEmptyGemini: 'استجابة Gemini فارغة.',
  msgLlmEmptyClaude: 'استجابة Claude فارغة.',
  msgHttpsInvalid: '{label} غير صالح.',
  msgHttpsRequired: '{label} يجب أن يبدأ بـ https://. تحقق من الإعدادات.',
  msgGitDiffFailed: 'فشل git diff: {detail}',
  msgGitStatusFailed: 'فشل git status --porcelain: {detail}',
  msgUntrackedReadFailed: 'فشل قراءة ملف غير متعقب: {path} ({detail})',
  msgUntrackedSkipBinary: 'تخطي ملف غير متعقب (يُحتمل أنه ثنائي): {path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: المحاولة {attempt} من {max}',
  logLlmRetry: '{label}: إعادة المحاولة بعد {delay} مللي ثانية ({error})',

  toastSaved: '{action} في {timestamp}',
  toastDeleted: 'تم الحذف في {timestamp}',

  actionCreatedLabel: 'تم الإنشاء',
  actionUpdatedLabel: 'تم التحديث',
  actionDeletedLabel: 'تم الحذف',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### Staged',
  diffSectionUnstaged: '### Unstaged',
  diffSectionUntracked: '### Untracked {path}',
  diffHeading: '# Diff'
};

export default ar;
