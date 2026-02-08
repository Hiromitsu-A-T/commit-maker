import { UiStrings } from '../types';

const ko: UiStrings = {
  langCode: 'ko',
  appTitle: 'Commit Maker',

  languageSectionTitle: '표시 언어',
  languageName: '한국어',

  apiKeySectionTitle: 'API 키',
  apiKeyProviderLabel: '저장할 제공자',
  apiKeyIssueButton: 'API 키 발급',
  apiKeyLabel: 'API 키',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: '저장',
  apiKeyClearButton: '지우기',

  llmSectionTitle: 'LLM 설정',
  providerLabel: '제공자',
  modelLabel: '모델',
  customModelLabel: '커스텀 모델 이름',
  customModelPlaceholder: 'example-model',
  reasoningLabel: 'Reasoning Effort (OpenAI 전용)',
  verbosityLabel: '답변 상세도 (OpenAI 전용)',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI (GPT-5 계열)',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: '프롬프트 및 옵션',
  presetNamePlaceholder: '프리셋 이름',
  presetAddButton: '새로 추가',
  presetDeleteButton: '삭제',
  promptTextareaPlaceholder: '예: 한국어로 50자 이내 제목과 글머리표 본문을 작성하세요.',
  includeUnstagedLabel: '스테이징되지 않은 변경 포함',
  includeUntrackedLabel: '추적되지 않은 파일 포함',
  includeBinaryLabel: '바이너리 의심 파일 포함',
  maxPromptLabel: '프롬프트 길이 제한',
  maxPromptUnlimited: '무제한(기본)',
  maxPromptLimited: '제한 설정',
  maxPromptUnitLabel: '자',
  maxPromptHint:
    '토큰/비용을 줄이고 싶을 때 설정합니다. 0 또는 공백이면 무제한. 초과 시 앞 20%와 뒤 80%를 남깁니다.',

  generationSectionTitle: '생성 및 결과',
  generateButton: '생성',
  generateButtonTitle: 'diff를 읽어 커밋 메시지 생성',
  applyButton: 'SCM 적용',
  applyButtonTitle: '결과를 소스 관리 커밋 입력에 복사',
  resultPlaceholder: '아직 생성되지 않았습니다.',
  resultHint: '결과를 확인한 뒤 “SCM 적용”을 누르면 소스 관리 커밋 입력란에 복사됩니다.',
  errorPlaceholder: '-',

  statusIdle: '대기',
  statusLoading: 'LLM 생성 중…',
  statusReady: '완료',
  statusError: '오류',
  badgeUnstagedOn: '스테이지 + 미스테이지',
  badgeUnstagedOff: '스테이지만',

  apiKeySaved: '저장됨',
  apiKeyNotSaved: '미저장',
  apiKeySavedPreviewPrefix: '저장됨: ',
  providerNeedKey: '먼저 API 키를 저장하세요',
  modelNeedKey: 'API 키 저장 후 모델을 선택할 수 있습니다.',
  customModelOption: '커스텀…',

  presetButtonNew: '새로 저장',
  presetButtonSaved: '저장됨',
  presetButtonOverwrite: '덮어쓰기',
  presetTitleNew: '새 프리셋으로 저장',
  presetTitleNoChange: '변경 없음',
  presetTitleOverwrite: '선택한 프리셋을 이 내용으로 덮어쓰기',

  defaultCommitPrompt: [
    '변경사항을 50자 이내 제목과, 필요 시 72자 폭의 글머리표 본문으로 작성하세요.',
    '- 제목은 명령형을 피하고 변경점을 간결히 설명 (주관/추측/감상 금지)',
    '- 본문은 "- "로 시작하는 글머리표, 필요한 경우에만 추가하며 각 행 72자 이내',
    '- 파괴적 변경이나 ISSUE/PR 번호가 있으면 본문에 추가',
    '- AI 의견, 사과, 확신 표현 금지. 사실만 작성',
    '- Conventional Commits 타입을 제목 앞에 접두어로 붙이세요',
    '- 한국어로 출력하세요'
  ].join('\n'),
  defaultPresetLabel: '기본(삭제 불가, 편집 가능)',
  providerDescriptionGemini: 'Generative Language API (generateContent)를 직접 호출합니다.',
  providerDescriptionOpenAi: 'Responses API / Chat Completions 호환 엔드포인트를 사용합니다.',
  providerDescriptionClaude: 'Claude 3 messages API를 사용합니다.',

  msgApiKeySaved: 'API 키를 저장했습니다.',
  msgApiKeySavePick: 'API 키를 저장할 제공자를 선택하세요',
  msgApiKeyInputPrompt: '{provider} API 키를 입력하세요',

  msgCommitGenerateTitle: '커밋 메시지 생성 (Commit Maker)',
  msgCommitGenerateFetchingDiff: 'diff 가져오는 중…',
  msgCommitGenerateCallingLlm: 'LLM에 요청 중…',
  msgCommitGenerateFailedPrefix: '커밋 메시지 생성 실패: ',
  msgCommitApplyProgress: 'SCM에 적용 중…',
  msgCommitApplySuccess: '커밋 메시지를 SCM 입력란에 반영했습니다.',
  msgCommitNotGenerated: '먼저 커밋 메시지를 생성하세요.',
  msgRepoNotFound: 'Git 저장소를 찾을 수 없습니다.',
  msgCancelled: '사용자가 취소했습니다',
  msgDiffEmpty: 'diff가 없습니다. 스테이징/변경을 확인하세요.',
  msgUnsupportedProvider: '지원하지 않는 제공자: {provider}',
  msgApiKeyMissing: '{provider} API 키가 설정되지 않았습니다. 설정에서 저장하세요.',
  msgLlmEmptyOpenAi: 'OpenAI 응답이 비어 있습니다.',
  msgLlmEmptyGemini: 'Gemini 응답이 비어 있습니다.',
  msgLlmEmptyClaude: 'Claude 응답이 비어 있습니다.',
  msgHttpsInvalid: '{label} 이(가) 잘못되었습니다.',
  msgHttpsRequired: '{label} 은(는) https:// 로 시작해야 합니다. 설정을 확인하세요.',
  msgGitDiffFailed: 'git diff 실패: {detail}',
  msgGitStatusFailed: 'git status --porcelain 실패: {detail}',
  msgUntrackedReadFailed: '미추적 파일 읽기 실패: {path} ({detail})',
  msgUntrackedSkipBinary: '미추적 파일 건너뜀(바이너리 의심): {path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: {attempt}/{max} 번째 시도',
  logLlmRetry: '{label}: {delay}ms 후 재시도 ({error})',

  toastSaved: '{action} ({timestamp})',
  toastDeleted: '삭제했습니다 ({timestamp})',

  actionCreatedLabel: '생성',
  actionUpdatedLabel: '업데이트',
  actionDeletedLabel: '삭제',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### 스테이지됨',
  diffSectionUnstaged: '### 미스테이지',
  diffSectionUntracked: '### 미추적 {path}',
  diffHeading: '# diff'
};

export default ko;
