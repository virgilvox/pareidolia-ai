import type { AIEngine, ChatMessage, ChatOptions } from '../engine-interface';

export class ClaudeDirectEngine implements AIEngine {
  private apiKey: string;
  private model: string;
  private _name: string;

  constructor(apiKey: string, model: string, modelName: string) {
    this.apiKey = apiKey;
    this.model = model;
    this._name = modelName;
  }

  get name(): string { return this._name; }
  get isLocal(): boolean { return false; }

  async init(): Promise<void> {
    // Validate key with a minimal test call via Netlify proxy
    var response = await fetch('/.netlify/functions/claude-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: this.apiKey,
        model: this.model,
        messages: [{ role: 'user', content: 'ping' }],
        maxTokens: 1,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      var errText = await response.text();
      var errMsg = 'API key validation failed';
      try {
        var parsed = JSON.parse(errText);
        errMsg = parsed.error || errMsg;
      } catch (_e) { /* use default */ }
      throw new Error(errMsg);
    }
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    // Separate system messages from chat messages
    var systemMessages: ChatMessage[] = [];
    var chatMessages: ChatMessage[] = [];

    for (var i = 0; i < messages.length; i++) {
      var msg = messages[i]!;
      if (msg.role === 'system') {
        systemMessages.push(msg);
      } else {
        chatMessages.push(msg);
      }
    }

    var systemText = systemMessages.map(function (m: ChatMessage) { return m.content; }).join('\n');

    var body: any = {
      apiKey: this.apiKey,
      model: this.model,
      messages: chatMessages.map(function (m: ChatMessage) {
        return { role: m.role, content: m.content };
      }),
      maxTokens: options?.maxTokens ?? 1024,
      temperature: options?.temperature ?? 0.85,
    };

    // Send system message separately with cache_control for prompt caching
    if (systemText) {
      body.system = systemText;
      if (options?.cacheControl !== false) {
        body.cacheControl = true;
      }
    }

    var response = await fetch('/.netlify/functions/claude-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      var errText = await response.text();
      throw new Error('Claude API error (' + response.status + '): ' + errText.slice(0, 200));
    }

    var data = await response.json();
    return data.text || '';
  }

  destroy(): void {
    // Nothing to clean up for HTTP-based engine
  }
}
