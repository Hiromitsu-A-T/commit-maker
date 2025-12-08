import { UiStrings } from '../types';

const tr: UiStrings = {
  langCode: 'tr',
  appTitle: 'Commit Maker',

  languageSectionTitle: 'Görüntüleme dili',
  languageName: 'Türkçe',

  apiKeySectionTitle: 'API Anahtarı',
  apiKeyProviderLabel: 'Kaydedilecek sağlayıcı',
  apiKeyIssueButton: 'API anahtarı al',
  apiKeyLabel: 'API Anahtarı',
  apiKeyPlaceholder: 'sk-... / AIza... / sk-ant-...',
  apiKeySaveButton: 'Kaydet',
  apiKeyClearButton: 'Temizle',

  llmSectionTitle: 'LLM Ayarları',
  providerLabel: 'Sağlayıcı',
  modelLabel: 'Model',
  customModelLabel: 'Özel model adı',
  customModelPlaceholder: 'example-model',
  reasoningLabel: 'Reasoning Effort (yalnızca OpenAI)',
  verbosityLabel: 'Detay seviyesi (yalnızca OpenAI)',
  providerLabelGemini: 'Google Gemini',
  providerLabelOpenAi: 'OpenAI (GPT-5 ailesi)',
  providerLabelClaude: 'Anthropic Claude',

  promptSectionTitle: 'Prompt ve seçenekler',
  presetNamePlaceholder: 'Preset adı',
  presetAddButton: 'Yeni ekle',
  presetDeleteButton: 'Sil',
  promptTextareaPlaceholder: 'Örn: 50 karakterlik başlık ve madde işaretli metni Türkçe yazın.',
  includeUnstagedLabel: 'Staged olmayan değişiklikleri dahil et',
  includeUntrackedLabel: 'Takipsiz dosyaları dahil et',
  includeBinaryLabel: 'Olası ikili dosyaları dahil et',
  maxPromptLabel: 'Prompt uzunluk sınırı',
  maxPromptUnlimited: 'Sınırsız (varsayılan)',
  maxPromptLimited: 'Sınır ayarla',
  maxPromptUnitLabel: 'karakter',
  maxPromptHint:
    'Token/maliyet sınırlamak için kullanın. 0 veya boş = sınırsız. Aşılırsa ilk %20 ve son %80 korunur.',

  generationSectionTitle: 'Oluşturma ve sonuç',
  generateButton: 'Oluştur',
  generateButtonTitle: 'Diff’i okuyup commit mesajı oluştur',
  applyButton: 'SCM’e uygula',
  applyButtonTitle: 'Sonucu Kaynak Denetimi commit alanına kopyala',
  resultPlaceholder: 'Henüz oluşturulmadı.',
  resultHint: 'Sonucu inceleyip “SCM’e uygula”ya basın; commit alanına kopyalanır.',
  errorPlaceholder: '-',

  statusIdle: 'Boşta',
  statusLoading: 'LLM ile oluşturuluyor…',
  statusReady: 'Tamam',
  statusError: 'Hata',
  badgeUnstagedOn: 'Staged + Unstaged',
  badgeUnstagedOff: 'Sadece Staged',

  apiKeySaved: 'Kaydedildi',
  apiKeyNotSaved: 'Kaydedilmedi',
  apiKeySavedPreviewPrefix: 'Kaydedildi: ',
  providerNeedKey: 'Önce bir API anahtarı kaydedin',
  modelNeedKey: 'API anahtarı kaydedildikten sonra model seçebilirsiniz.',
  customModelOption: 'Özel…',

  presetButtonNew: 'Yeni olarak kaydet',
  presetButtonSaved: 'Kaydedildi',
  presetButtonOverwrite: 'Üzerine yaz',
  presetTitleNew: 'Yeni preset olarak kaydedilecek',
  presetTitleNoChange: 'Değişiklik yok',
  presetTitleOverwrite: 'Seçili preset üzerine yazılacak',

  defaultCommitPrompt: [
    'Değişikliği 50 karakterlik başlıkta yazın; gerekirse 72 karakterlik madde işaretli gövde ekleyin.',
    '- Emir kipinden kaçının; değişikliği öz olarak belirtin (yorum/tahmin yok)',
    '- Gövde "- " ile başlar, sadece gerektiğinde ekleyin, her satır ≤72 karakter',
    '- Kırıcı değişiklikler ve ISSUE/PR numaraları varsa gövdeye ekleyin',
    '- Yapay zeka görüşü, özür veya güven ifadeleri yasak; sadece gerçekler',
    '- Conventional Commits türünü başlık önüne önek olarak ekleyin',
    '- Türkçe çıktı verin'
  ].join('\n'),
  defaultPresetLabel: 'Varsayılan (silinemez, düzenlenebilir)',
  providerDescriptionGemini: 'Generative Language API (generateContent) doğrudan çağrılır.',
  providerDescriptionOpenAi: 'Responses / Chat Completions uyumlu endpoint kullanır.',
  providerDescriptionClaude: 'Claude 3 messages API kullanır.',

  msgApiKeySaved: 'API anahtarı kaydedildi.',
  msgApiKeySavePick: 'API anahtarı kaydedilecek sağlayıcıyı seçin',
  msgApiKeyInputPrompt: '{provider} API anahtarını girin',

  msgCommitGenerateTitle: 'Commit mesajı oluşturma (Commit Maker)',
  msgCommitGenerateFetchingDiff: 'Diff alınıyor…',
  msgCommitGenerateCallingLlm: 'LLM’e istek gönderiliyor…',
  msgCommitGenerateFailedPrefix: 'Commit mesajı oluşturulamadı: ',
  msgCommitApplyProgress: 'SCM’e uygulanıyor…',
  msgCommitApplySuccess: 'Commit mesajı SCM alanına kopyalandı.',
  msgCommitNotGenerated: 'Önce commit mesajı oluşturun.',
  msgRepoNotFound: 'Git deposu bulunamadı.',
  msgCancelled: 'Kullanıcı iptal etti',
  msgDiffEmpty: 'Diff yok. Staged/değişiklikleri kontrol edin.',
  msgUnsupportedProvider: 'Desteklenmeyen sağlayıcı: {provider}',
  msgApiKeyMissing: '{provider} için API anahtarı ayarlı değil. Ayarlarda kaydedin.',
  msgLlmEmptyOpenAi: 'OpenAI yanıtı boş.',
  msgLlmEmptyGemini: 'Gemini yanıtı boş.',
  msgLlmEmptyClaude: 'Claude yanıtı boş.',
  msgHttpsInvalid: '{label} geçersiz.',
  msgHttpsRequired: '{label} https:// ile başlamalı. Ayarları kontrol edin.',
  msgGitDiffFailed: 'git diff başarısız: {detail}',
  msgGitStatusFailed: 'git status --porcelain başarısız: {detail}',
  msgUntrackedReadFailed: 'İzlenmeyen dosya okunamadı: {path} ({detail})',
  msgUntrackedSkipBinary: 'İzlenmeyen dosya atlandı (muhtemel ikili): {path}',
  msgHttpError: '{label} HTTP {status}: {text}',
  logLlmAttempt: '{label}: {attempt}/{max} deneme',
  logLlmRetry: '{label}: {delay}ms sonra yeniden denenecek ({error})',

  toastSaved: '{action} {timestamp} tarihinde',
  toastDeleted: '{timestamp} tarihinde silindi',

  actionCreatedLabel: 'Oluşturuldu',
  actionUpdatedLabel: 'Güncellendi',
  actionDeletedLabel: 'Silindi',
  promptGuard: 'Follow the user\'s requested format and instructions exactly.',
  userInstructionLabel: 'User instructions (verbatim):',



  diffSectionStaged: '### Staged',
  diffSectionUnstaged: '### Unstaged',
  diffSectionUntracked: '### Untracked {path}',
  diffHeading: '# Diff'
};

export default tr;
