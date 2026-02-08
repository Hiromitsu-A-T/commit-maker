import { UiStrings } from '../types';

const pt: UiStrings = {
  langCode: 'pt-BR',
  appTitle: 'Commit Maker',

  languageSectionTitle: 'Idioma de exibição',
  languageName: 'Português (Brasil)',

  apiKeySectionTitle: 'Chave de API',
  apiKeyProviderLabel: 'Fornecedor para salvar',
  apiKeyIssueButton: 'Obter chave de API',
  apiKeyLabel: 'Chave de API',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: 'Salvar',
  apiKeyClearButton: 'Limpar',

  llmSectionTitle: 'Configurações de LLM',
  providerLabel: 'Fornecedor',
  modelLabel: 'Modelo',
  customModelLabel: 'Nome do modelo customizado',
  customModelPlaceholder: 'example-model',
  reasoningLabel: 'Reasoning Effort (apenas OpenAI)',
  verbosityLabel: 'Nível de detalhe (apenas OpenAI)',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI (família GPT-5)',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: 'Prompt e opções',
  presetNamePlaceholder: 'Nome do preset',
  presetAddButton: 'Adicionar novo',
  presetDeleteButton: 'Excluir',
  promptTextareaPlaceholder: 'Ex.: Escreva um título de 50 caracteres e corpo em tópicos em português.',
  includeUnstagedLabel: 'Incluir alterações não staged',
  includeUntrackedLabel: 'Incluir arquivos não rastreados',
  includeBinaryLabel: 'Incluir arquivos possivelmente binários',
  maxPromptLabel: 'Limite de comprimento do prompt',
  maxPromptUnlimited: 'Ilimitado (padrão)',
  maxPromptLimited: 'Definir limite',
  maxPromptUnitLabel: 'caracteres',
  maxPromptHint:
    'Use para limitar tokens/custo. 0 ou vazio = ilimitado. Se exceder, mantém 20% inicial e 80% final.',

  generationSectionTitle: 'Gerar e resultado',
  generateButton: 'Gerar',
  generateButtonTitle: 'Ler diff e gerar mensagem de commit',
  applyButton: 'Aplicar no SCM',
  applyButtonTitle: 'Copiar resultado para o campo de commit do Source Control',
  resultPlaceholder: 'Ainda não gerado.',
  resultHint: 'Revise o resultado e clique em “Aplicar no SCM” para copiar para o campo de commit.',
  errorPlaceholder: '-',

  statusIdle: 'Pronto',
  statusLoading: 'Gerando com LLM…',
  statusReady: 'Concluído',
  statusError: 'Erro',
  badgeUnstagedOn: 'Staged + Unstaged',
  badgeUnstagedOff: 'Somente Staged',

  apiKeySaved: 'Salvo',
  apiKeyNotSaved: 'Não salvo',
  apiKeySavedPreviewPrefix: 'Salvo: ',
  providerNeedKey: 'Salve uma chave de API primeiro',
  modelNeedKey: 'Escolha o modelo após salvar a chave.',
  customModelOption: 'Customizado…',

  presetButtonNew: 'Salvar como novo',
  presetButtonSaved: 'Salvo',
  presetButtonOverwrite: 'Sobrescrever',
  presetTitleNew: 'Salvar como novo preset',
  presetTitleNoChange: 'Nenhuma alteração',
  presetTitleOverwrite: 'Sobrescrever o preset selecionado',

  defaultCommitPrompt: [
    'Escreva um título de até 50 caracteres e, se necessário, corpo em tópicos com 72 caracteres.',
    '- Evite imperativo; descreva a mudança de forma concisa (sem opiniões ou suposições)',
    '- Corpo em tópicos iniciando com "- "; apenas se necessário, cada linha ≤72 caracteres',
    '- Inclua breaking changes e nº de ISSUE/PR no corpo se aplicável',
    '- Proibido opinião da IA, pedidos de desculpas ou declarações de confiança. Apenas fatos',
    '- Adicione o tipo de Conventional Commits como prefixo do título',
    '- Escreva em português'
  ].join('\n'),
  defaultPresetLabel: 'Padrão (não removível, editável)',
  providerDescriptionGemini: 'Chama diretamente a Generative Language API (generateContent).',
  providerDescriptionOpenAi: 'Usa endpoint compatível com Responses / Chat Completions.',
  providerDescriptionClaude: 'Usa a Claude 3 messages API.',

  msgApiKeySaved: 'Chave de API salva.',
  msgApiKeySavePick: 'Escolha o fornecedor para salvar a chave de API',
  msgApiKeyInputPrompt: 'Digite a chave de API de {provider}',

  msgCommitGenerateTitle: 'Geração de mensagem de commit (Commit Maker)',
  msgCommitGenerateFetchingDiff: 'Buscando diff…',
  msgCommitGenerateCallingLlm: 'Consultando o LLM…',
  msgCommitGenerateFailedPrefix: 'Falha ao gerar mensagem de commit: ',
  msgCommitApplyProgress: 'Aplicando no SCM…',
  msgCommitApplySuccess: 'Mensagem de commit copiada para o campo do SCM.',
  msgCommitNotGenerated: 'Gere a mensagem de commit primeiro.',
  msgRepoNotFound: 'Repositório Git não encontrado.',
  msgCancelled: 'Cancelado pelo usuário',
  msgDiffEmpty: 'Sem diff. Verifique staged/alterações.',
  msgUnsupportedProvider: 'Fornecedor não suportado: {provider}',
  msgApiKeyMissing: 'Chave de API para {provider} não definida. Salve nas configurações.',
  msgLlmEmptyOpenAi: 'Resposta da OpenAI vazia.',
  msgLlmEmptyGemini: 'Resposta da Gemini vazia.',
  msgLlmEmptyClaude: 'Resposta da Claude vazia.',
  msgHttpsInvalid: '{label} inválido.',
  msgHttpsRequired: '{label} deve começar com https://. Verifique as configurações.',
  msgGitDiffFailed: 'git diff falhou: {detail}',
  msgGitStatusFailed: 'git status --porcelain falhou: {detail}',
  msgUntrackedReadFailed: 'Falha ao ler arquivo não rastreado: {path} ({detail})',
  msgUntrackedSkipBinary: 'Arquivo não rastreado ignorado (possível binário): {path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: tentativa {attempt}/{max}',
  logLlmRetry: '{label}: nova tentativa em {delay}ms ({error})',

  toastSaved: '{action} às {timestamp}',
  toastDeleted: 'Excluído às {timestamp}',

  actionCreatedLabel: 'Criado',
  actionUpdatedLabel: 'Atualizado',
  actionDeletedLabel: 'Excluído',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### Staged',
  diffSectionUnstaged: '### Unstaged',
  diffSectionUntracked: '### Não rastreado {path}',
  diffHeading: '# Diff'
};

export default pt;
