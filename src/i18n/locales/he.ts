import { UiStrings } from '../types';

const he: UiStrings = {
  langCode: 'he',
  appTitle: 'Commit Maker',

  languageSectionTitle: 'שפת תצוגה',
  languageName: 'עברית',

  apiKeySectionTitle: 'מפתח API',
  apiKeyProviderLabel: 'ספק לשמירה',
  apiKeyIssueButton: 'קבל מפתח API',
  apiKeyLabel: 'מפתח API',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: 'שמירה',
  apiKeyClearButton: 'נקה',

  llmSectionTitle: 'הגדרות LLM',
  providerLabel: 'ספק',
  modelLabel: 'מודל',
  customModelLabel: 'שם מודל מותאם',
  customModelPlaceholder: 'example-model',
  reasoningLabel: 'Reasoning Effort (רק OpenAI)',
  verbosityLabel: 'רמת פירוט (רק OpenAI)',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI (משפחת GPT-5)',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: 'פרומפט ואפשרויות',
  presetNamePlaceholder: 'שם פריסט',
  presetAddButton: 'הוסף חדש',
  presetDeleteButton: 'מחק',
  promptTextareaPlaceholder: 'לדוגמה: כתוב כותרת עד 50 תווים וגוף בנקודות בעברית.',
  includeUnstagedLabel: 'כלול שינויים שלא בוצע להם stage',
  includeUntrackedLabel: 'כלול קבצים לא במעקב',
  includeBinaryLabel: 'כלול קבצים חשודים כבינאריים',
  maxPromptLabel: 'הגבלת אורך פרומפט',
  maxPromptUnlimited: 'ללא הגבלה (ברירת מחדל)',
  maxPromptLimited: 'הגדר מגבלה',
  maxPromptUnitLabel: 'תווים',
  maxPromptHint:
    'השתמש כדי להגביל טוקנים/עלות. 0 או ריק = ללא הגבלה. אם חורגים, נשמרים 20% הראשונים ו‑80% האחרונים.',

  generationSectionTitle: 'יצירה ותוצאה',
  generateButton: 'צור',
  generateButtonTitle: 'טען diff ויצור הודעת קומיט',
  applyButton: 'החל ל‑SCM',
  applyButtonTitle: 'העתק את התוצאה לשדה הקומיט ב‑Source Control',
  resultPlaceholder: 'עדיין לא נוצר.',
  resultHint: 'בדוק את התוצאה ואז לחץ "החל ל‑SCM" כדי להעתיק לשדה הקומיט.',
  errorPlaceholder: '-',

  statusIdle: 'ממתין',
  statusLoading: 'יוצר עם LLM…',
  statusReady: 'הושלם',
  statusError: 'שגיאה',
  badgeUnstagedOn: 'Stage + ללא Stage',
  badgeUnstagedOff: 'Stage בלבד',

  apiKeySaved: 'נשמר',
  apiKeyNotSaved: 'לא נשמר',
  apiKeySavedPreviewPrefix: 'נשמר: ',
  providerNeedKey: 'שמֵר מפתח API קודם',
  modelNeedKey: 'אפשר לבחור מודל אחרי שמירת המפתח.',
  customModelOption: 'מותאם…',

  presetButtonNew: 'שמור כחדש',
  presetButtonSaved: 'נשמר',
  presetButtonOverwrite: 'שמור מעל',
  presetTitleNew: 'שמור כפריסט חדש',
  presetTitleNoChange: 'אין שינוי',
  presetTitleOverwrite: 'שמור מעל הפריסט הנבחר',

  defaultCommitPrompt: [
    'כתוב כותרת עד 50 תווים ואם צריך גוף בנקודות עד 72 תווים.',
    '- הימנע ממצב ציווי; תאר בקצרה את השינוי (בלי דעה או ניחוש)',
    '- שורות גוף מתחילות ב"- "; הוסף רק כשצריך, כל שורה עד 72 תווים',
    '- הוסף breaking changes ומספרי issue/PR בגוף לפי הצורך',
    '- אין דעות של AI, התנצלות או הצהרות ביטחון. רק עובדות',
    '- הוסף סוג לפי Conventional Commits בתחילת הכותרת',
    '- הפלט בעברית'
  ].join('\n'),
  defaultPresetLabel: 'ברירת מחדל (נעול, ניתן לעריכה)',
  providerDescriptionGemini: 'קורא ישירות ל‑Generative Language API (generateContent).',
  providerDescriptionOpenAi: 'משתמש ב‑Responses API / Chat Completions תואם.',
  providerDescriptionClaude: 'משתמש ב‑Claude 3 messages API.',

  msgApiKeySaved: 'מפתח API נשמר.',
  msgApiKeySavePick: 'בחר ספק לשמירת מפתח ה‑API',
  msgApiKeyInputPrompt: 'הזן מפתח API עבור {provider}',

  msgCommitGenerateTitle: 'יצירת הודעת קומיט (Commit Maker)',
  msgCommitGenerateFetchingDiff: 'מאחזר diff…',
  msgCommitGenerateCallingLlm: 'שואל את ה‑LLM…',
  msgCommitGenerateFailedPrefix: 'יצירת הודעת הקומיט נכשלה: ',
  msgCommitApplyProgress: 'מיישם ל‑SCM…',
  msgCommitApplySuccess: 'הודעת הקומיט הועתקה לשדה SCM.',
  msgCommitNotGenerated: 'צור קודם הודעת קומיט.',
  msgRepoNotFound: 'מאגר Git לא נמצא.',
  msgCancelled: 'בוטל על ידי המשתמש',
  msgDiffEmpty: 'אין diff. בדוק staged/changes.',
  msgUnsupportedProvider: 'ספק לא נתמך: {provider}',
  msgApiKeyMissing: 'אין מפתח API עבור {provider}. שמור אותו בהגדרות.',
  msgLlmEmptyOpenAi: 'תגובה ריקה מ‑OpenAI.',
  msgLlmEmptyGemini: 'תגובה ריקה מ‑Gemini.',
  msgLlmEmptyClaude: 'תגובה ריקה מ‑Claude.',
  msgHttpsInvalid: '{label} אינו חוקי.',
  msgHttpsRequired: '{label} חייב להתחיל ב‑https://. בדוק את ההגדרות.',
  msgGitDiffFailed: 'כשל בהרצת git diff: {detail}',
  msgGitStatusFailed: 'git status --porcelain נכשל: {detail}',
  msgUntrackedReadFailed: 'כשל בקריאת קובץ לא במעקב: {path} ({detail})',
  msgUntrackedSkipBinary: 'דילוג על קובץ לא במעקב (חשוד כבינארי): {path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: ניסיון {attempt}/{max}',
  logLlmRetry: '{label}: ניסיון חוזר בעוד {delay}ms ({error})',

  toastSaved: '{action} ב‑{timestamp}',
  toastDeleted: 'נמחק ב‑{timestamp}',

  actionCreatedLabel: 'נוצר',
  actionUpdatedLabel: 'עודכן',
  actionDeletedLabel: 'נמחק',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### Staged',
  diffSectionUnstaged: '### לא ב‑stage',
  diffSectionUntracked: '### לא במעקב {path}',
  diffHeading: '# Diff'
};

export default he;
