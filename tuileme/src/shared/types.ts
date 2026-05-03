export interface Persona {
  name: string;
  prompt: string;
}

export interface Settings {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  personas: Record<string, string>;
  currentPersona: string;
  btnLabel: string;
  lang: 'auto' | 'zh' | 'en' | 'ja' | 'ko';
  lastSelectedPersona?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  maxTokens: 400,
  personas: {
    'SHINJI': 'As Shinji Ikari: somewhat reserved, introspective, cautious but responds with honesty.',
    'ASUKA': 'Asuka Langley Soryu: confident, competitive, direct, occasionally tsundere.',
    'REI': 'Rei Ayanami: detached, analytical, speaks concisely, shows minimal emotion.',
    'MISATO': 'Misato Katsuragi: casual, caring, military commander style, uses informal language.',
  },
  currentPersona: 'SHINJI',
  btnLabel: '推了么',
  lang: 'auto',
};

export interface GenerateReplyStreamRequest {
  type: 'GENERATE_REPLY_STREAM';
  prompt: string;
  tweetText: string;
}

export interface AiReplyProgressMessage {
  type: 'AI_REPLY_PROGRESS';
  status: 'start' | 'thinking' | 'stream' | 'done' | 'error';
  delta?: string;
  error?: string;
}

export type ExtensionMessage = GenerateReplyStreamRequest | AiReplyProgressMessage;

export interface FillResult {
  ok: boolean;
  mode: 'auto' | 'clipboard' | 'failed';
  reason?: string;
}

export interface ComposerOpenResult {
  ok: boolean;
  composer?: HTMLElement;
  reason?: string;
}

export interface StreamEvent {
  type: 'thinking' | 'content' | 'done' | 'error';
  delta?: string;
  error?: string;
}

export interface OpenAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      content?: string;
      reasoning_content?: string;
    };
    finish_reason: string | null;
  }>;
}

export type PermissionState = 'idle' | 'requesting' | 'testing' | 'success' | 'failed';

export interface PermissionResult {
  granted: boolean;
  tested: boolean;
  error?: string;
}

export type SupportedLang = 'zh' | 'en' | 'ja' | 'ko';

export interface I18nStrings {
  title: string;
  generating: string;
  done: string;
  error: string;
  copied: string;
  copyHint: string;
  retry: string;
  openingReply: string;
  filling: string;
}
