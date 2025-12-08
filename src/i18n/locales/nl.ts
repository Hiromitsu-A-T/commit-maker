import { UiStrings } from '../types';

const nl: UiStrings = {
  langCode: 'nl',
  appTitle: 'Commit Maker',

  languageSectionTitle: 'Weergavetaal',
  languageName: 'Nederlands',

  apiKeySectionTitle: 'API-sleutel',
  apiKeyProviderLabel: 'Provider om op te slaan',
  apiKeyIssueButton: 'API-sleutel ophalen',
  apiKeyLabel: 'API-sleutel',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: 'Opslaan',
  apiKeyClearButton: 'Wissen',

  llmSectionTitle: 'LLM-instellingen',
  providerLabel: 'Provider',
  modelLabel: 'Model',
  customModelLabel: 'Aangepaste modelnaam',
  customModelPlaceholder: 'example-model',
  reasoningLabel: 'Reasoning Effort (alleen OpenAI)',
  verbosityLabel: 'Gedetailleerdheid (alleen OpenAI)',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI (GPT-5-familie)',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: 'Prompt en opties',
  presetNamePlaceholder: 'Presetnaam',
  presetAddButton: 'Nieuw toevoegen',
  presetDeleteButton: 'Verwijderen',
  promptTextareaPlaceholder: 'bijv. Schrijf een titel van max 50 tekens en een puntsgewijze body in het Nederlands.',
  includeUnstagedLabel: 'Niet-geïndexeerde wijzigingen meenemen',
  includeUntrackedLabel: 'Niet-gevolgde bestanden meenemen',
  includeBinaryLabel: 'Mogelijke binaire bestanden meenemen',
  maxPromptLabel: 'Promptlengte limiet',
  maxPromptUnlimited: 'Onbeperkt (standaard)',
  maxPromptLimited: 'Limiet instellen',
  maxPromptUnitLabel: 'tekens',
  maxPromptHint:
    'Gebruik dit om tokens/kosten te begrenzen. 0 of leeg betekent onbeperkt. Bij overschrijding blijven de eerste 20% en laatste 80% staan.',

  generationSectionTitle: 'Genereren en resultaat',
  generateButton: 'Genereren',
  generateButtonTitle: 'Diff laden en commitbericht genereren',
  applyButton: 'Toepassen op SCM',
  applyButtonTitle: 'Resultaat kopiëren naar het commitveld van Source Control',
  resultPlaceholder: 'Nog niet gegenereerd.',
  resultHint: 'Controleer het resultaat en klik vervolgens op "Toepassen op SCM" om het naar het commitveld te kopiëren.',
  errorPlaceholder: '-',

  statusIdle: 'Wachten',
  statusLoading: 'LLM genereert…',
  statusReady: 'Klaar',
  statusError: 'Fout',
  badgeUnstagedOn: 'Geïndexeerd + niet-geïndexeerd',
  badgeUnstagedOff: 'Alleen geïndexeerd',

  apiKeySaved: 'Opgeslagen',
  apiKeyNotSaved: 'Niet opgeslagen',
  apiKeySavedPreviewPrefix: 'Opgeslagen: ',
  providerNeedKey: 'Sla eerst een API-sleutel op',
  modelNeedKey: 'Kies een model nadat je de API-sleutel hebt opgeslagen.',
  customModelOption: 'Aangepast…',

  presetButtonNew: 'Opslaan als nieuw',
  presetButtonSaved: 'Opgeslagen',
  presetButtonOverwrite: 'Overschrijven',
  presetTitleNew: 'Opslaan als nieuwe preset',
  presetTitleNoChange: 'Geen wijzigingen',
  presetTitleOverwrite: 'Geselecteerde preset overschrijven',

  defaultCommitPrompt: [
    'Schrijf een titel van maximaal 50 tekens en, indien nodig, puntsgewijze bodyregels binnen 72 tekens.',
    '- Vermijd gebiedende wijs; beschrijf kort de wijziging (geen mening of gok)',
    '- Bodyregels beginnen met "- "; alleen toevoegen indien nodig, elk binnen 72 tekens',
    '- Voeg breaking changes en issue/PR-nummers toe aan de body wanneer van toepassing',
    '- Geen AI-meningen, excuses of zekerheidsverklaringen. Alleen feiten',
    '- Zet een Conventional Commits type als prefix voor de titel',
    '- Output in het Nederlands'
  ].join('\n'),
  defaultPresetLabel: 'Standaard (vergrendeld, bewerkbaar)',
  providerDescriptionGemini: 'Roept direct de Generative Language API (generateContent) aan.',
  providerDescriptionOpenAi: 'Gebruikt Responses API / Chat Completions compatibele endpoint.',
  providerDescriptionClaude: 'Gebruikt de Claude 3 messages API.',

  msgApiKeySaved: 'API-sleutel opgeslagen.',
  msgApiKeySavePick: 'Kies een provider om de API-sleutel op te slaan',
  msgApiKeyInputPrompt: 'Voer de API-sleutel in voor {provider}',

  msgCommitGenerateTitle: 'Commitbericht genereren (Commit Maker)',
  msgCommitGenerateFetchingDiff: 'Diff ophalen…',
  msgCommitGenerateCallingLlm: 'LLM bevragen…',
  msgCommitGenerateFailedPrefix: 'Commitbericht genereren mislukt: ',
  msgCommitApplyProgress: 'Toepassen op SCM…',
  msgCommitApplySuccess: 'Commitbericht gekopieerd naar het SCM-invoerveld.',
  msgCommitNotGenerated: 'Genereer eerst een commitbericht.',
  msgRepoNotFound: 'Geen Git-repository gevonden.',
  msgCancelled: 'Geannuleerd door gebruiker',
  msgDiffEmpty: 'Geen diff gevonden. Controleer staged/changes.',
  msgUnsupportedProvider: 'Niet-ondersteunde provider: {provider}',
  msgApiKeyMissing: 'API-sleutel voor {provider} is niet ingesteld. Sla deze op in de instellingen.',
  msgLlmEmptyOpenAi: 'OpenAI-respons was leeg.',
  msgLlmEmptyGemini: 'Gemini-respons was leeg.',
  msgLlmEmptyClaude: 'Claude-respons was leeg.',
  msgHttpsInvalid: '{label} is ongeldig.',
  msgHttpsRequired: '{label} moet beginnen met https://. Controleer de instellingen.',
  msgGitDiffFailed: 'git diff uitvoeren mislukt: {detail}',
  msgGitStatusFailed: 'git status --porcelain mislukt: {detail}',
  msgUntrackedReadFailed: 'Niet-gevolgde file lezen mislukt: {path} ({detail})',
  msgUntrackedSkipBinary: 'Niet-gevolgde file overgeslagen (mogelijk binair): {path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: poging {attempt}/{max}',
  logLlmRetry: '{label}: opnieuw proberen over {delay}ms ({error})',

  toastSaved: '{action} om {timestamp}',
  toastDeleted: 'Verwijderd om {timestamp}',

  actionCreatedLabel: 'Aangemaakt',
  actionUpdatedLabel: 'Bijgewerkt',
  actionDeletedLabel: 'Verwijderd',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### Geïndexeerd',
  diffSectionUnstaged: '### Niet-geïndexeerd',
  diffSectionUntracked: '### Niet-gevolgd {path}',
  diffHeading: '# Diff'
};

export default nl;
