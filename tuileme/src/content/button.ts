import type { Settings } from '@shared/types';
import { UI_CONFIG } from '@shared/config';

/**
 * Create the DaShen trigger button with persona menu
 * Uses Shadow DOM for style isolation
 */
export function createButton(
  settings: Settings,
  onGenerate: (personaName: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = UI_CONFIG.BUTTON_CONTAINER_CLASS;
  // Match X action bar item layout.
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.pointerEvents = 'auto';
  
  const shadow = container.attachShadow({ mode: 'closed' });
  
  const style = document.createElement('style');
  style.textContent = `
    :host {
      display: inline-flex;
      align-items: center;
      position: relative;
    }

    .tuileme-btn {
      /* Typography - System Monospace Stack */
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      
      background: rgba(0, 0, 0, 0.7);
      border: 1px solid #f0903a;
      color: #f0903a;
      
      padding: 6px 14px;
      clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
      
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
      text-shadow: 0 0 5px rgba(240, 144, 58, 0.5);
      
      cursor: pointer;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      transition: all 0.2s ease;
    }

    .tuileme-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -150%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(240, 144, 58, 0.4), transparent);
      transform: skewX(-20deg);
      transition: left 0.5s ease;
      pointer-events: none;
    }

    .tuileme-btn:hover {
      background: #f0903a;
      color: #000;
      box-shadow: 0 0 20px #f0903a;
      text-shadow: none;
    }

    .tuileme-btn:hover::before {
      left: 150%;
      transition: left 0.6s ease;
    }

    .tuileme-btn:active {
      transform: scale(0.98);
      box-shadow: 0 0 10px #f0903a;
    }

    .label {
      position: relative;
      z-index: 1;
      padding: 0 4px;
    }
  `;
  
  const btn = document.createElement('button');
  btn.className = 'tuileme-btn';
  btn.type = 'button';
  const label = document.createElement('span');
  label.className = 'label';
  
  const personaNames = Object.keys(settings.personas);
  const currentPersona =
    (settings.lastSelectedPersona && settings.personas[settings.lastSelectedPersona])
      ? settings.lastSelectedPersona
      : settings.currentPersona || personaNames[0] || settings.btnLabel || '智答';
  label.textContent = currentPersona;
  btn.appendChild(label);
  const hasMultiplePersonas = personaNames.length > 1;

  let menuPortal: HTMLDivElement | null = null;
  let cleanup: (() => void) | null = null;
  let hideTimeout: ReturnType<typeof setTimeout> | null = null;
  let selectedPersona = currentPersona;

  function cancelHideTimeout(): void {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  }

  function closeMenu(): void {
    cancelHideTimeout();
    if (menuPortal) {
      menuPortal.remove();
      menuPortal = null;
    }
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  }

  function scheduleCloseMenu(): void {
    cancelHideTimeout();
    hideTimeout = setTimeout(() => {
      closeMenu();
    }, 200);
  }

  function openMenu(): void {
    if (menuPortal) return;
    cancelHideTimeout();

    const rect = container.getBoundingClientRect();
    menuPortal = document.createElement('div');
    menuPortal.style.position = 'fixed';
    menuPortal.style.top = `${Math.round(rect.bottom + 4)}px`;
    menuPortal.style.left = `${Math.round(rect.left)}px`;
    menuPortal.style.zIndex = '2147483647';
    menuPortal.style.minWidth = '140px';
    menuPortal.style.padding = '4px';
    
    menuPortal.style.background = 'rgba(0, 0, 0, 0.95)';
    menuPortal.style.border = '1px solid #f0903a';
    menuPortal.style.boxShadow = '0 0 15px rgba(240, 144, 58, 0.3)';
    menuPortal.style.color = '#f0903a';
    menuPortal.style.fontFamily = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", "Courier New", monospace';
    menuPortal.style.borderRadius = '0px';

    menuPortal.addEventListener('mouseenter', cancelHideTimeout);
    menuPortal.addEventListener('mouseleave', scheduleCloseMenu);

    personaNames.forEach((name) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.textContent = name;
      item.style.width = '100%';
      item.style.textAlign = 'left';
      item.style.padding = '8px 12px';
      item.style.border = 'none';
      item.style.cursor = 'pointer';
      item.style.fontSize = '12px';
      item.style.textTransform = 'uppercase';
      item.style.fontFamily = 'inherit';
      item.style.letterSpacing = '1px';
      item.style.transition = 'all 0.2s';
      item.style.fontWeight = '600';
      
      const isSelected = name === selectedPersona;
      if (isSelected) {
        item.style.background = 'rgba(240, 144, 58, 0.3)';
        item.style.color = '#f0903a';
        item.style.borderLeft = '3px solid #f0903a';
        item.style.paddingLeft = '9px';
      } else {
        item.style.background = 'transparent';
        item.style.color = '#f0903a';
        item.style.borderLeft = '3px solid transparent';
        item.style.paddingLeft = '9px';
      }
      
      item.addEventListener('mouseenter', () => {
        item.style.background = '#f0903a';
        item.style.color = '#000';
      });
      item.addEventListener('mouseleave', () => {
        if (name === selectedPersona) {
          item.style.background = 'rgba(240, 144, 58, 0.3)';
          item.style.color = '#f0903a';
        } else {
          item.style.background = 'transparent';
          item.style.color = '#f0903a';
        }
      });
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectedPersona = name;
        label.textContent = name;
        chrome.storage.sync.set({ lastSelectedPersona: name });
        closeMenu();
      });
      menuPortal!.appendChild(item);
    });

    document.body.appendChild(menuPortal);

    const closeHandler = (e: Event) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (menuPortal?.contains(target)) return;
      if (container.contains(target)) return;
      closeMenu();
    };

    window.addEventListener('resize', closeHandler);
    window.addEventListener('scroll', closeHandler, true);

    cleanup = () => {
      window.removeEventListener('resize', closeHandler);
      window.removeEventListener('scroll', closeHandler, true);
    };
  }

  if (hasMultiplePersonas) {
    container.addEventListener('mouseenter', openMenu);
    container.addEventListener('mouseleave', scheduleCloseMenu);
  }

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
    onGenerate(selectedPersona);
  });
  
  shadow.appendChild(style);
  shadow.appendChild(btn);
  
  return container;
}

/**
 * Destroy button and cleanup
 */
export function destroyButton(button: HTMLElement): void {
  button.remove();
}
