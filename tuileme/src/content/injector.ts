import type { Settings } from '@shared/types';
import { UI_CONFIG, SELECTORS } from '@shared/config';
import { createButton } from './button';

const CHECK_INTERVAL = 1000;

export class Injector {
  private checkIntervalId: number | null = null;
  private buttonRef: HTMLElement | null = null;

  constructor(
    private settings: Settings,
    private onButtonClick: (personaName: string) => void
  ) {}

  start(_statusId: string): void {
    this.tryInject();
    
    this.checkIntervalId = window.setInterval(() => {
      if (!this.buttonRef || !document.contains(this.buttonRef)) {
        this.buttonRef = null;
        this.tryInject();
      }
    }, CHECK_INTERVAL);
  }

  stop(): void {
    if (this.checkIntervalId !== null) {
      window.clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
    this.buttonRef?.remove();
    this.buttonRef = null;
  }

  private tryInject(): boolean {
    if (this.buttonRef && document.contains(this.buttonRef)) {
      return true;
    }
    
    const replyButtons = document.querySelectorAll<HTMLElement>(SELECTORS.REPLY_BUTTON);
    
    for (const replyBtn of replyButtons) {
      if (!replyBtn.offsetParent) continue;
      
      const replyBtnContainer = replyBtn.parentElement;
      if (!replyBtnContainer) continue;
      if (!replyBtnContainer.className.includes('r-knv0ih')) continue;
      if (replyBtnContainer.querySelector(`.${UI_CONFIG.BUTTON_CONTAINER_CLASS}`)) continue;
      
      const button = createButton(this.settings, this.onButtonClick);
      
      replyBtnContainer.insertBefore(button, replyBtn);

      this.buttonRef = button;
      return true;
    }
    
    return false;
  }
}
