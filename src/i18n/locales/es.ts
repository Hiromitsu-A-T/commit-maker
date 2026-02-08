import { UiStrings } from '../types';

const es: UiStrings = {
  langCode: 'es',
  appTitle: 'Commit Maker',

  languageSectionTitle: 'Idioma de visualización',
  languageName: 'Español',

  apiKeySectionTitle: 'Clave API',
  apiKeyProviderLabel: 'Proveedor donde guardar',
  apiKeyIssueButton: 'Obtener clave API',
  apiKeyLabel: 'Clave API',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: 'Guardar',
  apiKeyClearButton: 'Borrar',

  llmSectionTitle: 'Configuración LLM',
  providerLabel: 'Proveedor',
  modelLabel: 'Modelo',
  customModelLabel: 'Nombre de modelo personalizado',
  customModelPlaceholder: 'example-model',
  reasoningLabel: 'Reasoning Effort (solo OpenAI)',
  verbosityLabel: 'Nivel de detalle (solo OpenAI)',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI (familia GPT-5)',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: 'Prompt y opciones',
  presetNamePlaceholder: 'Nombre del preset',
  presetAddButton: 'Añadir nuevo',
  presetDeleteButton: 'Eliminar',
  promptTextareaPlaceholder: 'Ej.: Escribe un título de 50 caracteres y cuerpo con viñetas en español.',
  includeUnstagedLabel: 'Incluir cambios sin stage',
  includeUntrackedLabel: 'Incluir archivos sin seguimiento',
  includeBinaryLabel: 'Incluir posibles binarios',
  maxPromptLabel: 'Límite de longitud del prompt',
  maxPromptUnlimited: 'Ilimitado (por defecto)',
  maxPromptLimited: 'Definir límite',
  maxPromptUnitLabel: 'caracteres',
  maxPromptHint:
    'Úsalo para limitar tokens/coste. 0 o vacío = ilimitado. Si excede, se conserva el 20% inicial y el 80% final.',

  generationSectionTitle: 'Generar y resultado',
  generateButton: 'Generar',
  generateButtonTitle: 'Leer diff y generar mensaje de commit',
  applyButton: 'Aplicar al SCM',
  applyButtonTitle: 'Copiar resultado al cuadro de commit del Control de código fuente',
  resultPlaceholder: 'Aún no generado.',
  resultHint: 'Revisa el resultado y pulsa “Aplicar al SCM” para copiarlo al cuadro de commit.',
  errorPlaceholder: '-',

  statusIdle: 'En espera',
  statusLoading: 'Generando con LLM…',
  statusReady: 'Listo',
  statusError: 'Error',
  badgeUnstagedOn: 'Stage + sin stage',
  badgeUnstagedOff: 'Solo stage',

  apiKeySaved: 'Guardada',
  apiKeyNotSaved: 'No guardada',
  apiKeySavedPreviewPrefix: 'Guardada: ',
  providerNeedKey: 'Guarda primero una clave API',
  modelNeedKey: 'Podrás elegir modelo tras guardar la clave API.',
  customModelOption: 'Personalizado…',

  presetButtonNew: 'Guardar como nuevo',
  presetButtonSaved: 'Guardado',
  presetButtonOverwrite: 'Sobrescribir',
  presetTitleNew: 'Guardar como nuevo preset',
  presetTitleNoChange: 'Sin cambios',
  presetTitleOverwrite: 'Sobrescribir el preset seleccionado',

  defaultCommitPrompt: [
    'Escribe un título de hasta 50 caracteres y, si hace falta, cuerpo con viñetas de 72 caracteres.',
    '- Evita el imperativo; describe el cambio de forma concisa (sin opiniones ni suposiciones)',
    '- Cuerpo con viñetas comenzando con "- "; solo cuando sea necesario, cada línea ≤72 caracteres',
    '- Añade cambios rompientes e IDs de ISSUE/PR en el cuerpo si aplica',
    '- Prohibido opiniones de IA, disculpas o declaraciones de confianza. Solo hechos',
    '- Añade el tipo de Conventional Commits como prefijo del título',
    '- Escribe en español'
  ].join('\n'),
  defaultPresetLabel: 'Predeterminado (no se borra, editable)',
  providerDescriptionGemini: 'Llama directamente a Generative Language API (generateContent).',
  providerDescriptionOpenAi: 'Usa un endpoint compatible con Responses API / Chat Completions.',
  providerDescriptionClaude: 'Usa Claude 3 messages API.',

  msgApiKeySaved: 'Clave API guardada.',
  msgApiKeySavePick: 'Elige proveedor para guardar la clave API',
  msgApiKeyInputPrompt: 'Introduce la clave API de {provider}',

  msgCommitGenerateTitle: 'Generación de mensaje de commit (Commit Maker)',
  msgCommitGenerateFetchingDiff: 'Obteniendo diff…',
  msgCommitGenerateCallingLlm: 'Consultando al LLM…',
  msgCommitGenerateFailedPrefix: 'Error al generar el mensaje de commit: ',
  msgCommitApplyProgress: 'Aplicando al SCM…',
  msgCommitApplySuccess: 'Mensaje de commit copiado al cuadro de SCM.',
  msgCommitNotGenerated: 'Primero genera un mensaje de commit.',
  msgRepoNotFound: 'Repositorio Git no encontrado.',
  msgCancelled: 'Cancelado por el usuario',
  msgDiffEmpty: 'Sin diff. Revisa staged/cambios.',
  msgUnsupportedProvider: 'Proveedor no soportado: {provider}',
  msgApiKeyMissing: 'Falta la clave API de {provider}. Guárdala en ajustes.',
  msgLlmEmptyOpenAi: 'Respuesta de OpenAI vacía.',
  msgLlmEmptyGemini: 'Respuesta de Gemini vacía.',
  msgLlmEmptyClaude: 'Respuesta de Claude vacía.',
  msgHttpsInvalid: '{label} no es válido.',
  msgHttpsRequired: '{label} debe empezar con https://. Revisa la configuración.',
  msgGitDiffFailed: 'Fallo al ejecutar git diff: {detail}',
  msgGitStatusFailed: 'git status --porcelain falló: {detail}',
  msgUntrackedReadFailed: 'No se pudo leer archivo sin seguimiento: {path} ({detail})',
  msgUntrackedSkipBinary: 'Archivo sin seguimiento omitido (posible binario): {path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: intento {attempt}/{max}',
  logLlmRetry: '{label}: reintentando en {delay} ms ({error})',

  toastSaved: '{action} a las {timestamp}',
  toastDeleted: 'Eliminado a las {timestamp}',

  actionCreatedLabel: 'Creado',
  actionUpdatedLabel: 'Actualizado',
  actionDeletedLabel: 'Eliminado',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### Staged',
  diffSectionUnstaged: '### Sin stage',
  diffSectionUntracked: '### Sin seguimiento {path}',
  diffHeading: '# Diff'
};

export default es;
