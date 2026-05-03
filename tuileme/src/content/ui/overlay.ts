import { UI_CONFIG } from '@shared/config';
import type { SupportedLang } from '@shared/types';
import { getStrings } from '@shared/i18n';

class Overlay {
  private container: HTMLDivElement | null = null;
  private shadow: ShadowRoot | null = null;
  private tweetEl: HTMLDivElement | null = null;
  private thinkingEl: HTMLDivElement | null = null;
  private thinkingTextEl: HTMLDivElement | null = null;
  private streamEl: HTMLDivElement | null = null;
  private lang: SupportedLang | 'auto' = 'auto';

  show(tweetText?: string): void {
    if (this.container) {
      this.container.style.display = 'block';
      const backdrop = this.shadow?.getElementById('backdrop');
      backdrop?.classList.add('visible');
      if (tweetText && this.tweetEl) this.tweetEl.textContent = tweetText;
      if (this.thinkingEl) this.thinkingEl.classList.remove('visible');
      if (this.thinkingTextEl) this.thinkingTextEl.textContent = '';
      if (this.streamEl) this.streamEl.textContent = getStrings(this.lang).generating;
      return;
    }

    this.container = document.createElement('div');
    this.container.id = UI_CONFIG.OVERLAY_ID;
    this.container.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 2147483647;
    `;

    this.shadow = this.container.attachShadow({ mode: 'closed' });

    const strings = getStrings(this.lang);

    this.shadow.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="overlay-backdrop visible" id="backdrop">
        <div class="header">
          <span class="title">/// ${strings.title}</span>
          <span class="magi-tag">MAGI-01</span>
          <button class="close-btn" id="close-btn">×</button>
        </div>
        <div class="tweet-content" id="tweet-content">${tweetText || ''}</div>
        <div class="thinking-content" id="thinking-content">
          <div class="thinking-label">NEURAL_PROCESS_SYNC...<span class="thinking-dot"></span></div>
          <div id="thinking-text"></div>
        </div>
        <div class="stream-content" id="stream-content">${strings.generating}</div>
      </div>
    `;

    this.tweetEl = this.shadow.getElementById('tweet-content') as HTMLDivElement;
    this.thinkingEl = this.shadow.getElementById('thinking-content') as HTMLDivElement;
    this.thinkingTextEl = this.shadow.getElementById('thinking-text') as HTMLDivElement;
    this.streamEl = this.shadow.getElementById('stream-content') as HTMLDivElement;

    this.shadow.getElementById('close-btn')?.addEventListener('click', () => this.hide());

    document.documentElement.appendChild(this.container);
  }

  hide(): void {
    if (!this.shadow) return;
    const backdrop = this.shadow.getElementById('backdrop');
    backdrop?.classList.remove('visible');
  }

  updateThinking(text: string): void {
    if (!this.thinkingEl || !this.thinkingTextEl) return;
    this.thinkingEl.classList.add('visible');
    this.thinkingTextEl.textContent = text;
    this.thinkingEl.scrollTop = this.thinkingEl.scrollHeight;
  }

  updateStream(text: string): void {
    if (!this.streamEl) return;
    this.streamEl.textContent = text;
    this.streamEl.scrollTop = this.streamEl.scrollHeight;
  }

  showComplete(mode: 'auto' | 'clipboard' | 'failed'): void {
    const strings = getStrings(this.lang);
    if (!this.streamEl) return;

    if (mode === 'failed') {
      this.streamEl.innerHTML = `<span class="error-text">❌ ${strings.error}</span>`;
    } else {
      const currentText = this.streamEl.textContent || '';
      this.streamEl.textContent = currentText + `\n\n${strings.done}`;
    }

    if (mode === 'clipboard') {
      const hint = document.createElement('div');
      hint.className = 'copy-hint';
      hint.textContent = strings.copyHint;
      this.streamEl.appendChild(hint);
    }

    if (mode !== 'clipboard') {
      setTimeout(() => this.hide(), UI_CONFIG.AUTO_CLOSE_DELAY);
    }
  }

  showError(error: string): void {
    const strings = getStrings(this.lang);
    if (!this.streamEl) return;
    this.streamEl.innerHTML = `<span class="error-text">❌ ${strings.error}</span>\n\n${error || '未知错误'}`;
  }

  destroy(): void {
    this.container?.remove();
    this.container = null;
    this.shadow = null;
    this.tweetEl = null;
    this.thinkingEl = null;
    this.thinkingTextEl = null;
    this.streamEl = null;
  }

