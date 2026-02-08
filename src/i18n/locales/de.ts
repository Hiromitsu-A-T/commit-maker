import { UiStrings } from '../types';

const de: UiStrings = {
  langCode: 'de',
  appTitle: 'Commit Maker',

  languageSectionTitle: 'Anzeigesprache',
  languageName: 'Deutsch',

  apiKeySectionTitle: 'API-Schlüssel',
  apiKeyProviderLabel: 'Anbieter zum Speichern',
  apiKeyIssueButton: 'API-Schlüssel holen',
  apiKeyLabel: 'API-Schlüssel',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: 'Speichern',
  apiKeyClearButton: 'Löschen',

  llmSectionTitle: 'LLM-Einstellungen',
  providerLabel: 'Anbieter',
  modelLabel: 'Modell',
  customModelLabel: 'Benutzerdefinierter Modellname',
  customModelPlaceholder: 'example-model',
  reasoningLabel: 'Reasoning Effort (nur OpenAI)',
  verbosityLabel: 'Detailgrad (nur OpenAI)',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI (GPT-5 Familie)',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: 'Prompt & Optionen',
  presetNamePlaceholder: 'Preset-Name',
  presetAddButton: 'Neu hinzufügen',
  presetDeleteButton: 'Löschen',
  promptTextareaPlaceholder: 'z. B.: Titel in 50 Zeichen und Stichpunkte auf Deutsch.',
  includeUnstagedLabel: 'Unstaged Änderungen einbeziehen',
  includeUntrackedLabel: 'Untracked Dateien einbeziehen',
  includeBinaryLabel: 'Mögliche Binärdateien einbeziehen',
  maxPromptLabel: 'Prompt-Längenlimit',
  maxPromptUnlimited: 'Unbegrenzt (Standard)',
  maxPromptLimited: 'Limit setzen',
  maxPromptUnitLabel: 'Zeichen',
  maxPromptHint:
    'Setzen, wenn Tokens/Kosten begrenzt werden sollen. 0 oder leer = unbegrenzt. Bei Überschreitung bleiben vordere 20% und hintere 80%.',

  generationSectionTitle: 'Generieren & Ergebnis',
  generateButton: 'Generieren',
  generateButtonTitle: 'Diff laden und Commit-Text erzeugen',
  applyButton: 'Auf SCM anwenden',
  applyButtonTitle: 'Ergebnis in das SCM-Commit-Feld kopieren',
  resultPlaceholder: 'Noch nicht generiert.',
  resultHint: 'Ergebnis prüfen und „Auf SCM anwenden“ klicken, um in das Commit-Feld zu kopieren.',
  errorPlaceholder: '-',

  statusIdle: 'Bereit',
  statusLoading: 'LLM generiert…',
  statusReady: 'Fertig',
  statusError: 'Fehler',
  badgeUnstagedOn: 'Staged + Unstaged',
  badgeUnstagedOff: 'Nur Staged',

  apiKeySaved: 'Gespeichert',
  apiKeyNotSaved: 'Nicht gespeichert',
  apiKeySavedPreviewPrefix: 'Gespeichert: ',
  providerNeedKey: 'Bitte zuerst einen API-Schlüssel speichern',
  modelNeedKey: 'Modellwahl nach dem Speichern des API-Schlüssels möglich.',
  customModelOption: 'Benutzerdefiniert…',

  presetButtonNew: 'Neu speichern',
  presetButtonSaved: 'Gespeichert',
  presetButtonOverwrite: 'Überschreiben',
  presetTitleNew: 'Als neues Preset speichern',
  presetTitleNoChange: 'Keine Änderungen',
  presetTitleOverwrite: 'Ausgewähltes Preset überschreiben',

  defaultCommitPrompt: [
    'Schreibe einen Titel mit max. 50 Zeichen und bei Bedarf Stichpunkte mit 72 Zeichen Breite.',
    '- Imperativ vermeiden; Änderung kurz beschreiben (keine Meinung oder Vermutung)',
    '- Stichpunkte beginnen mit "- "; nur wenn nötig, jede Zeile ≤72 Zeichen',
    '- Breaking Changes und ISSUE/PR-Nummern in den Stichpunkten ergänzen',
    '- Keine KI-Meinungen, Entschuldigungen oder Beteuerungen. Nur Fakten',
    '- Conventional-Commits-Typ als Präfix vor den Titel setzen',
    '- Auf Deutsch ausgeben'
  ].join('\n'),
  defaultPresetLabel: 'Standard (nicht löschbar, editierbar)',
  providerDescriptionGemini: 'Ruft die Generative Language API (generateContent) direkt auf.',
  providerDescriptionOpenAi: 'Verwendet ein kompatibles Responses-/Chat-Completions-Endpoint.',
  providerDescriptionClaude: 'Nutzt die Claude 3 Messages API.',

  msgApiKeySaved: 'API-Schlüssel gespeichert.',
  msgApiKeySavePick: 'Wähle den Anbieter zum Speichern des API-Schlüssels',
  msgApiKeyInputPrompt: 'API-Schlüssel für {provider} eingeben',

  msgCommitGenerateTitle: 'Commit-Text erzeugen (Commit Maker)',
  msgCommitGenerateFetchingDiff: 'Diff wird geholt…',
  msgCommitGenerateCallingLlm: 'LLM wird abgefragt…',
  msgCommitGenerateFailedPrefix: 'Commit-Text konnte nicht erzeugt werden: ',
  msgCommitApplyProgress: 'Wird auf SCM angewendet…',
  msgCommitApplySuccess: 'Commit-Text in das SCM-Commit-Feld kopiert.',
  msgCommitNotGenerated: 'Bitte zuerst einen Commit-Text erzeugen.',
  msgRepoNotFound: 'Git-Repository nicht gefunden.',
  msgCancelled: 'Vom Benutzer abgebrochen',
  msgDiffEmpty: 'Kein Diff gefunden. Staging/Änderungen prüfen.',
  msgUnsupportedProvider: 'Nicht unterstützter Anbieter: {provider}',
  msgApiKeyMissing: 'API-Schlüssel für {provider} fehlt. In den Einstellungen speichern.',
  msgLlmEmptyOpenAi: 'OpenAI-Antwort war leer.',
  msgLlmEmptyGemini: 'Gemini-Antwort war leer.',
  msgLlmEmptyClaude: 'Claude-Antwort war leer.',
  msgHttpsInvalid: '{label} ist ungültig.',
  msgHttpsRequired: '{label} muss mit https:// beginnen. Einstellungen prüfen.',
  msgGitDiffFailed: 'git diff fehlgeschlagen: {detail}',
  msgGitStatusFailed: 'git status --porcelain fehlgeschlagen: {detail}',
  msgUntrackedReadFailed: 'Untracked Datei konnte nicht gelesen werden: {path} ({detail})',
  msgUntrackedSkipBinary: 'Untracked Datei übersprungen (vermutlich binär): {path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: Versuch {attempt}/{max}',
  logLlmRetry: '{label}: erneuter Versuch in {delay}ms ({error})',

  toastSaved: '{action} um {timestamp}',
  toastDeleted: 'Gelöscht um {timestamp}',

  actionCreatedLabel: 'Erstellt',
  actionUpdatedLabel: 'Aktualisiert',
  actionDeletedLabel: 'Gelöscht',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### Staged',
  diffSectionUnstaged: '### Unstaged',
  diffSectionUntracked: '### Untracked {path}',
  diffHeading: '# Diff'
};

export default de;
