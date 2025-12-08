import { UiStrings } from '../types';

const nb: UiStrings = {
  langCode: 'nb',
  appTitle: 'Commit Maker',

  languageSectionTitle: 'Visningsspråk',
  languageName: 'Norsk (Bokmål)',

  apiKeySectionTitle: 'API-nøkkel',
  apiKeyProviderLabel: 'Tilbyder å lagre hos',
  apiKeyIssueButton: 'Hent API-nøkkel',
  apiKeyLabel: 'API-nøkkel',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: 'Lagre',
  apiKeyClearButton: 'Tøm',

  llmSectionTitle: 'LLM-innstillinger',
  providerLabel: 'Tilbyder',
  modelLabel: 'Modell',
  customModelLabel: 'Egendefinert modellnavn',
  customModelPlaceholder: 'example-model',
  reasoningLabel: 'Reasoning Effort (kun OpenAI)',
  verbosityLabel: 'Detaljnivå (kun OpenAI)',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI (GPT-5-familien)',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: 'Prompt og alternativer',
  presetNamePlaceholder: 'Navn på forhåndsinnstilling',
  presetAddButton: 'Legg til ny',
  presetDeleteButton: 'Slett',
  promptTextareaPlaceholder: 'f.eks. Skriv en tittel på maks 50 tegn og punktliste på norsk.',
  includeUnstagedLabel: 'Ta med ikke-stagede endringer',
  includeUntrackedLabel: 'Ta med u-sporede filer',
  includeBinaryLabel: 'Ta med mulige binærfiler',
  maxPromptLabel: 'Grense for promptlengde',
  maxPromptUnlimited: 'Ubegrenset (standard)',
  maxPromptLimited: 'Sett grense',
  maxPromptUnitLabel: 'tegn',
  maxPromptHint:
    'Brukes for å begrense tokens/kostnad. 0 eller tom betyr ubegrenset. Hvis grensen overskrides, beholdes første 20 % og siste 80 %.',

  generationSectionTitle: 'Generer og resultat',
  generateButton: 'Generer',
  generateButtonTitle: 'Last inn diff og generer commit-melding',
  applyButton: 'Bruk til SCM',
  applyButtonTitle: 'Kopier resultatet til commit-feltet i Kildekontroll',
  resultPlaceholder: 'Ikke generert ennå.',
  resultHint: 'Se gjennom resultatet og klikk deretter "Bruk til SCM" for å kopiere til commit-feltet.',
  errorPlaceholder: '-',

  statusIdle: 'Tomgang',
  statusLoading: 'Genererer med LLM…',
  statusReady: 'Ferdig',
  statusError: 'Feil',
  badgeUnstagedOn: 'Staget + ikke-staget',
  badgeUnstagedOff: 'Kun staget',

  apiKeySaved: 'Lagret',
  apiKeyNotSaved: 'Ikke lagret',
  apiKeySavedPreviewPrefix: 'Lagret: ',
  providerNeedKey: 'Lagre en API-nøkkel først',
  modelNeedKey: 'Du kan velge modell etter at API-nøkkelen er lagret.',
  customModelOption: 'Egendefinert…',

  presetButtonNew: 'Lagre som ny',
  presetButtonSaved: 'Lagret',
  presetButtonOverwrite: 'Overskriv',
  presetTitleNew: 'Lagre som ny forhåndsinnstilling',
  presetTitleNoChange: 'Ingen endringer',
  presetTitleOverwrite: 'Overskriv valgt forhåndsinnstilling',

  defaultCommitPrompt: [
    'Skriv en tittel på maks 50 tegn og, ved behov, punktvise brødtekstrader på 72 tegn.',
    '- Unngå imperativ; beskriv kort endringen (ingen mening eller gjetning)',
    '- Brødtekstrader starter med "- "; legg bare til ved behov, hver maks 72 tegn',
    '- Legg til breaking changes og issue/PR-numre i brødteksten når det er relevant',
    '- Ingen AI-meninger, unnskyldninger eller sikkerhetserklæringer. Kun fakta',
    '- Sett en Conventional Commits-type som prefiks i tittelen',
    '- Skriv på norsk (bokmål)'
  ].join('\n'),
  defaultPresetLabel: 'Standard (låst, redigerbar)',
  providerDescriptionGemini: 'Kaller Generative Language API (generateContent) direkte.',
  providerDescriptionOpenAi: 'Bruker Responses API / Chat Completions kompatibelt endepunkt.',
  providerDescriptionClaude: 'Bruker Claude 3 messages API.',

  msgApiKeySaved: 'API-nøkkel lagret.',
  msgApiKeySavePick: 'Velg tilbyder for å lagre API-nøkkelen',
  msgApiKeyInputPrompt: 'Skriv inn API-nøkkel for {provider}',

  msgCommitGenerateTitle: 'Genererer commit-melding (Commit Maker)',
  msgCommitGenerateFetchingDiff: 'Henter diff…',
  msgCommitGenerateCallingLlm: 'Spør LLM…',
  msgCommitGenerateFailedPrefix: 'Kunne ikke generere commit-melding: ',
  msgCommitApplyProgress: 'Bruker til SCM…',
  msgCommitApplySuccess: 'Commit-meldingen ble kopiert til SCM-feltet.',
  msgCommitNotGenerated: 'Generer commit-melding først.',
  msgRepoNotFound: 'Fant ikke Git-repo.',
  msgCancelled: 'Avbrutt av bruker',
  msgDiffEmpty: 'Ingen diff funnet. Sjekk staged/endringer.',
  msgUnsupportedProvider: 'Ikke støttet tilbyder: {provider}',
  msgApiKeyMissing: '{provider}-nøkkel er ikke satt. Lagre den i innstillinger.',
  msgLlmEmptyOpenAi: 'OpenAI-svaret var tomt.',
  msgLlmEmptyGemini: 'Gemini-svaret var tomt.',
  msgLlmEmptyClaude: 'Claude-svaret var tomt.',
  msgHttpsInvalid: '{label} er ugyldig.',
  msgHttpsRequired: '{label} må starte med https://. Sjekk innstillingene.',
  msgGitDiffFailed: 'git diff mislyktes: {detail}',
  msgGitStatusFailed: 'git status --porcelain mislyktes: {detail}',
  msgUntrackedReadFailed: 'Kunne ikke lese u-sporet fil: {path} ({detail})',
  msgUntrackedSkipBinary: 'U-sporet fil hoppet over (mistenkt binær): {path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: forsøk {attempt}/{max}',
  logLlmRetry: '{label}: prøver igjen om {delay}ms ({error})',

  toastSaved: '{action} kl. {timestamp}',
  toastDeleted: 'Slettet kl. {timestamp}',

  actionCreatedLabel: 'Opprettet',
  actionUpdatedLabel: 'Oppdatert',
  actionDeletedLabel: 'Slettet',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### Staget',
  diffSectionUnstaged: '### Ikke-staget',
  diffSectionUntracked: '### U-sporet {path}',
  diffHeading: '# Diff'
};

export default nb;
