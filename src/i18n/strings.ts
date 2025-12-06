import { LanguageCode } from './languages';
import { StringsMap } from './types';
import ja from './locales/ja';
import en from './locales/en';
import zh from './locales/zh';
import zhTw from './locales/zh-TW';
import ko from './locales/ko';
import es from './locales/es';
import fr from './locales/fr';
import de from './locales/de';
import nl from './locales/nl';
import sv from './locales/sv';
import da from './locales/da';
import nb from './locales/nb';
import vi from './locales/vi';
import th from './locales/th';
import my from './locales/my';
import hi from './locales/hi';
import bn from './locales/bn';
import ta from './locales/ta';
import pt from './locales/pt-BR';
import ru from './locales/ru';
import uk from './locales/uk';
import ar from './locales/ar';
import he from './locales/he';
import fa from './locales/fa';
import tr from './locales/tr';
import id from './locales/id';
import it from './locales/it';
import pl from './locales/pl';
import ro from './locales/ro';
import tl from './locales/tl';
import sw from './locales/sw';

export const STRINGS: StringsMap = {
  ja,
  en,
  zh,
  'zh-TW': zhTw,
  ko,
  es,
  fr,
  de,
  nl,
  sv,
  da,
  nb,
  vi,
  th,
  my,
  hi,
  bn,
  ta,
  'pt-BR': pt,
  ru,
  uk,
  ar,
  he,
  fa,
  tr,
  id,
  it,
  pl,
  ro,
  tl,
  sw
};

export const DEFAULT_LANGUAGE: LanguageCode = 'ja';

export function getStrings(lang: LanguageCode = DEFAULT_LANGUAGE) {
  return STRINGS[lang] ?? STRINGS[DEFAULT_LANGUAGE];
}
