import type { AIEngine, ChatMessage, ChatOptions } from '../engine-interface';

export class HaikuProvidedEngine implements AIEngine {
  get name(): string { return 'Haiku 4.5 (provided)'; }
  get isLocal(): boolean { return false; }

  async init(): Promise<void> {
    // No initialization needed — the server-side function handles everything
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    var response = await fetch('/.netlify/functions/haiku-provided', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.map(function (m: ChatMessage) {
          return { role: m.role, content: m.content };
        }),
        maxTokens: options?.maxTokens ?? 1024,
        temperature: options?.temperature ?? 0.85,
      }),
    });

    if (!response.ok) {
      var errText = await response.text();
      var errMsg = 'Haiku API error';
      try {
        var parsed = JSON.parse(errText);
        errMsg = parsed.error || errMsg;
      } catch (_e) { /* use default */ }
      throw new Error(errMsg + ' (' + response.status + ')');
    }

    var data = await response.json();
    return data.text || '';
  }

  destroy(): void {
    // Nothing to clean up
  }
}
