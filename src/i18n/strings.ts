import { LanguageCode } from './languages';
import { StringsMap } from './types';
import ja from './locales/ja';
import en from './locales/en';
import zh from './locales/zh';
import ko from './locales/ko';
import es from './locales/es';
import fr from './locales/fr';
import de from './locales/de';
import vi from './locales/vi';
import th from './locales/th';
import my from './locales/my';
import hi from './locales/hi';
import pt from './locales/pt-BR';
import ru from './locales/ru';
import ar from './locales/ar';
import tr from './locales/tr';
import id from './locales/id';
import it from './locales/it';
import pl from './locales/pl';
import tl from './locales/tl';

export const STRINGS: StringsMap = {
  ja,
  en,
  zh,
  ko,
  es,
  fr,
  de,
  vi,
  th,
  my,
  hi,
  'pt-BR': pt,
  ru,
  ar,
  tr,
  id,
  it,
  pl,
  tl
};

export const DEFAULT_LANGUAGE: LanguageCode = 'ja';

export function getStrings(lang: LanguageCode = DEFAULT_LANGUAGE) {
  return STRINGS[lang] ?? STRINGS[DEFAULT_LANGUAGE];
}
