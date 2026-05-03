import type { Settings } from './types';
import { DEFAULT_SETTINGS } from './types';

export async function loadSettings(): Promise<Settings> {
  const [localData, syncData] = await Promise.all([
    chrome.storage.local.get(['apiKey']),
    chrome.storage.sync.get([
      'baseUrl', 'model', 'maxTokens',
      'personas', 'currentPersona', 'lastSelectedPersona',
      'btnLabel', 'lang'
    ]),
  ]);

  return {
    ...DEFAULT_SETTINGS,
    ...syncData,
    apiKey: (localData.apiKey as string) || '',
  };
}

export async function saveSettings(partial: Partial<Settings>): Promise<void> {
  const { apiKey, ...syncPart } = partial;
  const promises: Promise<void>[] = [];

  if (apiKey !== undefined) {
    promises.push(chrome.storage.local.set({ apiKey }));
  }

  if (Object.keys(syncPart).length > 0) {
    promises.push(chrome.storage.sync.set(syncPart));
  }

  await Promise.all(promises);
}

export async function getSetting<K extends keyof Settings>(key: K): Promise<Settings[K]> {
  const settings = await loadSettings();
  return settings[key];
}
