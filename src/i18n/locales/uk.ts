import { UiStrings } from '../types';

const uk: UiStrings = {
  langCode: 'uk',
  appTitle: 'Commit Maker',

  languageSectionTitle: 'Мова інтерфейсу',
  languageName: 'Українська',

  apiKeySectionTitle: 'API-ключ',
  apiKeyProviderLabel: 'Постачальник для збереження',
  apiKeyIssueButton: 'Отримати API-ключ',
  apiKeyLabel: 'API-ключ',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: 'Зберегти',
  apiKeyClearButton: 'Очистити',

  llmSectionTitle: 'Налаштування LLM',
  providerLabel: 'Постачальник',
  modelLabel: 'Модель',
  customModelLabel: 'Назва власної моделі',
  customModelPlaceholder: 'example-model',
  reasoningLabel: 'Reasoning Effort (лише OpenAI)',
  verbosityLabel: 'Рівень деталізації (лише OpenAI)',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI (сімейство GPT-5)',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: 'Підказка та опції',
  presetNamePlaceholder: 'Назва пресету',
  presetAddButton: 'Додати новий',
  presetDeleteButton: 'Видалити',
  promptTextareaPlaceholder: 'напр., Напишіть заголовок до 50 символів і маркований текст українською.',
  includeUnstagedLabel: 'Включати незастейджені зміни',
  includeUntrackedLabel: 'Включати не відстежувані файли',
  includeBinaryLabel: 'Включати можливі бінарні файли',
  maxPromptLabel: 'Обмеження довжини підказки',
  maxPromptUnlimited: 'Без обмежень (за замовчуванням)',
  maxPromptLimited: 'Встановити обмеження',
  maxPromptUnitLabel: 'симв.',
  maxPromptHint:
    'Використовуйте, щоб обмежити токени/вартість. 0 або порожньо — без обмежень. Якщо перевищено, зберігаються перші 20% та останні 80%.',

  generationSectionTitle: 'Генерація та результат',
  generateButton: 'Згенерувати',
  generateButtonTitle: 'Завантажити diff і згенерувати повідомлення коміту',
  applyButton: 'Застосувати до SCM',
  applyButtonTitle: 'Скопіювати результат у поле коміту засобу керування версіями',
  resultPlaceholder: 'Ще не згенеровано.',
  resultHint: 'Перегляньте результат і натисніть "Застосувати до SCM", щоб скопіювати в поле коміту.',
  errorPlaceholder: '-',

  statusIdle: 'Очікування',
  statusLoading: 'Генерується LLM…',
  statusReady: 'Готово',
  statusError: 'Помилка',
  badgeUnstagedOn: 'Застейджені + незастейджені',
  badgeUnstagedOff: 'Лише застейджені',

  apiKeySaved: 'Збережено',
  apiKeyNotSaved: 'Не збережено',
  apiKeySavedPreviewPrefix: 'Збережено: ',
  providerNeedKey: 'Спершу збережіть API-ключ',
  modelNeedKey: 'Модель можна вибрати після збереження ключа.',
  customModelOption: 'Власна…',

  presetButtonNew: 'Зберегти як новий',
  presetButtonSaved: 'Збережено',
  presetButtonOverwrite: 'Перезаписати',
  presetTitleNew: 'Зберегти як новий пресет',
  presetTitleNoChange: 'Без змін',
  presetTitleOverwrite: 'Перезаписати вибраний пресет',

  defaultCommitPrompt: [
    'Напишіть заголовок до 50 символів і, за потреби, марковані рядки тіла до 72 символів.',
    '- Уникайте наказового способу; стисло опишіть зміну (без думок чи припущень)',
    '- Рядки тіла починаються з "- "; додавайте лише за потреби, кожна до 72 символів',
    '- Додайте breaking changes та номери issue/PR у тіло, якщо доречно',
    '- Без думок ШІ, вибачень чи заяв про впевненість. Лише факти',
    '- Додайте префікс типу Conventional Commits до заголовка',
    '- Виводьте українською'
  ].join('\n'),
  defaultPresetLabel: 'За замовчуванням (заблоковано, можна редагувати)',
  providerDescriptionGemini: 'Безпосередньо викликає Generative Language API (generateContent).',
  providerDescriptionOpenAi: 'Використовує сумісну точку Responses API / Chat Completions.',
  providerDescriptionClaude: 'Використовує Claude 3 messages API.',

  msgApiKeySaved: 'API-ключ збережено.',
  msgApiKeySavePick: 'Оберіть постачальника для збереження API-ключа',
  msgApiKeyInputPrompt: 'Введіть API-ключ для {provider}',

  msgCommitGenerateTitle: 'Генерація повідомлення коміту (Commit Maker)',
  msgCommitGenerateFetchingDiff: 'Отримання diff…',
  msgCommitGenerateCallingLlm: 'Запит до LLM…',
  msgCommitGenerateFailedPrefix: 'Не вдалося згенерувати повідомлення коміту: ',
  msgCommitApplyProgress: 'Застосування до SCM…',
  msgCommitApplySuccess: 'Повідомлення коміту скопійовано в поле SCM.',
  msgCommitNotGenerated: 'Спершу згенеруйте повідомлення коміту.',
  msgRepoNotFound: 'Git-репозиторій не знайдено.',
  msgCancelled: 'Скасовано користувачем',
  msgDiffEmpty: 'Diff відсутній. Перевірте staged/changes.',
  msgUnsupportedProvider: 'Непідтримуваний постачальник: {provider}',
  msgApiKeyMissing: 'API-ключ для {provider} не задано. Збережіть його в налаштуваннях.',
  msgLlmEmptyOpenAi: 'Відповідь OpenAI порожня.',
  msgLlmEmptyGemini: 'Відповідь Gemini порожня.',
  msgLlmEmptyClaude: 'Відповідь Claude порожня.',
  msgHttpsInvalid: '{label} некоректний.',
  msgHttpsRequired: '{label} має починатися з https://. Перевірте налаштування.',
  msgGitDiffFailed: 'Не вдалося виконати git diff: {detail}',
  msgGitStatusFailed: 'git status --porcelain завершився помилкою: {detail}',
  msgUntrackedReadFailed: 'Не вдалося прочитати не відстежуваний файл: {path} ({detail})',
  msgUntrackedSkipBinary: 'Пропущено не відстежуваний файл (ймовірно бінарний): {path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: спроба {attempt}/{max}',
  logLlmRetry: '{label}: повтор через {delay} мс ({error})',

  toastSaved: '{action} о {timestamp}',
  toastDeleted: 'Видалено о {timestamp}',

  actionCreatedLabel: 'Створено',
  actionUpdatedLabel: 'Оновлено',
  actionDeletedLabel: 'Видалено',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### Застейджені',
  diffSectionUnstaged: '### Незастейджені',
  diffSectionUntracked: '### Не відстежувано {path}',
  diffHeading: '# Diff'
};

export default uk;
