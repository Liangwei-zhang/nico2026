import { defineMiddleware } from 'astro:middleware';

const SUPPORTED_LOCALES = ['zh-CN', 'en'];
const DEFAULT_LOCALE = 'zh-CN';
const LOCALE_COOKIE = 'preferred-locale';

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, cookies, redirect } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Skip for assets and API routes
  if (
    pathname.startsWith('/_') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return next();
  }

  // Check if already on a locale-prefixed path
  const pathLocale = SUPPORTED_LOCALES.find(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );

  if (pathLocale) {
    // Set cookie to remember preference
    const response = await next();
    response.headers.set(
      'Set-Cookie',
      `${LOCALE_COOKIE}=${pathLocale}; Path=/; Max-Age=31536000; SameSite=Lax`
    );
    return response;
  }

  // Root path: detect preferred locale
  if (pathname === '/' || pathname === '') {
    // Priority 1: Check cookie
    const cookieLocale = cookies.get(LOCALE_COOKIE)?.value;
    if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
      return redirect(`/${cookieLocale}/`, 302);
    }

    // Priority 2: Check Accept-Language header
    const acceptLanguage = request.headers.get('Accept-Language') ?? '';
    const browserLocale = parseAcceptLanguage(acceptLanguage);
    const targetLocale = browserLocale ?? DEFAULT_LOCALE;

    return redirect(`/${targetLocale}/`, 302);
  }

  // For non-prefixed paths, redirect to default locale
  return redirect(`/${DEFAULT_LOCALE}${pathname}`, 302);
});

function parseAcceptLanguage(header: string): string | null {
  if (!header) return null;

  const langs = header
    .split(',')
    .map((l) => {
      const [lang, q] = l.trim().split(';q=');
      return { lang: lang.trim().toLowerCase(), q: q ? parseFloat(q) : 1.0 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of langs) {
    if (lang.startsWith('zh')) return 'zh-CN';
    if (lang.startsWith('en')) return 'en';
  }

  return null;
}
