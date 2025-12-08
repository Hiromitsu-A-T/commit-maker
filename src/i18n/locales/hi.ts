import { UiStrings } from '../types';

const hi: UiStrings = {
  langCode: 'hi',
  appTitle: 'Commit Maker',

  languageSectionTitle: 'प्रदर्शन भाषा',
  languageName: 'हिन्दी',

  apiKeySectionTitle: 'API कुंजी',
  apiKeyProviderLabel: 'किस प्रदाता पर सहेजें',
  apiKeyIssueButton: 'API कुंजी प्राप्त करें',
  apiKeyLabel: 'API कुंजी',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: 'सहेजें',
  apiKeyClearButton: 'हटाएँ',

  llmSectionTitle: 'LLM सेटिंग्स',
  providerLabel: 'प्रदाता',
  modelLabel: 'मॉडल',
  customModelLabel: 'कस्टम मॉडल नाम',
  customModelPlaceholder: 'example-model',
  reasoningLabel: 'Reasoning Effort (केवल OpenAI)',
  verbosityLabel: 'विस्तार स्तर (केवल OpenAI)',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI (GPT-5 श्रृंखला)',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: 'प्रॉम्प्ट और विकल्प',
  presetNamePlaceholder: 'प्रिसेट नाम',
  presetAddButton: 'नया जोड़ें',
  presetDeleteButton: 'हटाएँ',
  promptTextareaPlaceholder: 'उदा.: हिंदी में 50 अक्षरों का शीर्षक और बुलेट बॉडी लिखें।',
  includeUnstagedLabel: 'अनस्टेज्ड बदलाव शामिल करें',
  includeUntrackedLabel: 'अनट्रैक्ड फ़ाइलें शामिल करें',
  includeBinaryLabel: 'संभावित बाइनरी फ़ाइलें शामिल करें',
  maxPromptLabel: 'प्रॉम्प्ट लंबाई सीमा',
  maxPromptUnlimited: 'असीमित (डिफ़ॉल्ट)',
  maxPromptLimited: 'सीमा तय करें',
  maxPromptUnitLabel: 'अक्षर',
  maxPromptHint:
    'टोकन/लागत सीमित करने के लिए। 0 या खाली = असीमित। सीमा से अधिक होने पर पहले 20% और अंतिम 80% रखा जाएगा।',

  generationSectionTitle: 'जनरेट और परिणाम',
  generateButton: 'जनरेट',
  generateButtonTitle: 'डिफ़ पढ़ें और कमिट संदेश बनाएं',
  applyButton: 'SCM में लागू करें',
  applyButtonTitle: 'परिणाम को सोर्स कंट्रोल कमिट बॉक्स में कॉपी करें',
  resultPlaceholder: 'अभी तक जनरेट नहीं हुआ।',
  resultHint: 'परिणाम देखें, फिर “SCM में लागू करें” दबाएँ ताकि कमिट इनपुट में कॉपी हो जाए।',
  errorPlaceholder: '-',

  statusIdle: 'निष्क्रिय',
  statusLoading: 'LLM जनरेट कर रहा है…',
  statusReady: 'पूर्ण',
  statusError: 'त्रुटि',
  badgeUnstagedOn: 'स्टेज्ड + अनस्टेज्ड',
  badgeUnstagedOff: 'केवल स्टेज्ड',

  apiKeySaved: 'सहेजा गया',
  apiKeyNotSaved: 'सहेजा नहीं',
  apiKeySavedPreviewPrefix: 'सहेजा गया: ',
  providerNeedKey: 'पहले API कुंजी सहेजें',
  modelNeedKey: 'API कुंजी सहेजने के बाद मॉडल चुन सकते हैं।',
  customModelOption: 'कस्टम…',

  presetButtonNew: 'नया सहेजें',
  presetButtonSaved: 'सहेजा गया',
  presetButtonOverwrite: 'ओवरराइट',
  presetTitleNew: 'नए प्रिसेट के रूप में सहेजें',
  presetTitleNoChange: 'कोई बदलाव नहीं',
  presetTitleOverwrite: 'चयनित प्रिसेट को ओवरराइट करें',

  defaultCommitPrompt: [
    'परिवर्तन को 50 अक्षरों के शीर्षक में लिखें और आवश्यकता होने पर 72 अक्षर चौड़ाई के बुलेट बॉडी में लिखें।',
    '- शीर्षक में आदेश न दें; बदलाव को संक्षेप में लिखें (कोई राय या अनुमान नहीं)',
    '- बॉडी पंक्तियाँ "- " से शुरू हों, केवल आवश्यकता पर, प्रत्येक पंक्ति ≤72 अक्षर',
    '- ब्रेकिंग बदलाव या ISSUE/PR नंबर हों तो बॉडी में जोड़ें',
    '- AI की राय, माफ़ी, या आत्मविश्वास बयान निषिद्ध; केवल तथ्य लिखें',
    '- Conventional Commits के अनुसार शीर्षक से पहले टाइप प्रीफ़िक्स जोड़ें',
    '- हिंदी में आउटपुट करें'
  ].join('\n'),
  defaultPresetLabel: 'डिफ़ॉल्ट (मिटाया नहीं जा सकता, संपादन योग्य)',
  providerDescriptionGemini: 'Generative Language API (generateContent) को सीधे कॉल करता है।',
  providerDescriptionOpenAi: 'Responses / Chat Completions संगत endpoint का उपयोग करता है।',
  providerDescriptionClaude: 'Claude 3 messages API का उपयोग करता है।',

  msgApiKeySaved: 'API कुंजी सहेजी गई।',
  msgApiKeySavePick: 'API कुंजी सहेजने के लिए प्रदाता चुनें',
  msgApiKeyInputPrompt: '{provider} के लिए API कुंजी दर्ज करें',

  msgCommitGenerateTitle: 'कमिट संदेश जनरेशन (Commit Maker)',
  msgCommitGenerateFetchingDiff: 'diff प्राप्त कर रहा है…',
  msgCommitGenerateCallingLlm: 'LLM को पूछ रहा है…',
  msgCommitGenerateFailedPrefix: 'कमिट संदेश जनरेट करने में विफल: ',
  msgCommitApplyProgress: 'SCM में लागू कर रहा है…',
  msgCommitApplySuccess: 'कमिट संदेश SCM इनपुट में कॉपी किया गया।',
  msgCommitNotGenerated: 'पहले कमिट संदेश जनरेट करें।',
  msgRepoNotFound: 'Git रिपॉजिटरी नहीं मिली।',
  msgCancelled: 'उपयोगकर्ता द्वारा रद्द',
  msgDiffEmpty: 'कोई diff नहीं। स्टेज/परिवर्तन जांचें।',
  msgUnsupportedProvider: 'असमर्थित प्रदाता: {provider}',
  msgApiKeyMissing: '{provider} के लिए API कुंजी सेट नहीं है। सेटिंग्स में सहेजें।',
  msgLlmEmptyOpenAi: 'OpenAI उत्तर खाली था।',
  msgLlmEmptyGemini: 'Gemini उत्तर खाली था।',
  msgLlmEmptyClaude: 'Claude उत्तर खाली था।',
  msgHttpsInvalid: '{label} अमान्य है।',
  msgHttpsRequired: '{label} https:// से शुरू होना चाहिए। सेटिंग्स जांचें।',
  msgGitDiffFailed: 'git diff विफल: {detail}',
  msgGitStatusFailed: 'git status --porcelain विफल: {detail}',
  msgUntrackedReadFailed: 'Untracked फ़ाइल पढ़ने में विफल: {path} ({detail})',
  msgUntrackedSkipBinary: 'Untracked फ़ाइल छोड़ी (संभावित बाइनरी): {path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: प्रयास {attempt}/{max}',
  logLlmRetry: '{label}: {delay}ms में पुनः प्रयास ({error})',

  toastSaved: '{action} ({timestamp})',
  toastDeleted: '{timestamp} पर हटाया गया',

  actionCreatedLabel: 'बनाया',
  actionUpdatedLabel: 'अद्यतन',
  actionDeletedLabel: 'हटाया',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### Staged',
  diffSectionUnstaged: '### Unstaged',
  diffSectionUntracked: '### Untracked {path}',
  diffHeading: '# Diff'
};

export default hi;
