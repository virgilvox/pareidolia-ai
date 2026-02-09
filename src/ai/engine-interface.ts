export interface AIEngine {
  init(onProgress?: (info: { progress?: number; text?: string }) => void): Promise<void>;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>;
  destroy(): void;
  readonly name: string;
  readonly isLocal: boolean;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  cacheControl?: boolean;
}
