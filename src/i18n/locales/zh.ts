import { UiStrings } from '../types';

const zh: UiStrings = {
  langCode: 'zh',
  appTitle: 'Commit Maker',

  languageSectionTitle: '显示语言',
  languageName: '中文',

  apiKeySectionTitle: 'API 密钥',
  apiKeyProviderLabel: '保存到的提供方',
  apiKeyIssueButton: '获取 API 密钥',
  apiKeyLabel: 'API 密钥',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: '保存',
  apiKeyClearButton: '清除',

  llmSectionTitle: 'LLM 设置',
  providerLabel: '提供方',
  modelLabel: '模型',
  customModelLabel: '自定义模型名称',
  customModelPlaceholder: 'example-model',
  reasoningLabel: 'Reasoning Effort（仅 OpenAI）',
  verbosityLabel: '回答详略（仅 OpenAI）',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI（GPT-5 系列）',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: '提示词与选项',
  presetNamePlaceholder: '预设名称',
  presetAddButton: '新增',
  presetDeleteButton: '删除',
  promptTextareaPlaceholder: '例如：请用中文写 50 字以内的标题和项目符号正文。',
  includeUnstagedLabel: '包含未暂存更改',
  includeUntrackedLabel: '包含未跟踪文件',
  includeBinaryLabel: '包含可能为二进制的文件',
  maxPromptLabel: '提示词长度上限',
  maxPromptUnlimited: '无限制（默认）',
  maxPromptLimited: '设置上限',
  maxPromptUnitLabel: '字符',
  maxPromptHint:
    '需要控制 token/成本时设置。0 或空为无限制。超出时保留前 20% 和后 80%。',

  generationSectionTitle: '生成与结果',
  generateButton: '生成',
  generateButtonTitle: '读取 diff 并生成提交说明',
  applyButton: '应用到 SCM',
  applyButtonTitle: '将结果复制到源代码管理提交栏',
  resultPlaceholder: '尚未生成。',
  resultHint: '查看结果后点“应用到 SCM”即可复制到源代码管理的提交输入框。',
  errorPlaceholder: '-',

  statusIdle: '空闲',
  statusLoading: 'LLM 生成中…',
  statusReady: '完成',
  statusError: '错误',
  badgeUnstagedOn: '已暂存 + 未暂存',
  badgeUnstagedOff: '仅已暂存',

  apiKeySaved: '已保存',
  apiKeyNotSaved: '未保存',
  apiKeySavedPreviewPrefix: '已保存：',
  providerNeedKey: '请先保存 API 密钥',
  modelNeedKey: '保存 API 密钥后可选择模型。',
  customModelOption: '自定义…',

  presetButtonNew: '另存为新建',
  presetButtonSaved: '已保存',
  presetButtonOverwrite: '覆盖保存',
  presetTitleNew: '保存为新的预设',
  presetTitleNoChange: '没有更改',
  presetTitleOverwrite: '用此内容覆盖所选预设',

  defaultCommitPrompt: [
    '请写一个 50 字以内的标题，如需正文请用 72 字宽的项目符号（- 开头）。',
    '- 避免使用命令式；简洁说明修改点（不写主观/推测/感想）',
    '- 正文行以 "- " 开头，仅必要时添加，每行不超过 72 字',
    '- 如有破坏性变更或 ISSUE/PR 号，请写在正文',
    '- 禁止 AI 的意见、道歉、信心声明，仅写事实',
    '- 按 Conventional Commits 在标题前加类型前缀',
    '- 用中文输出'
  ].join('\n'),
  defaultPresetLabel: '默认（不可删除，可编辑）',
  providerDescriptionGemini: '直接调用 Generative Language API (generateContent)。',
  providerDescriptionOpenAi: '使用 Responses API / Chat Completions 兼容端点。',
  providerDescriptionClaude: '使用 Claude 3 messages API。',

  msgApiKeySaved: 'API 密钥已保存。',
  msgApiKeySavePick: '请选择要保存 API 密钥的提供方',
  msgApiKeyInputPrompt: '请输入 {provider} 的 API 密钥',

  msgCommitGenerateTitle: '提交信息生成 (Commit Maker)',
  msgCommitGenerateFetchingDiff: '获取 diff…',
  msgCommitGenerateCallingLlm: '请求 LLM…',
  msgCommitGenerateFailedPrefix: '生成提交信息失败：',
  msgCommitApplyProgress: '应用到 SCM…',
  msgCommitApplySuccess: '已将提交信息复制到 SCM 输入框。',
  msgCommitNotGenerated: '请先生成提交信息。',
  msgRepoNotFound: '未找到 Git 仓库。',
  msgCancelled: '用户已取消',
  msgDiffEmpty: '没有 diff，请检查暂存或修改。',
  msgUnsupportedProvider: '不支持的提供方：{provider}',
  msgApiKeyMissing: '{provider} 的 API 密钥未设置，请在设置中保存。',
  msgLlmEmptyOpenAi: 'OpenAI 响应为空。',
  msgLlmEmptyGemini: 'Gemini 响应为空。',
  msgLlmEmptyClaude: 'Claude 响应为空。',
  msgHttpsInvalid: '{label} 无效。',
  msgHttpsRequired: '{label} 必须以 https:// 开头，请检查设置。',
  msgGitDiffFailed: '获取 git diff 失败：{detail}',
  msgGitStatusFailed: 'git status --porcelain 失败：{detail}',
  msgUntrackedReadFailed: '读取未跟踪文件失败：{path} ({detail})',
  msgUntrackedSkipBinary: '跳过未跟踪文件（疑似二进制）：{path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: 第 {attempt}/{max} 次',
  logLlmRetry: '{label}: {delay}ms 后重试 ({error})',

  toastSaved: '{action}（{timestamp}）',
  toastDeleted: '已删除（{timestamp}）',

  actionCreatedLabel: '新建',
  actionUpdatedLabel: '已更新',
  actionDeletedLabel: '已删除',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### 已暂存',
  diffSectionUnstaged: '### 未暂存',
  diffSectionUntracked: '### 未跟踪 {path}',
  diffHeading: '# 差异'
};

export default zh;
