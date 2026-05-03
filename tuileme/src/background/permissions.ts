export function getOriginPattern(baseUrl: string): string {
  try {
    const url = new URL(baseUrl);
    return `${url.origin}/*`;
  } catch {
    return '';
  }
}

export async function hasPermission(origin: string): Promise<boolean> {
  const pattern = origin.endsWith('/*') ? origin : `${origin}/*`;
  return chrome.permissions.contains({ origins: [pattern] });
}

export async function requestPermission(origin: string): Promise<boolean> {
  const pattern = origin.endsWith('/*') ? origin : `${origin}/*`;
  return chrome.permissions.request({ origins: [pattern] });
}

export async function revokePermission(origin: string): Promise<boolean> {
  const pattern = origin.endsWith('/*') ? origin : `${origin}/*`;
  return chrome.permissions.remove({ origins: [pattern] });
}

export async function testConnection(
  baseUrl: string,
  apiKey: string
): Promise<{ ok: boolean; error?: string }> {
  const apiBase = baseUrl.replace(/\/+$/, '');

  try {
    const resp = await fetch(`${apiBase}/models`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (resp.ok) {
      return { ok: true };
    }

    let errorMsg = `HTTP ${resp.status}`;
    try {
      const data = await resp.json();
      if (data.error?.message) {
        errorMsg = data.error.message;
      }
    } catch {}

    return { ok: false, error: errorMsg };
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : '连接失败';
    return { ok: false, error: errorMsg };
  }
}
