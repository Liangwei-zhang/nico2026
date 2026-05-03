import { translations, type Locale, type TranslationKeys } from './translations';

export function getLocaleFromUrl(url: URL): Locale {
  const [, locale] = url.pathname.split('/');
  if (locale === 'en') return 'en';
  if (locale === 'zh-CN') return 'zh-CN';
  return 'zh-CN'; // default
}

export function useTranslations(locale: Locale) {
  return translations[locale];
}

export function getLocalePath(locale: Locale, path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `/${locale}/${cleanPath}`.replace(/\/+$/, '') || `/${locale}`;
}

export function switchLocalePath(currentUrl: URL, targetLocale: Locale): string {
  const pathname = currentUrl.pathname;
  // Remove current locale prefix
  const pathWithoutLocale = pathname.replace(/^\/(zh-CN|en)/, '') || '/';
  return `/${targetLocale}${pathWithoutLocale}`;
}

export const locales: Locale[] = ['zh-CN', 'en'];
export const defaultLocale: Locale = 'zh-CN';
