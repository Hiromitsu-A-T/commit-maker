import { UiStrings } from '../types';

const ja: UiStrings = {
  langCode: 'ja',
  appTitle: 'Commit Maker',

  languageSectionTitle: '表示言語',
  languageName: '日本語',

  apiKeySectionTitle: 'API キー',
  apiKeyProviderLabel: '保存先プロバイダー',
  apiKeyIssueButton: 'APIキー発行',
  apiKeyLabel: 'API キー',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: '保存',
  apiKeyClearButton: 'クリア',

  llmSectionTitle: 'LLM 設定',
  providerLabel: 'プロバイダー',
  modelLabel: 'モデル',
  customModelLabel: 'カスタムモデル名',
  customModelPlaceholder: 'example-model',
  reasoningLabel: 'Reasoning Effort (OpenAIのみ)',
  verbosityLabel: '回答の詳細度 (OpenAIのみ)',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI (GPT-5 系)',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: 'プロンプトとオプション',
  presetNamePlaceholder: 'プリセット名',
  presetAddButton: '新規追加',
  presetDeleteButton: '削除',
  promptTextareaPlaceholder: '例: 日本語で 50 文字以内のタイトルと箇条書き本文にしてください。',
  includeUnstagedLabel: '未ステージの変更も含める',
  includeUntrackedLabel: '未追跡ファイルも含める',
  includeBinaryLabel: 'バイナリ疑いも含める',
  maxPromptLabel: 'プロンプト長の上限',
  maxPromptUnlimited: '無制限（デフォルト）',
  maxPromptLimited: '上限を設定する',
  maxPromptUnitLabel: '文字',
  maxPromptHint:
    'トークン量/コストを抑えたい時に設定します。0 または空で無制限。上限超過分は先頭20%と末尾80%を残して省略します。',

  generationSectionTitle: '生成と結果',
  generateButton: '提案',
  generateButtonTitle: '差分を読み込んでコミットメッセージを生成',
  applyButton: 'SCM反映',
  applyButtonTitle: '生成結果をソース管理のコミット欄へ反映',
  resultPlaceholder: 'まだ生成していません。',
  resultHint: '生成結果を確認して「SCM へ反映」を押すとソース管理パネルのコミット欄にコピーされます。',
  errorPlaceholder: '-',

  statusIdle: '待機中',
  statusLoading: 'LLM 生成中…',
  statusReady: '生成完了',
  statusError: 'エラー',
  badgeUnstagedOn: 'ステージ + 未ステージ',
  badgeUnstagedOff: 'ステージのみ',

  apiKeySaved: '保存済',
  apiKeyNotSaved: '未保存',
  apiKeySavedPreviewPrefix: '保存済み: ',
  providerNeedKey: 'まず API キーを保存してください',
  modelNeedKey: 'API キー保存後にモデルを選択できます。',
  customModelOption: 'カスタム…',

  presetButtonNew: '新規保存',
  presetButtonSaved: '保存済み',
  presetButtonOverwrite: '上書き保存',
  presetTitleNew: '新しいプリセットとして保存します',
  presetTitleNoChange: '変更はありません',
  presetTitleOverwrite: '選択中プリセットをこの内容で上書きします',

  defaultCommitPrompt: [
    '変更内容を 50 文字以内の要約タイトルと、必要に応じて 72 文字幅の箇条書き本文で書いてください。',
    '- タイトルは命令形を避け、変更点を簡潔に述べる（主観・推測・感想は書かない）',
    '- 本文は「- 」で始める箇条書き。必要なときだけ追加し、各行は 72 文字以内に収める',
    '- 破壊的変更や ISSUE/PR 番号があれば本文に追記',
    '- AI の意見や謝罪・自信表明は禁止。事実のみを記述する',
    '- Conventional Commits に基づいて接頭辞 type をタイトル行の先頭に付けてください',
    '- 日本語で出力してください'
  ].join('\n'),
  defaultPresetLabel: 'デフォルト（上書き不可・編集可）',
  providerDescriptionGemini: 'Generative Language API (generateContent) を直接呼び出します。',
  providerDescriptionOpenAi: 'Responses API / Chat Completions API 互換エンドポイントを利用します。',
  providerDescriptionClaude: 'Claude 3 (messages API) を利用します。',

  msgApiKeySaved: 'API キーを保存しました。',
  msgApiKeySavePick: '保存する API キーのプロバイダーを選択してください',
  msgApiKeyInputPrompt: '{provider} の API キーを入力してください',

  msgCommitGenerateTitle: 'コミット文生成 (Commit Maker)',
  msgCommitGenerateFetchingDiff: '差分取得中…',
  msgCommitGenerateCallingLlm: 'LLM へ問い合わせ中…',
  msgCommitGenerateFailedPrefix: 'コミット文生成に失敗: ',
  msgCommitApplyProgress: 'SCM へ反映中…',
  msgCommitApplySuccess: 'コミットメッセージを SCM 入力欄へ反映しました。',
  msgCommitNotGenerated: 'まずコミットメッセージを生成してください。',
  msgRepoNotFound: 'Git リポジトリが見つかりません。',
  msgCancelled: 'ユーザーがキャンセルしました',
  msgDiffEmpty: '差分がありません。ステージまたは変更を確認してください。',
  msgUnsupportedProvider: '未対応のプロバイダー: {provider}',
  msgApiKeyMissing: '{provider} 用 API キーが未設定です。設定で保存してください。',
  msgLlmEmptyOpenAi: 'OpenAI 応答が空でした。',
  msgLlmEmptyGemini: 'Gemini 応答が空でした。',
  msgLlmEmptyClaude: 'Claude 応答が空でした。',
  msgHttpsInvalid: '{label} が不正です。',
  msgHttpsRequired: '{label} は https:// である必要があります。設定を確認してください。',
  msgGitDiffFailed: 'git diff 取得に失敗しました: {detail}',
  msgGitStatusFailed: 'git status --porcelain で失敗: {detail}',
  msgUntrackedReadFailed: '未追跡ファイルの読み込みに失敗: {path} ({detail})',
  msgUntrackedSkipBinary: '未追跡ファイルをスキップ（バイナリの可能性）: {path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: {attempt}/{max} 回目',
  logLlmRetry: '{label}: {delay}ms 後にリトライします ({error})',

  toastSaved: '{action}しました（{timestamp}）',
  toastDeleted: '削除しました（{timestamp}）',

  actionCreatedLabel: '新規作成',
  actionUpdatedLabel: '上書き保存',
  actionDeletedLabel: '削除',
  promptGuard: 'ユーザーが指定した書式・指示を最優先し、そのとおりに出力してください。',
  userInstructionLabel: '以下はユーザーが指定した指示です:',




  diffSectionStaged: '### ステージ済み',
  diffSectionUnstaged: '### 未ステージ',
  diffSectionUntracked: '### 未追跡 {path}',
  diffHeading: '# 差分'
};

export default ja;
