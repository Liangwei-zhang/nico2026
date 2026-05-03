import type { Settings, SupportedLang } from '@shared/types';
import { DEFAULT_SETTINGS } from '@shared/types';
import { loadSettings, saveSettings } from '@shared/storage';
import { getOptionsStrings } from '@shared/i18n';
import { applyTranslations } from './i18nBind';
import {
  type PersonaItem,
  defaultPersonas,
  personasToArray,
  personasToMap,
  renderPersonas,
} from './personas';

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const keyInput = $<HTMLInputElement>('key');
const baseInput = $<HTMLInputElement>('base');
const modelInput = $<HTMLInputElement>('model');
const maxTokensInput = $<HTMLInputElement>('maxTokens');
const labelInput = $<HTMLInputElement>('label');
const langSelect = $<HTMLSelectElement>('langSelect');
const personaListEl = $<HTMLDivElement>('personaList');
const addBtn = $<HTMLButtonElement>('addPersona');
const resetBtn = $<HTMLButtonElement>('resetDefault');
const saveBtn = $<HTMLButtonElement>('save');
const statusEl = $<HTMLDivElement>('footerMsg');

let personaState: PersonaItem[] = [];
let currentLang: SupportedLang | 'auto' = 'auto';

function updateStatus(messageKey: string, type: 'info' | 'success' | 'error' = 'info'): void {
  const dict = getOptionsStrings(currentLang);
  const message = (dict as Record<string, string>)[messageKey] || messageKey;
  statusEl.textContent = message;

  const colors = {
    info: 'var(--nerv-orange)',
    success: 'var(--nerv-green)',
    error: 'var(--nerv-red)',
  };
  statusEl.style.color = colors[type];

  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      statusEl.textContent = dict.msg_awaiting;
      statusEl.style.color = 'var(--nerv-red)';
    }, 2000);
  }
}

function reRenderPersonas(): void {
  renderPersonas(
    personaListEl,
    personaState,
    currentLang,
    (index, field, value) => {
      personaState[index][field] = value;
    },
    (action, index) => {
      if (action === 'delete') {
        personaState.splice(index, 1);
      } else if (action === 'up' && index > 0) {
        [personaState[index - 1], personaState[index]] = [personaState[index], personaState[index - 1]];
      } else if (action === 'down' && index < personaState.length - 1) {
        [personaState[index + 1], personaState[index]] = [personaState[index], personaState[index + 1]];
      }
      reRenderPersonas();
    }
  );
}

async function loadState(): Promise<void> {
  const settings = await loadSettings();

  keyInput.value = settings.apiKey || '';
  baseInput.value = settings.baseUrl || DEFAULT_SETTINGS.baseUrl;
  modelInput.value = settings.model || DEFAULT_SETTINGS.model;
  maxTokensInput.value = String(settings.maxTokens || DEFAULT_SETTINGS.maxTokens);
  labelInput.value = settings.btnLabel || DEFAULT_SETTINGS.btnLabel;
  langSelect.value = settings.lang || 'auto';

  currentLang = settings.lang || 'auto';
  personaState = personasToArray(settings.personas || DEFAULT_SETTINGS.personas);

  applyTranslations(currentLang);
  reRenderPersonas();
}

async function saveState(): Promise<void> {
  updateStatus('msg_saving', 'info');

  const filtered = personaState.filter((p) => p.name.trim() && p.prompt.trim());

  await saveSettings({
    apiKey: keyInput.value.trim(),
    baseUrl: baseInput.value.trim(),
    model: modelInput.value.trim(),
    maxTokens: Number(maxTokensInput.value) || 400,
    btnLabel: labelInput.value.trim().slice(0, 6),
    lang: langSelect.value as Settings['lang'],
    personas: personasToMap(filtered.length ? filtered : defaultPersonas()),
  });

  updateStatus('msg_saved', 'success');
}

langSelect.addEventListener('change', () => {
  currentLang = langSelect.value as SupportedLang | 'auto';
  applyTranslations(currentLang);
  reRenderPersonas();
});

addBtn.addEventListener('click', () => {
  personaState.push({ name: 'NEW UNIT', prompt: '...' });
  reRenderPersonas();
});

resetBtn.addEventListener('click', () => {
  if (confirm('FACTORY RESET?')) {
    personaState = defaultPersonas();
    reRenderPersonas();
    saveState();
  }
});

saveBtn.addEventListener('click', saveState);

loadState();
