import { UiStrings } from '../types';

const fr: UiStrings = {
  langCode: 'fr',
  appTitle: 'Commit Maker',

  languageSectionTitle: 'Langue d’affichage',
  languageName: 'Français',

  apiKeySectionTitle: 'Clé API',
  apiKeyProviderLabel: 'Fournisseur de stockage',
  apiKeyIssueButton: 'Obtenir une clé API',
  apiKeyLabel: 'Clé API',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: 'Enregistrer',
  apiKeyClearButton: 'Effacer',

  llmSectionTitle: 'Paramètres LLM',
  providerLabel: 'Fournisseur',
  modelLabel: 'Modèle',
  customModelLabel: 'Nom de modèle personnalisé',
  customModelPlaceholder: 'example-model',
  reasoningLabel: 'Reasoning Effort (OpenAI uniquement)',
  verbosityLabel: 'Niveau de détail (OpenAI uniquement)',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI (famille GPT-5)',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: 'Prompt et options',
  presetNamePlaceholder: 'Nom du preset',
  presetAddButton: 'Ajouter',
  presetDeleteButton: 'Supprimer',
  promptTextareaPlaceholder: 'Ex. : Rédigez un titre de 50 caractères et un corps à puces en français.',
  includeUnstagedLabel: 'Inclure les changements non indexés',
  includeUntrackedLabel: 'Inclure les fichiers non suivis',
  includeBinaryLabel: 'Inclure les fichiers peut-être binaires',
  maxPromptLabel: 'Limite de longueur du prompt',
  maxPromptUnlimited: 'Illimitée (défaut)',
  maxPromptLimited: 'Définir une limite',
  maxPromptUnitLabel: 'caractères',
  maxPromptHint:
    'À utiliser pour limiter les tokens/coût. 0 ou vide = illimité. Au-delà, on conserve les 20% de début et 80% de fin.',

  generationSectionTitle: 'Génération et résultat',
  generateButton: 'Générer',
  generateButtonTitle: 'Lire le diff et générer le message de commit',
  applyButton: 'Appliquer au SCM',
  applyButtonTitle: 'Copier le résultat dans le champ de commit du contrôle de source',
  resultPlaceholder: 'Pas encore généré.',
  resultHint: 'Vérifiez le résultat puis cliquez sur « Appliquer au SCM » pour copier dans le champ de commit.',
  errorPlaceholder: '-',

  statusIdle: 'Attente',
  statusLoading: 'Génération LLM…',
  statusReady: 'Terminé',
  statusError: 'Erreur',
  badgeUnstagedOn: 'Indexés + non indexés',
  badgeUnstagedOff: 'Indexés seulement',

  apiKeySaved: 'Enregistrée',
  apiKeyNotSaved: 'Non enregistrée',
  apiKeySavedPreviewPrefix: 'Enregistrée : ',
  providerNeedKey: 'Enregistrez d’abord une clé API',
  modelNeedKey: 'Vous pourrez choisir un modèle après avoir enregistré la clé.',
  customModelOption: 'Personnalisé…',

  presetButtonNew: 'Enregistrer comme nouveau',
  presetButtonSaved: 'Enregistré',
  presetButtonOverwrite: 'Écraser',
  presetTitleNew: 'Enregistrer comme nouveau preset',
  presetTitleNoChange: 'Aucun changement',
  presetTitleOverwrite: 'Écraser le preset sélectionné',

  defaultCommitPrompt: [
    'Rédigez un titre de 50 caractères max et, si besoin, un corps en puces de 72 caractères.',
    '- Évitez l’impératif ; décrivez brièvement le changement (pas d’opinion ni de supposition)',
    '- Corps en puces débutant par "- ", seulement si nécessaire, chaque ligne ≤72 caractères',
    '- Ajoutez changements cassants et numéros d’issue/PR si applicable',
    '- Pas d’opinions IA, d’excuses ni de déclarations de confiance. Uniquement des faits',
    '- Ajoutez le type Conventional Commits en préfixe du titre',
    '- Écrivez en français'
  ].join('\n'),
  defaultPresetLabel: 'Défaut (non supprimable, éditable)',
  providerDescriptionGemini: 'Appelle directement Generative Language API (generateContent).',
  providerDescriptionOpenAi: 'Utilise un endpoint compatible Responses API / Chat Completions.',
  providerDescriptionClaude: 'Utilise Claude 3 messages API.',

  msgApiKeySaved: 'Clé API enregistrée.',
  msgApiKeySavePick: 'Choisissez le fournisseur où enregistrer la clé API',
  msgApiKeyInputPrompt: 'Entrez la clé API pour {provider}',

  msgCommitGenerateTitle: 'Génération de message de commit (Commit Maker)',
  msgCommitGenerateFetchingDiff: 'Récupération du diff…',
  msgCommitGenerateCallingLlm: 'Interrogation du LLM…',
  msgCommitGenerateFailedPrefix: 'Échec de génération du message de commit : ',
  msgCommitApplyProgress: 'Application au SCM…',
  msgCommitApplySuccess: 'Message de commit copié dans le champ SCM.',
  msgCommitNotGenerated: 'Générez d’abord un message de commit.',
  msgRepoNotFound: 'Dépôt Git introuvable.',
  msgCancelled: 'Annulé par l’utilisateur',
  msgDiffEmpty: 'Aucun diff. Vérifiez les fichiers indexés/modifiés.',
  msgUnsupportedProvider: 'Fournisseur non supporté : {provider}',
  msgApiKeyMissing: 'Clé API manquante pour {provider}. Enregistrez-la dans les paramètres.',
  msgLlmEmptyOpenAi: 'Réponse OpenAI vide.',
  msgLlmEmptyGemini: 'Réponse Gemini vide.',
  msgLlmEmptyClaude: 'Réponse Claude vide.',
  msgHttpsInvalid: '{label} est invalide.',
  msgHttpsRequired: '{label} doit commencer par https://. Vérifiez la config.',
  msgGitDiffFailed: 'Échec git diff : {detail}',
  msgGitStatusFailed: 'Échec git status --porcelain : {detail}',
  msgUntrackedReadFailed: 'Lecture de fichier non suivi échouée : {path} ({detail})',
  msgUntrackedSkipBinary: 'Fichier non suivi ignoré (binaire suspect) : {path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label} : tentative {attempt}/{max}',
  logLlmRetry: '{label} : nouvel essai dans {delay}ms ({error})',

  toastSaved: '{action} à {timestamp}',
  toastDeleted: 'Supprimé à {timestamp}',

  actionCreatedLabel: 'Créé',
  actionUpdatedLabel: 'Mis à jour',
  actionDeletedLabel: 'Supprimé',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### Indexés',
  diffSectionUnstaged: '### Non indexés',
  diffSectionUntracked: '### Non suivis {path}',
  diffHeading: '# Diff'
};

export default fr;
