import { UiStrings } from '../types';

const th: UiStrings = {
  langCode: 'th',
  appTitle: 'Commit Maker',

  languageSectionTitle: 'ภาษาแสดงผล',
  languageName: 'ไทย',

  apiKeySectionTitle: 'API Key',
  apiKeyProviderLabel: 'ผู้ให้บริการที่บันทึก',
  apiKeyIssueButton: 'ขอ API key',
  apiKeyLabel: 'API Key',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: 'บันทึก',
  apiKeyClearButton: 'ล้าง',

  llmSectionTitle: 'ตั้งค่า LLM',
  providerLabel: 'ผู้ให้บริการ',
  modelLabel: 'โมเดล',
  customModelLabel: 'ชื่อโมเดลกำหนดเอง',
  customModelPlaceholder: 'example-model',
  reasoningLabel: 'Reasoning Effort (เฉพาะ OpenAI)',
  verbosityLabel: 'ระดับรายละเอียด (เฉพาะ OpenAI)',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI (ตระกูล GPT-5)',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: 'พรอมต์และตัวเลือก',
  presetNamePlaceholder: 'ชื่อพรีเซ็ต',
  presetAddButton: 'เพิ่มใหม่',
  presetDeleteButton: 'ลบ',
  promptTextareaPlaceholder: 'เช่น เขียนหัวข้อไม่เกิน 50 ตัวและเนื้อหาแบบรายการเป็นภาษาไทย',
  includeUnstagedLabel: 'รวมการเปลี่ยนแปลงที่ยังไม่ stage',
  includeUntrackedLabel: 'รวมไฟล์ที่ยังไม่ติดตาม',
  includeBinaryLabel: 'รวมไฟล์ที่อาจเป็นไบนารี',
  maxPromptLabel: 'จำกัดความยาวพรอมต์',
  maxPromptUnlimited: 'ไม่จำกัด (ค่าเริ่มต้น)',
  maxPromptLimited: 'กำหนดขีดจำกัด',
  maxPromptUnitLabel: 'ตัวอักษร',
  maxPromptHint:
    'ใช้เมื่อต้องการจำกัดโทเคน/ค่าใช้จ่าย 0 หรือเว้นว่าง = ไม่จำกัด ถ้าเกินจะเก็บ 20% แรกและ 80% ท้าย',

  generationSectionTitle: 'การสร้างและผลลัพธ์',
  generateButton: 'สร้าง',
  generateButtonTitle: 'อ่าน diff แล้วสร้างข้อความคอมมิต',
  applyButton: 'ใช้กับ SCM',
  applyButtonTitle: 'คัดลอกผลลัพธ์ไปยังช่องคอมมิตของ Source Control',
  resultPlaceholder: 'ยังไม่ได้สร้าง',
  resultHint: 'ตรวจผลแล้วกด “ใช้กับ SCM” เพื่อคัดลอกไปช่องคอมมิต',
  errorPlaceholder: '-',

  statusIdle: 'พร้อม',
  statusLoading: 'กำลังสร้างด้วย LLM…',
  statusReady: 'เสร็จสิ้น',
  statusError: 'ผิดพลาด',
  badgeUnstagedOn: 'Staged + Unstaged',
  badgeUnstagedOff: 'เฉพาะ Staged',

  apiKeySaved: 'บันทึกแล้ว',
  apiKeyNotSaved: 'ยังไม่บันทึก',
  apiKeySavedPreviewPrefix: 'บันทึกแล้ว: ',
  providerNeedKey: 'กรุณาบันทึก API key ก่อน',
  modelNeedKey: 'เลือกโมเดลได้หลังบันทึก API key',
  customModelOption: 'กำหนดเอง…',

  presetButtonNew: 'บันทึกใหม่',
  presetButtonSaved: 'บันทึกแล้ว',
  presetButtonOverwrite: 'เขียนทับ',
  presetTitleNew: 'บันทึกเป็นพรีเซ็ตใหม่',
  presetTitleNoChange: 'ไม่มีการเปลี่ยนแปลง',
  presetTitleOverwrite: 'เขียนทับพรีเซ็ตที่เลือก',

  defaultCommitPrompt: [
    'เขียนหัวข้อไม่เกิน 50 ตัว และถ้าจำเป็น ให้เนื้อหาแบบรายการความยาวไม่เกิน 72 ตัว',
    '- หลีกเลี่ยงประโยคคำสั่ง บรรยายการเปลี่ยนแปลงอย่างกระชับ (ไม่ใส่ความคิดเห็นหรือคาดเดา)',
    '- เนื้อหาเริ่มด้วย "- " เพิ่มเมื่อจำเป็น แต่ละบรรทัด ≤72 ตัว',
    '- หากมี breaking changes หรือหมายเลข ISSUE/PR ให้ใส่ในเนื้อหา',
    '- ห้ามความคิดเห็นของ AI คำขอโทษ หรือคำยืนยันความมั่นใจ เขียนแต่ข้อเท็จจริง',
    '- ใส่ชนิด Conventional Commit เป็นคำนำหน้าหัวข้อ',
    '- แสดงผลเป็นภาษาไทย'
  ].join('\n'),
  defaultPresetLabel: 'ค่าเริ่มต้น (ลบไม่ได้ ปรับแก้ได้)',
  providerDescriptionGemini: 'เรียก Generative Language API (generateContent) โดยตรง',
  providerDescriptionOpenAi: 'ใช้ endpoint ที่เข้ากันกับ Responses / Chat Completions',
  providerDescriptionClaude: 'ใช้ Claude 3 messages API',

  msgApiKeySaved: 'บันทึก API key แล้ว',
  msgApiKeySavePick: 'เลือกผู้ให้บริการที่จะบันทึก API key',
  msgApiKeyInputPrompt: 'กรอก API key ของ {provider}',

  msgCommitGenerateTitle: 'สร้างข้อความคอมมิต (Commit Maker)',
  msgCommitGenerateFetchingDiff: 'กำลังดึง diff…',
  msgCommitGenerateCallingLlm: 'กำลังเรียก LLM…',
  msgCommitGenerateFailedPrefix: 'สร้างข้อความคอมมิตล้มเหลว: ',
  msgCommitApplyProgress: 'กำลังใช้กับ SCM…',
  msgCommitApplySuccess: 'คัดลอกข้อความคอมมิตไปยังช่อง SCM แล้ว',
  msgCommitNotGenerated: 'กรุณาสร้างข้อความคอมมิตก่อน',
  msgRepoNotFound: 'ไม่พบที่เก็บ Git',
  msgCancelled: 'ผู้ใช้ยกเลิก',
  msgDiffEmpty: 'ไม่มี diff ตรวจสอบ staged/changes',
  msgUnsupportedProvider: 'ผู้ให้บริการไม่รองรับ: {provider}',
  msgApiKeyMissing: 'ยังไม่ได้ตั้ง API key สำหรับ {provider} กรุณาบันทึกในตั้งค่า',
  msgLlmEmptyOpenAi: 'คำตอบ OpenAI ว่างเปล่า',
  msgLlmEmptyGemini: 'คำตอบ Gemini ว่างเปล่า',
  msgLlmEmptyClaude: 'คำตอบ Claude ว่างเปล่า',
  msgHttpsInvalid: '{label} ไม่ถูกต้อง',
  msgHttpsRequired: '{label} ต้องขึ้นต้นด้วย https:// โปรดตรวจการตั้งค่า',
  msgGitDiffFailed: 'git diff ล้มเหลว: {detail}',
  msgGitStatusFailed: 'git status --porcelain ล้มเหลว: {detail}',
  msgUntrackedReadFailed: 'อ่านไฟล์ที่ไม่ติดตามไม่สำเร็จ: {path} ({detail})',
  msgUntrackedSkipBinary: 'ข้ามไฟล์ที่ไม่ติดตาม (สงสัยไบนารี): {path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: ครั้งที่ {attempt}/{max}',
  logLlmRetry: '{label}: จะลองใหม่ใน {delay}ms ({error})',

  toastSaved: '{action} เมื่อ {timestamp}',
  toastDeleted: 'ลบแล้วเมื่อ {timestamp}',

  actionCreatedLabel: 'สร้าง',
  actionUpdatedLabel: 'อัปเดต',
  actionDeletedLabel: 'ลบ',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### Staged',
  diffSectionUnstaged: '### Unstaged',
  diffSectionUntracked: '### ยังไม่ติดตาม {path}',
  diffHeading: '# Diff'
};

export default th;
