import { UiStrings } from '../types';

const sv: UiStrings = {
  langCode: 'sv',
  appTitle: 'Commit Maker',

  languageSectionTitle: 'Visningsspråk',
  languageName: 'Svenska',

  apiKeySectionTitle: 'API-nyckel',
  apiKeyProviderLabel: 'Leverantör att spara till',
  apiKeyIssueButton: 'Hämta API-nyckel',
  apiKeyLabel: 'API-nyckel',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: 'Spara',
  apiKeyClearButton: 'Rensa',

  llmSectionTitle: 'LLM-inställningar',
  providerLabel: 'Leverantör',
  modelLabel: 'Modell',
  customModelLabel: 'Anpassat modellnamn',
  customModelPlaceholder: 'example-model',
  reasoningLabel: 'Reasoning Effort (endast OpenAI)',
  verbosityLabel: 'Detaljnivå (endast OpenAI)',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI (GPT-5-familjen)',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: 'Prompt och alternativ',
  presetNamePlaceholder: 'Preset-namn',
  presetAddButton: 'Lägg till ny',
  presetDeleteButton: 'Ta bort',
  promptTextareaPlaceholder: 't.ex. Skriv en titel på högst 50 tecken och en punktlista på svenska.',
  includeUnstagedLabel: 'Ta med ej staged ändringar',
  includeUntrackedLabel: 'Ta med ospårade filer',
  includeBinaryLabel: 'Ta med misstänkta binärer',
  maxPromptLabel: 'Gräns för promptlängd',
  maxPromptUnlimited: 'Obegränsat (standard)',
  maxPromptLimited: 'Sätt en gräns',
  maxPromptUnitLabel: 'tecken',
  maxPromptHint:
    'Använd för att begränsa tokens/kostnad. 0 eller tomt betyder obegränsat. Vid överskridande behålls första 20% och sista 80%.',

  generationSectionTitle: 'Generera och resultat',
  generateButton: 'Generera',
  generateButtonTitle: 'Läs in diff och generera commit-meddelande',
  applyButton: 'Verkställ till SCM',
  applyButtonTitle: 'Kopiera resultatet till commitfältet i Källkodshantering',
  resultPlaceholder: 'Ännu inte genererat.',
  resultHint: 'Granska resultatet och klicka sedan på "Verkställ till SCM" för att kopiera till commitfältet.',
  errorPlaceholder: '-',

  statusIdle: 'Väntar',
  statusLoading: 'Genererar med LLM…',
  statusReady: 'Klart',
  statusError: 'Fel',
  badgeUnstagedOn: 'Staged + ej staged',
  badgeUnstagedOff: 'Endast staged',

  apiKeySaved: 'Sparad',
  apiKeyNotSaved: 'Inte sparad',
  apiKeySavedPreviewPrefix: 'Sparad: ',
  providerNeedKey: 'Spara en API-nyckel först',
  modelNeedKey: 'Välj modell efter att API-nyckeln är sparad.',
  customModelOption: 'Anpassad…',

  presetButtonNew: 'Spara som ny',
  presetButtonSaved: 'Sparad',
  presetButtonOverwrite: 'Skriv över',
  presetTitleNew: 'Spara som ny preset',
  presetTitleNoChange: 'Inga ändringar',
  presetTitleOverwrite: 'Skriv över vald preset',

  defaultCommitPrompt: [
    'Skriv en titel på högst 50 tecken och, vid behov, punktlistade brödtext-rader på 72 tecken.',
    '- Undvik imperativ; beskriv kort ändringen (ingen åsikt eller gissning)',
    '- Brödtextrader börjar med "- "; lägg bara till vid behov, varje rad max 72 tecken',
    '- Lägg till breaking changes och issue/PR-nummer i brödtexten när det är relevant',
    '- Inga AI-åsikter, ursäkter eller säkerhetsuttryck. Endast fakta',
    '- Lägg till en Conventional Commits-typ som prefix i titeln',
    '- Skriv ut på svenska'
  ].join('\n'),
  defaultPresetLabel: 'Standard (låst, redigerbar)',
  providerDescriptionGemini: 'Anropar direkt Generative Language API (generateContent).',
  providerDescriptionOpenAi: 'Använder Responses API / Chat Completions kompatibel endpoint.',
  providerDescriptionClaude: 'Använder Claude 3 messages API.',

  msgApiKeySaved: 'API-nyckel sparad.',
  msgApiKeySavePick: 'Välj leverantör att spara API-nyckeln för',
  msgApiKeyInputPrompt: 'Ange API-nyckel för {provider}',

  msgCommitGenerateTitle: 'Generera commit-meddelande (Commit Maker)',
  msgCommitGenerateFetchingDiff: 'Hämtar diff…',
  msgCommitGenerateCallingLlm: 'Frågar LLM…',
  msgCommitGenerateFailedPrefix: 'Misslyckades att generera commit-meddelande: ',
  msgCommitApplyProgress: 'Verkställer till SCM…',
  msgCommitApplySuccess: 'Commit-meddelandet kopierades till SCM-inmatningen.',
  msgCommitNotGenerated: 'Generera commit-meddelande först.',
  msgRepoNotFound: 'Ingen Git-repo hittades.',
  msgCancelled: 'Avbrutet av användaren',
  msgDiffEmpty: 'Ingen diff hittades. Kontrollera staged/changes.',
  msgUnsupportedProvider: 'Ej stödd leverantör: {provider}',
  msgApiKeyMissing: '{provider}-nyckeln är inte inställd. Spara den i inställningarna.',
  msgLlmEmptyOpenAi: 'OpenAI-svar var tomt.',
  msgLlmEmptyGemini: 'Gemini-svar var tomt.',
  msgLlmEmptyClaude: 'Claude-svar var tomt.',
  msgHttpsInvalid: '{label} är ogiltig.',
  msgHttpsRequired: '{label} måste börja med https://. Kontrollera inställningarna.',
  msgGitDiffFailed: 'Misslyckades att köra git diff: {detail}',
  msgGitStatusFailed: 'git status --porcelain misslyckades: {detail}',
  msgUntrackedReadFailed: 'Kunde inte läsa ospårad fil: {path} ({detail})',
  msgUntrackedSkipBinary: 'Ospårad fil hoppades över (misstänkt binär): {path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: försök {attempt}/{max}',
  logLlmRetry: '{label}: försöker igen om {delay}ms ({error})',

  toastSaved: '{action} kl. {timestamp}',
  toastDeleted: 'Raderad kl. {timestamp}',

  actionCreatedLabel: 'Skapad',
  actionUpdatedLabel: 'Uppdaterad',
  actionDeletedLabel: 'Raderad',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### Staged',
  diffSectionUnstaged: '### Ej staged',
  diffSectionUntracked: '### Ospårad {path}',
  diffHeading: '# Diff'
};

export default sv;
