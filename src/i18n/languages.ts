export const SUPPORTED_LANG_CODES = [
  'ja',
  'en',
  'zh',
  'zh-TW',
  'ko',
  'es',
  'fr',
  'de',
  'nl',
  'sv',
  'da',
  'nb',
  'vi',
  'th',
  'my',
  'hi',
  'bn',
  'ta',
  'pt-BR',
  'ru',
  'uk',
  'ar',
  'he',
  'fa',
  'tr',
  'id',
  'it',
  'pl',
  'ro',
  'tl',
  'sw',
  'ur'
] as const;

export type LanguageCode = (typeof SUPPORTED_LANG_CODES)[number];

export const LANGUAGE_PROMPT_NAMES: Record<LanguageCode, string> = {
  ja: 'Japanese',
  en: 'English',
  zh: 'Simplified Chinese',
  'zh-TW': 'Traditional Chinese',
  ko: 'Korean',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  nl: 'Dutch',
  sv: 'Swedish',
  da: 'Danish',
  nb: 'Norwegian Bokmal',
  vi: 'Vietnamese',
  th: 'Thai',
  my: 'Burmese',
  hi: 'Hindi',
  bn: 'Bengali',
  ta: 'Tamil',
  'pt-BR': 'Brazilian Portuguese',
  ru: 'Russian',
  uk: 'Ukrainian',
  ar: 'Arabic',
  he: 'Hebrew',
  fa: 'Persian',
  tr: 'Turkish',
  id: 'Indonesian',
  it: 'Italian',
  pl: 'Polish',
  ro: 'Romanian',
  tl: 'Filipino',
  sw: 'Swahili',
  ur: 'Urdu'
};

export function getLanguagePromptName(code: LanguageCode): string {
  return LANGUAGE_PROMPT_NAMES[code];
}

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && SUPPORTED_LANG_CODES.includes(value as LanguageCode);
}
