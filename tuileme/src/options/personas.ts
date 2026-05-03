import type { SupportedLang } from '@shared/types';
import { DEFAULT_SETTINGS } from '@shared/types';
import { getOptionsStrings } from '@shared/i18n';

export interface PersonaItem {
  name: string;
  prompt: string;
}

export function defaultPersonas(): PersonaItem[] {
  return Object.entries(DEFAULT_SETTINGS.personas).map(([name, prompt]) => ({
    name,
    prompt,
  }));
}

export function personasToArray(personas: Record<string, string> | PersonaItem[]): PersonaItem[] {
  if (Array.isArray(personas)) return personas;
  return Object.entries(personas).map(([name, prompt]) => ({ name, prompt }));
}

export function personasToMap(arr: PersonaItem[]): Record<string, string> {
  const out: Record<string, string> = {};
  arr.forEach((p) => {
    if (p.name && p.prompt) out[p.name] = p.prompt;
  });
  return out;
}

export function renderPersonas(
  container: HTMLElement,
  personas: PersonaItem[],
  lang: SupportedLang | 'auto',
  onUpdate: (index: number, field: 'name' | 'prompt', value: string) => void,
  onAction: (action: 'delete' | 'up' | 'down', index: number) => void
): void {
  const dict = getOptionsStrings(lang);
  container.innerHTML = '';

  personas.forEach((p, idx) => {
    const card = document.createElement('div');
    card.className = 'persona-card';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px dashed var(--nerv-gray); padding-bottom:5px;">
        <div style="color:var(--nerv-cyan); font-weight:bold;">${dict.persona_unit}-${(idx + 1).toString().padStart(2, '0')}</div>
        <div style="color:var(--nerv-gray); font-size:0.7rem; font-family:'Orbitron'">${p.name}</div>
      </div>
      <div class="form-group" style="margin-bottom:10px;">
        <label style="font-size:0.7rem;">${dict.persona_name}</label>
        <input data-idx="${idx}" data-field="name" value="${escapeHtml(p.name)}" style="padding:6px; font-size:0.9rem;" />
      </div>
      <div class="form-group" style="margin-bottom:15px; flex-grow:1;">
        <label style="font-size:0.7rem;">${dict.persona_prompt}</label>
        <textarea data-idx="${idx}" data-field="prompt" style="padding:6px; font-size:0.85rem; min-height:80px; resize:none;">${escapeHtml(p.prompt)}</textarea>
      </div>
      <div style="display:flex; gap:8px; justify-content:space-between; margin-top:auto;">
        <div style="display:flex; gap:4px;">
          <button class="btn" data-action="up" data-idx="${idx}" style="padding:4px 8px; font-size:0.8rem;">▲</button>
          <button class="btn" data-action="down" data-idx="${idx}" style="padding:4px 8px; font-size:0.8rem;">▼</button>
        </div>
        <button class="btn danger" data-action="delete" data-idx="${idx}" style="padding:4px 12px; font-size:0.8rem;">${dict.persona_purge}</button>
      </div>
    `;

    const nameInput = card.querySelector<HTMLInputElement>('input[data-field="name"]');
    const promptTextarea = card.querySelector<HTMLTextAreaElement>('textarea[data-field="prompt"]');

    nameInput?.addEventListener('input', () => {
      onUpdate(idx, 'name', nameInput.value);
    });

    promptTextarea?.addEventListener('input', () => {
      onUpdate(idx, 'prompt', promptTextarea.value);
    });

    card.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action as 'delete' | 'up' | 'down';
        const index = parseInt(btn.dataset.idx || '0', 10);
        onAction(action, index);
      });
    });

    container.appendChild(card);
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
