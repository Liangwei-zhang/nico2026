import type { Settings, AiReplyProgressMessage } from '@shared/types';
import { isStatusPage, getStatusId, getMainTweetArticle, getTweetText } from './twitterAdapter';
import { Injector } from './injector';
import { sendGenerateRequest } from './messaging';
import { overlay } from './ui/overlay';
import { fillReplyToComposer } from './composerFiller';

type ControllerState = 'idle' | 'active' | 'generating';

const URL_CHECK_INTERVAL = 500;

export class RouteController {
  private state: ControllerState = 'idle';
  private injector: Injector | null = null;
  private currentStatusId: string | null = null;
  private lastUrl: string = '';
  private streamContent = '';
  private thinkingContent = '';
  private checkIntervalId: number | null = null;

  constructor(private settings: Settings) {}

  start(): void {
    this.lastUrl = window.location.href;
    this.startUrlCheck();
    this.checkRoute();
  }

  stop(): void {
    this.stopUrlCheck();
    this.cleanup();
  }

  onGenerateRequested(personaName: string): void {
    if (this.state === 'generating') return;

    const statusId = this.currentStatusId;
    if (!statusId) return;

    const article = getMainTweetArticle(statusId);
    if (!article) return;

    const tweetText = getTweetText(article);
    if (!tweetText) return;

    const prompt = this.settings.personas[personaName] || this.settings.personas[this.settings.currentPersona];
    if (!prompt) return;

    this.state = 'generating';
    this.streamContent = '';
    this.thinkingContent = '';

    this.showOverlay(tweetText);
    sendGenerateRequest(prompt, tweetText);
  }

  onStreamUpdate(msg: AiReplyProgressMessage): void {
    if (this.state !== 'generating') return;

    switch (msg.status) {
      case 'start':
        break;
      case 'thinking':
        this.thinkingContent += msg.delta || '';
        this.updateOverlayThinking(this.thinkingContent);
        break;
      case 'stream':
        this.streamContent += msg.delta || '';
        this.updateOverlayStream(this.streamContent);
        break;
      case 'done':
        this.state = 'active';
        this.handleCompletion();
        break;
      case 'error':
        this.state = 'active';
        this.showOverlayError(msg.error || 'Unknown error');
        break;
    }
  }

  private startUrlCheck(): void {
    this.checkIntervalId = window.setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== this.lastUrl) {
        this.lastUrl = currentUrl;
        this.checkRoute();
      }
    }, URL_CHECK_INTERVAL);
  }

  private stopUrlCheck(): void {
    if (this.checkIntervalId !== null) {
      window.clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
  }

  private checkRoute(): void {
    const url = new URL(window.location.href);

    if (isStatusPage(url)) {
      const statusId = getStatusId(url);
      if (statusId && statusId !== this.currentStatusId) {
        this.cleanup();
        this.currentStatusId = statusId;
        this.activate(statusId);
      }
    } else {
      if (this.state !== 'idle') {
        this.cleanup();
      }
    }
  }

  private async activate(statusId: string): Promise<void> {
    const stored = await chrome.storage.sync.get(['lastSelectedPersona']) as { lastSelectedPersona?: string };
    if (stored.lastSelectedPersona && this.settings.personas[stored.lastSelectedPersona]) {
      this.settings.lastSelectedPersona = stored.lastSelectedPersona;
    }
    
    this.state = 'active';
    this.injector = new Injector(this.settings, (persona) => this.onGenerateRequested(persona));
    this.injector.start(statusId);
  }

  private cleanup(): void {
    this.injector?.stop();
    this.injector = null;
    this.currentStatusId = null;
    this.state = 'idle';
    this.hideOverlay();
  }

  private showOverlay(tweetText: string): void {
    overlay.show(tweetText);
  }

  private updateOverlayThinking(text: string): void {
    overlay.updateThinking(text);
  }

  private updateOverlayStream(text: string): void {
    overlay.updateStream(text);
  }

  private showOverlayError(error: string): void {
    overlay.showError(error);
  }

  private async handleCompletion(): Promise<void> {
    const result = await fillReplyToComposer(this.streamContent, this.currentStatusId);
    overlay.showComplete(result.mode);
  }

  private hideOverlay(): void {
    overlay.hide();
  }
}
