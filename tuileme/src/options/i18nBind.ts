import type { SupportedLang } from '@shared/types';
import { getOptionsStrings, type OptionsI18nKey } from '@shared/i18n';

export function applyTranslations(lang: SupportedLang | 'auto'): void {
  const dict = getOptionsStrings(lang);

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n') as OptionsI18nKey;
    if (key && dict[key]) {
      el.textContent = dict[key];
    }
  });
}