  private getStyles(): string {
    return `
      :host {
        --nerv-orange: #f0903a;
        --nerv-red: #e81900;
        --nerv-green: #58f2a5;
        --nerv-cyan: #54a2d4;
        --nerv-dark: #000020;
        --nerv-hex: rgba(240, 144, 58, 0.1);
        --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
        --sans: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      }

      * { box-sizing: border-box; margin: 0; padding: 0; }

      .overlay-backdrop {
        position: fixed;
        right: 20px;
        bottom: 20px;
        width: 450px;
        max-width: calc(100vw - 40px);
        background-color: #000;
        background-image: 
          linear-gradient(rgba(0, 18, 49, 0.9), rgba(0, 18, 49, 0.95)),
          repeating-linear-gradient(0deg, transparent, transparent 1px, #000 1px, #000 2px);
        border: 1px solid var(--nerv-orange);
        box-shadow: 0 0 30px rgba(240, 144, 58, 0.2), inset 0 0 50px rgba(0,0,0,0.8);
        display: none;
        flex-direction: column;
        pointer-events: auto;
        clip-path: polygon(
          0 0, 100% 0, 
          100% calc(100% - 20px), calc(100% - 20px) 100%, 
          20px 100%, 0 calc(100% - 20px)
        );
        font-family: var(--mono);
      }

      .overlay-backdrop.visible {
        display: flex;
        animation: windowOpen 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
      }

      @keyframes windowOpen {
        from { opacity: 0; transform: translateY(20px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      .overlay-backdrop::before {
        content: "";
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: 
          linear-gradient(90deg, rgba(240, 144, 58, 0.03) 1px, transparent 1px),
          linear-gradient(rgba(240, 144, 58, 0.03) 1px, transparent 1px);
        background-size: 20px 20px;
        pointer-events: none;
        z-index: 0;
      }

      .header {
        padding: 12px 18px;
        background: rgba(0, 0, 0, 0.6);
        border-bottom: 2px solid var(--nerv-red);
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
        z-index: 2;
      }

      .title {
        color: var(--nerv-red);
        font-family: var(--sans);
        font-weight: 800;
        font-size: 16px;
        text-transform: uppercase;
        letter-spacing: 3px;
        text-shadow: 0 0 10px var(--nerv-red);
      }

      .magi-tag {
        font-size: 10px;
        color: var(--nerv-red);
        opacity: 0.7;
        letter-spacing: 2px;
        animation: blink 2s infinite;
      }

      .close-btn {
        background: transparent;
        border: 1px solid var(--nerv-orange);
        color: var(--nerv-orange);
        font-size: 16px;
        line-height: 1;
        cursor: pointer;
        width: 24px; height: 24px;
        display: flex; align-items: center; justify-content: center;
        font-family: var(--sans);
        transition: all 0.2s;
      }

      .close-btn:hover {
        background: var(--nerv-orange);
        color: #000;
        box-shadow: 0 0 10px var(--nerv-orange);
      }

      .tweet-content {
        padding: 15px 20px;
        font-size: 12px;
        color: var(--nerv-cyan);
        line-height: 1.5;
        border-bottom: 1px dashed rgba(240, 144, 58, 0.3);
        max-height: 100px;
        overflow-y: auto;
        position: relative;
        z-index: 2;
        background: rgba(0, 20, 40, 0.3);
      }

      .tweet-content::before {
        content: "TARGET_DATA_SOURCE";
        display: block;
        font-size: 9px;
        color: var(--nerv-cyan);
        opacity: 0.5;
        margin-bottom: 5px;
        letter-spacing: 1px;
      }

      .thinking-content {
        padding: 15px 20px;
        font-size: 12px;
        color: var(--nerv-green);
        line-height: 1.4;
        border-bottom: 1px solid rgba(88, 242, 165, 0.2);
        max-height: 150px;
        overflow-y: auto;
        white-space: pre-wrap;
        font-family: var(--mono);
        position: relative;
        z-index: 2;
        display: none;
        background: rgba(0, 20, 0, 0.2);
      }

      .thinking-content.visible { display: block; }

      .thinking-label {
        color: var(--nerv-green);
        font-size: 10px;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 1px;
        display: flex;
        align-items: center;
      }

      .thinking-dot {
        display: inline-block;
        width: 8px; height: 8px;
        background: var(--nerv-green);
        margin-left: 8px;
        animation: blink 0.5s infinite;
      }

      .stream-content {
        padding: 20px;
        font-size: 14px;
        color: var(--nerv-orange);
        line-height: 1.6;
        min-height: 120px;
        max-height: 300px;
        overflow-y: auto;
        white-space: pre-wrap;
        position: relative;
        z-index: 2;
        text-shadow: 0 0 2px rgba(240, 144, 58, 0.3);
      }

      .stream-content::before {
        content: "GENERATED_RESPONSE_OUTPUT";
        display: block;
        font-size: 9px;
        color: var(--nerv-orange);
        opacity: 0.5;
        margin-bottom: 10px;
        letter-spacing: 1px;
      }

      .error-text {
        color: var(--nerv-red);
      }

      .copy-hint {
        margin-top: 12px;
        padding: 10px;
        border: 1px dashed rgba(240, 144, 58, 0.6);
        text-align: center;
        font-size: 11px;
        opacity: 0.9;
      }

      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
      ::-webkit-scrollbar-thumb { background: var(--nerv-orange); }
      .thinking-content::-webkit-scrollbar-thumb { background: var(--nerv-green); }

      @keyframes blink { 50% { opacity: 0; } }
    `;
  }
}

export const overlay = new Overlay();
