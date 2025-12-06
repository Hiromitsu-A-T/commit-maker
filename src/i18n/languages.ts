export const SUPPORTED_LANG_CODES = [
  'ja',
  'en',
  'zh',
  'ko',
  'es',
  'fr',
  'de',
  'vi',
  'th',
  'my',
  'hi',
  'pt-BR',
  'ru',
  'ar',
  'tr',
  'id',
  'it',
  'pl',
  'tl'
] as const;

export type LanguageCode = (typeof SUPPORTED_LANG_CODES)[number];

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && SUPPORTED_LANG_CODES.includes(value as LanguageCode);
}
