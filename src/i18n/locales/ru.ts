import { UiStrings } from '../types';

const ru: UiStrings = {
  langCode: 'ru',
  appTitle: 'Commit Maker',

  languageSectionTitle: 'Язык интерфейса',
  languageName: 'Русский',

  apiKeySectionTitle: 'API-ключ',
  apiKeyProviderLabel: 'Провайдер для сохранения',
  apiKeyIssueButton: 'Получить API-ключ',
  apiKeyLabel: 'API-ключ',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: 'Сохранить',
  apiKeyClearButton: 'Очистить',

  llmSectionTitle: 'Настройки LLM',
  providerLabel: 'Провайдер',
  modelLabel: 'Модель',
  customModelLabel: 'Название пользовательской модели',
  customModelPlaceholder: 'example-model',
  reasoningLabel: 'Reasoning Effort (только OpenAI)',
  verbosityLabel: 'Степень детализации (только OpenAI)',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI (семейство GPT-5)',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: 'Промпт и опции',
  presetNamePlaceholder: 'Имя пресета',
  presetAddButton: 'Добавить',
  presetDeleteButton: 'Удалить',
  promptTextareaPlaceholder: 'Напр.: заголовок до 50 символов и пункты списка на русском.',
  includeUnstagedLabel: 'Включать неиндексированные изменения',
  includeUntrackedLabel: 'Включать неотслеживаемые файлы',
  includeBinaryLabel: 'Включать возможные бинарные файлы',
  maxPromptLabel: 'Лимит длины промпта',
  maxPromptUnlimited: 'Без лимита (по умолчанию)',
  maxPromptLimited: 'Установить лимит',
  maxPromptUnitLabel: 'символов',
  maxPromptHint:
    'Используйте для ограничения токенов/стоимости. 0 или пусто = без лимита. При превышении сохраняются первые 20% и последние 80%.',

  generationSectionTitle: 'Генерация и результат',
  generateButton: 'Сгенерировать',
  generateButtonTitle: 'Прочитать diff и создать сообщение коммита',
  applyButton: 'Применить в SCM',
  applyButtonTitle: 'Скопировать результат в поле коммита в Source Control',
  resultPlaceholder: 'Ещё не сгенерировано.',
  resultHint: 'Проверьте результат и нажмите «Применить в SCM», чтобы скопировать его в поле коммита.',
  errorPlaceholder: '-',

  statusIdle: 'Ожидание',
  statusLoading: 'Генерация LLM…',
  statusReady: 'Готово',
  statusError: 'Ошибка',
  badgeUnstagedOn: 'Staged + Unstaged',
  badgeUnstagedOff: 'Только Staged',

  apiKeySaved: 'Сохранён',
  apiKeyNotSaved: 'Не сохранён',
  apiKeySavedPreviewPrefix: 'Сохранён: ',
  providerNeedKey: 'Сначала сохраните API-ключ',
  modelNeedKey: 'Модель можно выбрать после сохранения ключа.',
  customModelOption: 'Пользовательская…',

  presetButtonNew: 'Сохранить как новый',
  presetButtonSaved: 'Сохранён',
  presetButtonOverwrite: 'Перезаписать',
  presetTitleNew: 'Сохранить как новый пресет',
  presetTitleNoChange: 'Нет изменений',
  presetTitleOverwrite: 'Перезаписать выбранный пресет',

  defaultCommitPrompt: [
    'Напишите заголовок до 50 символов и при необходимости пункты списка шириной 72 символа.',
    '- Избегайте повелительного наклонения; кратко опишите изменение (без мнений и предположений)',
    '- Пункты начинаются с "- "; добавляйте только при необходимости, каждая строка ≤72 символов',
    '- Добавляйте breaking changes и номера ISSUE/PR в тело при наличии',
    '- Запрещены мнения ИИ, извинения и уверения. Только факты',
    '- Добавьте тип по Conventional Commits как префикс заголовка',
    '- Пишите на русском'
  ].join('\n'),
  defaultPresetLabel: 'По умолчанию (нельзя удалить, можно редактировать)',
  providerDescriptionGemini: 'Напрямую вызывает Generative Language API (generateContent).',
  providerDescriptionOpenAi: 'Использует совместимый endpoint Responses / Chat Completions.',
  providerDescriptionClaude: 'Использует Claude 3 messages API.',

  msgApiKeySaved: 'API-ключ сохранён.',
  msgApiKeySavePick: 'Выберите провайдера для сохранения API-ключа',
  msgApiKeyInputPrompt: 'Введите API-ключ для {provider}',

  msgCommitGenerateTitle: 'Генерация сообщения коммита (Commit Maker)',
  msgCommitGenerateFetchingDiff: 'Получение diff…',
  msgCommitGenerateCallingLlm: 'Запрос к LLM…',
  msgCommitGenerateFailedPrefix: 'Не удалось сгенерировать сообщение коммита: ',
  msgCommitApplyProgress: 'Применение в SCM…',
  msgCommitApplySuccess: 'Сообщение коммита скопировано в поле SCM.',
  msgCommitNotGenerated: 'Сначала сгенерируйте сообщение коммита.',
  msgRepoNotFound: 'Репозиторий Git не найден.',
  msgCancelled: 'Отменено пользователем',
  msgDiffEmpty: 'Diff отсутствует. Проверьте staged/changes.',
  msgUnsupportedProvider: 'Неподдерживаемый провайдер: {provider}',
  msgApiKeyMissing: 'API-ключ для {provider} не задан. Сохраните в настройках.',
  msgLlmEmptyOpenAi: 'Ответ OpenAI пуст.',
  msgLlmEmptyGemini: 'Ответ Gemini пуст.',
  msgLlmEmptyClaude: 'Ответ Claude пуст.',
  msgHttpsInvalid: '{label} недействителен.',
  msgHttpsRequired: '{label} должен начинаться с https://. Проверьте настройки.',
  msgGitDiffFailed: 'git diff завершился с ошибкой: {detail}',
  msgGitStatusFailed: 'git status --porcelain завершился с ошибкой: {detail}',
  msgUntrackedReadFailed: 'Не удалось прочитать untracked файл: {path} ({detail})',
  msgUntrackedSkipBinary: 'Пропущен untracked файл (возможен бинарный): {path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: попытка {attempt}/{max}',
  logLlmRetry: '{label}: повтор через {delay}мс ({error})',

  toastSaved: '{action} в {timestamp}',
  toastDeleted: 'Удалено в {timestamp}',

  actionCreatedLabel: 'Создано',
  actionUpdatedLabel: 'Обновлено',
  actionDeletedLabel: 'Удалено',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### Staged',
  diffSectionUnstaged: '### Unstaged',
  diffSectionUntracked: '### Untracked {path}',
  diffHeading: '# Diff'
};

export default ru;
