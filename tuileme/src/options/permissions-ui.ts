import { getOriginPattern, requestPermission, testConnection, hasPermission } from '@background/permissions';
import type { PermissionState } from '@shared/types';

export interface PermissionUIState {
  state: PermissionState;
  error?: string;
}

export async function authorizeAndTest(
  baseUrl: string,
  apiKey: string,
  onStateChange: (state: PermissionUIState) => void
): Promise<boolean> {
  if (!baseUrl || !apiKey) {
    onStateChange({ state: 'failed', error: 'Missing baseUrl or apiKey' });
    return false;
  }

  const originPattern = getOriginPattern(baseUrl);
  if (!originPattern) {
    onStateChange({ state: 'failed', error: 'Invalid URL' });
    return false;
  }

  onStateChange({ state: 'requesting' });

  const alreadyGranted = await hasPermission(originPattern);
  if (!alreadyGranted) {
    const granted = await requestPermission(originPattern);
    if (!granted) {
      onStateChange({ state: 'failed', error: 'Permission denied' });
      return false;
    }
  }

  onStateChange({ state: 'testing' });

  const testResult = await testConnection(baseUrl, apiKey);
  if (!testResult.ok) {
    onStateChange({ state: 'failed', error: testResult.error });
    return false;
  }

  onStateChange({ state: 'success' });
  return true;
}

export function getStateText(state: PermissionState, lang: 'zh' | 'en'): string {
  const texts = {
    zh: {
      idle: '待授权',
      requesting: '请求权限中...',
      testing: '测试连接中...',
      success: '✓ 连接成功',
      failed: '✗ 连接失败',
    },
    en: {
      idle: 'Not authorized',
      requesting: 'Requesting permission...',
      testing: 'Testing connection...',
      success: '✓ Connected',
      failed: '✗ Failed',
    },
  };
  return texts[lang]?.[state] || texts.en[state] || state;
}
