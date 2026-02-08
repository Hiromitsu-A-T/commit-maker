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

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && SUPPORTED_LANG_CODES.includes(value as LanguageCode);
}
