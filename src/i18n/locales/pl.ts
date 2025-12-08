import { UiStrings } from '../types';

const pl: UiStrings = {
  langCode: 'pl',
  appTitle: 'Commit Maker',

  languageSectionTitle: 'Język wyświetlania',
  languageName: 'Polski',

  apiKeySectionTitle: 'Klucz API',
  apiKeyProviderLabel: 'Dostawca do zapisania',
  apiKeyIssueButton: 'Pobierz klucz API',
  apiKeyLabel: 'Klucz API',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: 'Zapisz',
  apiKeyClearButton: 'Wyczyść',

  llmSectionTitle: 'Ustawienia LLM',
  providerLabel: 'Dostawca',
  modelLabel: 'Model',
  customModelLabel: 'Nazwa własnego modelu',
  customModelPlaceholder: 'przyklad-modelu',
  reasoningLabel: 'Reasoning Effort (tylko OpenAI)',
  verbosityLabel: 'Verbosity (tylko OpenAI)',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI (rodzina GPT-5)',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: 'Prompt i opcje',
  presetNamePlaceholder: 'Nazwa preset',
  presetAddButton: 'Dodaj',
  presetDeleteButton: 'Usuń',
  promptTextareaPlaceholder: 'np. Napisz tytuł do 50 znaków i punktowane ciało po angielsku.',
  includeUnstagedLabel: 'Dołącz zmiany nieindeksowane',
  includeUntrackedLabel: 'Dołącz pliki nieśledzone',
  includeBinaryLabel: 'Dołącz pliki podejrzane o binarne',
  maxPromptLabel: 'Limit długości promptu',
  maxPromptUnlimited: 'Bez limitu (domyślnie)',
  maxPromptLimited: 'Ustaw limit',
  maxPromptUnitLabel: 'zn.',
  maxPromptHint:
    'Użyj limitu, aby kontrolować tokeny/koszt. 0 lub puste oznacza brak limitu. Po przekroczeniu zachowaj pierwsze 20% i ostatnie 80%.',

  generationSectionTitle: 'Generuj i wynik',
  generateButton: 'Generuj',
  generateButtonTitle: 'Wczytaj diff i wygeneruj wiadomość commita',
  applyButton: 'Zastosuj do SCM',
  applyButtonTitle: 'Kopiuj wynik do pola commit w Kontroli źródła',
  resultPlaceholder: 'Jeszcze nie wygenerowano.',
  resultHint: 'Sprawdź wynik i kliknij "Zastosuj do SCM", aby skopiować do pola commit.',
  errorPlaceholder: '-',

  statusIdle: 'Bezczynne',
  statusLoading: 'Generowanie z LLM…',
  statusReady: 'Gotowe',
  statusError: 'Błąd',
  badgeUnstagedOn: 'Zaindeksowane + Niezaindeksowane',
  badgeUnstagedOff: 'Tylko zaindeksowane',

  apiKeySaved: 'Zapisano',
  apiKeyNotSaved: 'Nie zapisano',
  apiKeySavedPreviewPrefix: 'Zapisano: ',
  providerNeedKey: 'Najpierw zapisz klucz API',
  modelNeedKey: 'Model wybierzesz po zapisaniu klucza API.',
  customModelOption: 'Własny…',

  presetButtonNew: 'Zapisz jako nowy',
  presetButtonSaved: 'Zapisano',
  presetButtonOverwrite: 'Nadpisz',
  presetTitleNew: 'Zapisz jako nowy preset',
  presetTitleNoChange: 'Brak zmian',
  presetTitleOverwrite: 'Nadpisz wybrany preset',

  defaultCommitPrompt: [
    'Napisz tytuł do 50 znaków i – gdy trzeba – punktowane ciało zawijane do 72 znaków.',
    '- Unikaj trybu rozkazującego; krótko opisz zmianę (bez opinii i domysłów)',
    '- Linijki ciała zaczynaj od "- "; dodawaj tylko, gdy potrzebne, każda do 72 znaków',
    '- Podaj breaking changes i numery issue/PR w ciele, jeśli dotyczy',
    '- Żadnych opinii AI, przeprosin ani uwag o pewności. Tylko fakty',
    '- Dodaj typ Conventional Commit na początku tytułu',
    '- Wynik po polsku'
  ].join('\n'),
  defaultPresetLabel: 'Domyślny (zablokowany, edytowalny)',
  providerDescriptionGemini: 'Bezpośrednie wywołanie Generative Language API (generateContent).',
  providerDescriptionOpenAi: 'Używa zgodnych endpointów Responses / Chat Completions.',
  providerDescriptionClaude: 'Używa API Claude 3 messages.',

  msgApiKeySaved: 'Zapisano klucz API.',
  msgApiKeySavePick: 'Wybierz dostawcę do zapisania klucza API',
  msgApiKeyInputPrompt: 'Podaj klucz API dla {provider}',

  msgCommitGenerateTitle: 'Generowanie commita (Commit Maker)',
  msgCommitGenerateFetchingDiff: 'Pobieranie diff…',
  msgCommitGenerateCallingLlm: 'Zapytanie do LLM…',
  msgCommitGenerateFailedPrefix: 'Nie udało się wygenerować: ',
  msgCommitApplyProgress: 'Zastosowywanie do SCM…',
  msgCommitApplySuccess: 'Wiadomość commit wstawiona do pola.',
  msgCommitNotGenerated: 'Najpierw wygeneruj wiadomość commit.',
  msgRepoNotFound: 'Repozytorium Git nie znalezione.',
  msgCancelled: 'Anulowano przez użytkownika',
  msgDiffEmpty: 'Brak diff. Sprawdź stage/zmiany.',
  msgUnsupportedProvider: 'Nieobsługiwany dostawca: {provider}',
  msgApiKeyMissing: 'Brak klucza API dla {provider}. Zapisz go w ustawieniach.',
  msgLlmEmptyOpenAi: 'Pusta odpowiedź OpenAI.',
  msgLlmEmptyGemini: 'Pusta odpowiedź Gemini.',
  msgLlmEmptyClaude: 'Pusta odpowiedź Claude.',
  msgHttpsInvalid: '{label} jest nieprawidłowe.',
  msgHttpsRequired: '{label} musi zaczynać się od https://. Sprawdź ustawienia.',
  msgGitDiffFailed: 'git diff nie powiódł się: {detail}',
  msgGitStatusFailed: 'git status --porcelain nie powiódł się: {detail}',
  msgUntrackedReadFailed: 'Błąd odczytu pliku nieśledzonego: {path} ({detail})',
  msgUntrackedSkipBinary: 'Pominięto plik nieśledzony (podejrzenie binarnego): {path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: próba {attempt}/{max}',
  logLlmRetry: '{label}: ponowne za {delay}ms ({error})',

  toastSaved: '{action} o {timestamp}',
  toastDeleted: 'Usunięto o {timestamp}',

  actionCreatedLabel: 'Utworzono',
  actionUpdatedLabel: 'Zaktualizowano',
  actionDeletedLabel: 'Usunięto',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### Zaindeksowane',
  diffSectionUnstaged: '### Niezaindeksowane',
  diffSectionUntracked: '### Nieśledzone {path}',
  diffHeading: '# Diff'
};

export default pl;
