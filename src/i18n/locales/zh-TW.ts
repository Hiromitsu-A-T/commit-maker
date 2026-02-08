import { UiStrings } from '../types';

const zhTw: UiStrings = {
  langCode: 'zh-TW',
  appTitle: 'Commit Maker',

  languageSectionTitle: '顯示語言',
  languageName: '繁體中文',

  apiKeySectionTitle: 'API 金鑰',
  apiKeyProviderLabel: '要儲存的提供者',
  apiKeyIssueButton: '取得 API 金鑰',
  apiKeyLabel: 'API 金鑰',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: '儲存',
  apiKeyClearButton: '清除',

  llmSectionTitle: 'LLM 設定',
  providerLabel: '提供者',
  modelLabel: '模型',
  customModelLabel: '自訂模型名稱',
  customModelPlaceholder: 'example-model',
  reasoningLabel: 'Reasoning Effort（僅 OpenAI）',
  verbosityLabel: '回應詳略（僅 OpenAI）',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI（GPT-5 系列）',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: '提示與選項',
  presetNamePlaceholder: '預設名稱',
  presetAddButton: '新增',
  presetDeleteButton: '刪除',
  promptTextareaPlaceholder: '例：請用繁體中文寫 50 字內的標題與條列本文。',
  includeUnstagedLabel: '包含未暫存的變更',
  includeUntrackedLabel: '包含未追蹤的檔案',
  includeBinaryLabel: '包含可能為二進位檔',
  maxPromptLabel: '提示長度上限',
  maxPromptUnlimited: '不限（預設）',
  maxPromptLimited: '設定上限',
  maxPromptUnitLabel: '字元',
  maxPromptHint:
    '當需要控制 token/成本時設定。0 或空白代表不限。超過時保留前 20% 與後 80%。',

  generationSectionTitle: '生成與結果',
  generateButton: '產生',
  generateButtonTitle: '讀取 diff 並產生提交訊息',
  applyButton: '套用到 SCM',
  applyButtonTitle: '將結果複製到原始碼管理的提交欄位',
  resultPlaceholder: '尚未產生。',
  resultHint: '查看結果後按「套用到 SCM」，即可複製到原始碼管理的提交輸入框。',
  errorPlaceholder: '-',

  statusIdle: '待機',
  statusLoading: 'LLM 生成中…',
  statusReady: '完成',
  statusError: '錯誤',
  badgeUnstagedOn: '已暫存 + 未暫存',
  badgeUnstagedOff: '僅已暫存',

  apiKeySaved: '已儲存',
  apiKeyNotSaved: '未儲存',
  apiKeySavedPreviewPrefix: '已儲存：',
  providerNeedKey: '請先儲存 API 金鑰',
  modelNeedKey: '儲存 API 金鑰後即可選擇模型。',
  customModelOption: '自訂…',

  presetButtonNew: '另存新建',
  presetButtonSaved: '已儲存',
  presetButtonOverwrite: '覆寫儲存',
  presetTitleNew: '儲存為新的預設',
  presetTitleNoChange: '沒有變更',
  presetTitleOverwrite: '以此內容覆寫所選預設',

  defaultCommitPrompt: [
    '請寫一個 50 字以內的標題，必要時在 72 字寬內加入條列本文（- 開頭）。',
    '- 避免使用命令語氣；簡潔說明變更（不寫主觀、推測、感想）',
    '- 本文每行以 "- " 開頭，僅在需要時添加，每行不超過 72 字',
    '- 如有破壞性變更或 ISSUE/PR 編號，請寫在本文',
    '- 禁止 AI 意見、道歉或信心聲明，只寫事實',
    '- 依 Conventional Commits 在標題前加類型前綴',
    '- 請以繁體中文輸出'
  ].join('\n'),
  defaultPresetLabel: '預設（不可刪除，可編輯）',
  providerDescriptionGemini: '直接呼叫 Generative Language API（generateContent）。',
  providerDescriptionOpenAi: '使用 Responses API / Chat Completions 相容端點。',
  providerDescriptionClaude: '使用 Claude 3 messages API。',

  msgApiKeySaved: '已儲存 API 金鑰。',
  msgApiKeySavePick: '請選擇要儲存 API 金鑰的提供者',
  msgApiKeyInputPrompt: '請輸入 {provider} 的 API 金鑰',

  msgCommitGenerateTitle: '提交訊息生成 (Commit Maker)',
  msgCommitGenerateFetchingDiff: '取得 diff…',
  msgCommitGenerateCallingLlm: '正在請求 LLM…',
  msgCommitGenerateFailedPrefix: '提交訊息生成失敗：',
  msgCommitApplyProgress: '套用到 SCM…',
  msgCommitApplySuccess: '已將提交訊息複製到 SCM 輸入欄。',
  msgCommitNotGenerated: '請先產生提交訊息。',
  msgRepoNotFound: '找不到 Git 儲存庫。',
  msgCancelled: '使用者已取消',
  msgDiffEmpty: '沒有 diff。請檢查暫存或變更。',
  msgUnsupportedProvider: '不支援的提供者：{provider}',
  msgApiKeyMissing: '尚未設定 {provider} 的 API 金鑰，請在設定中儲存。',
  msgLlmEmptyOpenAi: 'OpenAI 回應為空。',
  msgLlmEmptyGemini: 'Gemini 回應為空。',
  msgLlmEmptyClaude: 'Claude 回應為空。',
  msgHttpsInvalid: '{label} 無效。',
  msgHttpsRequired: '{label} 必須以 https:// 開頭，請檢查設定。',
  msgGitDiffFailed: '取得 git diff 失敗：{detail}',
  msgGitStatusFailed: 'git status --porcelain 失敗：{detail}',
  msgUntrackedReadFailed: '讀取未追蹤檔案失敗：{path} ({detail})',
  msgUntrackedSkipBinary: '跳過未追蹤檔（疑似二進位）：{path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: 第 {attempt}/{max} 次',
  logLlmRetry: '{label}: {delay}ms 後重試 ({error})',

  toastSaved: '{action}（{timestamp}）',
  toastDeleted: '已刪除（{timestamp}）',

  actionCreatedLabel: '新增',
  actionUpdatedLabel: '已更新',
  actionDeletedLabel: '已刪除',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### 已暫存',
  diffSectionUnstaged: '### 未暫存',
  diffSectionUntracked: '### 未追蹤 {path}',
  diffHeading: '# 差異'
};

export default zhTw;
