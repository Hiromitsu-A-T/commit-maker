import { UiStrings } from '../types';

const vi: UiStrings = {
  langCode: 'vi',
  appTitle: 'Commit Maker',

  languageSectionTitle: 'Ngôn ngữ hiển thị',
  languageName: 'Tiếng Việt',

  apiKeySectionTitle: 'API Key',
  apiKeyProviderLabel: 'Nhà cung cấp lưu trữ',
  apiKeyIssueButton: 'Lấy API key',
  apiKeyLabel: 'API Key',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: 'Lưu',
  apiKeyClearButton: 'Xóa',

  llmSectionTitle: 'Cài đặt LLM',
  providerLabel: 'Nhà cung cấp',
  modelLabel: 'Model',
  customModelLabel: 'Tên model tùy chỉnh',
  customModelPlaceholder: 'example-model',
  reasoningLabel: 'Reasoning Effort (chỉ OpenAI)',
  verbosityLabel: 'Mức chi tiết (chỉ OpenAI)',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI (dòng GPT-5)',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: 'Prompt và tùy chọn',
  presetNamePlaceholder: 'Tên preset',
  presetAddButton: 'Thêm mới',
  presetDeleteButton: 'Xóa',
  promptTextareaPlaceholder: 'Ví dụ: Viết tiêu đề 50 ký tự và nội dung gạch đầu dòng bằng tiếng Việt.',
  includeUnstagedLabel: 'Bao gồm thay đổi chưa stage',
  includeUntrackedLabel: 'Bao gồm file chưa theo dõi',
  includeBinaryLabel: 'Bao gồm file nghi là nhị phân',
  maxPromptLabel: 'Giới hạn độ dài prompt',
  maxPromptUnlimited: 'Không giới hạn (mặc định)',
  maxPromptLimited: 'Đặt giới hạn',
  maxPromptUnitLabel: 'ký tự',
  maxPromptHint:
    'Dùng khi muốn giảm token/chi phí. 0 hoặc để trống = không giới hạn. Nếu vượt, giữ 20% đầu và 80% cuối.',

  generationSectionTitle: 'Sinh và kết quả',
  generateButton: 'Tạo',
  generateButtonTitle: 'Đọc diff và tạo thông điệp commit',
  applyButton: 'Áp dụng vào SCM',
  applyButtonTitle: 'Sao chép kết quả vào ô commit của Source Control',
  resultPlaceholder: 'Chưa tạo.',
  resultHint: 'Xem kết quả rồi bấm “Áp dụng vào SCM” để sao chép vào ô commit.',
  errorPlaceholder: '-',

  statusIdle: 'Nhàn rỗi',
  statusLoading: 'Đang tạo với LLM…',
  statusReady: 'Hoàn tất',
  statusError: 'Lỗi',
  badgeUnstagedOn: 'Staged + Unstaged',
  badgeUnstagedOff: 'Chỉ Staged',

  apiKeySaved: 'Đã lưu',
  apiKeyNotSaved: 'Chưa lưu',
  apiKeySavedPreviewPrefix: 'Đã lưu: ',
  providerNeedKey: 'Hãy lưu API key trước',
  modelNeedKey: 'Chọn model sau khi lưu API key.',
  customModelOption: 'Tùy chỉnh…',

  presetButtonNew: 'Lưu mới',
  presetButtonSaved: 'Đã lưu',
  presetButtonOverwrite: 'Ghi đè',
  presetTitleNew: 'Lưu thành preset mới',
  presetTitleNoChange: 'Không thay đổi',
  presetTitleOverwrite: 'Ghi đè preset đã chọn',

  defaultCommitPrompt: [
    'Viết tiêu đề tối đa 50 ký tự và nếu cần, thân bài gạch đầu dòng bọc ở 72 ký tự.',
    '- Tránh dùng mệnh lệnh; mô tả ngắn gọn thay đổi (không ý kiến hay phỏng đoán)',
    '- Thân bài bắt đầu bằng "- "; chỉ thêm khi cần, mỗi dòng ≤72 ký tự',
    '- Thêm thay đổi phá vỡ và mã ISSUE/PR vào thân bài nếu có',
    '- Không ý kiến AI, không xin lỗi hay cam kết. Chỉ sự thật',
    '- Thêm tiền tố loại theo Conventional Commits vào đầu tiêu đề',
    '- Viết bằng tiếng Việt'
  ].join('\n'),
  defaultPresetLabel: 'Mặc định (không xóa, có thể sửa)',
  providerDescriptionGemini: 'Gọi trực tiếp Generative Language API (generateContent).',
  providerDescriptionOpenAi: 'Dùng endpoint tương thích Responses / Chat Completions.',
  providerDescriptionClaude: 'Dùng Claude 3 messages API.',

  msgApiKeySaved: 'Đã lưu API key.',
  msgApiKeySavePick: 'Chọn nhà cung cấp để lưu API key',
  msgApiKeyInputPrompt: 'Nhập API key của {provider}',

  msgCommitGenerateTitle: 'Tạo thông điệp commit (Commit Maker)',
  msgCommitGenerateFetchingDiff: 'Đang lấy diff…',
  msgCommitGenerateCallingLlm: 'Đang gọi LLM…',
  msgCommitGenerateFailedPrefix: 'Tạo thông điệp commit thất bại: ',
  msgCommitApplyProgress: 'Đang áp dụng vào SCM…',
  msgCommitApplySuccess: 'Đã sao chép thông điệp commit vào ô SCM.',
  msgCommitNotGenerated: 'Hãy tạo thông điệp commit trước.',
  msgRepoNotFound: 'Không tìm thấy kho Git.',
  msgCancelled: 'Người dùng đã hủy',
  msgDiffEmpty: 'Không có diff. Kiểm tra staged/thay đổi.',
  msgUnsupportedProvider: 'Nhà cung cấp không hỗ trợ: {provider}',
  msgApiKeyMissing: 'Chưa đặt API key cho {provider}. Lưu trong cài đặt.',
  msgLlmEmptyOpenAi: 'Phản hồi OpenAI trống.',
  msgLlmEmptyGemini: 'Phản hồi Gemini trống.',
  msgLlmEmptyClaude: 'Phản hồi Claude trống.',
  msgHttpsInvalid: '{label} không hợp lệ.',
  msgHttpsRequired: '{label} phải bắt đầu bằng https://. Kiểm tra cài đặt.',
  msgGitDiffFailed: 'git diff thất bại: {detail}',
  msgGitStatusFailed: 'git status --porcelain thất bại: {detail}',
  msgUntrackedReadFailed: 'Đọc file chưa theo dõi thất bại: {path} ({detail})',
  msgUntrackedSkipBinary: 'Bỏ qua file chưa theo dõi (nghi nhị phân): {path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: lần thử {attempt}/{max}',
  logLlmRetry: '{label}: thử lại sau {delay}ms ({error})',

  toastSaved: '{action} lúc {timestamp}',
  toastDeleted: 'Đã xóa lúc {timestamp}',

  actionCreatedLabel: 'Tạo mới',
  actionUpdatedLabel: 'Cập nhật',
  actionDeletedLabel: 'Đã xóa',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### Đã stage',
  diffSectionUnstaged: '### Chưa stage',
  diffSectionUntracked: '### Chưa theo dõi {path}',
  diffHeading: '# Diff'
};

export default vi;
