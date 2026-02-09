import type { AIEngine, ChatMessage, ChatOptions } from '../engine-interface';

export class OllamaEngine implements AIEngine {
  private baseUrl: string;
  private model: string;
  private _name: string;

  constructor(baseUrl: string, model: string) {
    // Strip trailing slash
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.model = model;
    this._name = model;
  }

  get name(): string { return this._name; }
  get isLocal(): boolean { return true; }

  async init(): Promise<void> {
    // Test connection by hitting the tags endpoint
    var response = await fetch(this.baseUrl + '/api/tags');
    if (!response.ok) {
      throw new Error('Cannot reach Ollama at ' + this.baseUrl + ' (status ' + response.status + ')');
    }
    var data = await response.json();
    var modelNames: string[] = (data.models || []).map(function (m: any) { return m.name; });
    // Check if requested model is available
    var targetModel = this.model;
    var found = modelNames.some(function (name: string) {
      return name === targetModel;
    }) || modelNames.some(function (name: string) {
      return name.split(':')[0] === targetModel;
    });
    if (!found && modelNames.length > 0) {
      console.warn('[OllamaEngine] Model "' + this.model + '" not found. Available: ' + modelNames.join(', '));
    }
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    var response = await fetch(this.baseUrl + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map(function (m: ChatMessage) {
          return { role: m.role, content: m.content };
        }),
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.85,
          num_predict: options?.maxTokens ?? 1024,
        },
      }),
    });

    if (!response.ok) {
      var errText = await response.text();
      throw new Error('Ollama chat failed (' + response.status + '): ' + errText.slice(0, 200));
    }

    var data = await response.json();
    return data.message?.content || '';
  }

  destroy(): void {
    // Nothing to clean up for HTTP-based engine
  }

  /**
   * Test if an Ollama instance is reachable and return available model names.
   */
  static async testConnection(baseUrl: string): Promise<{ ok: boolean; models?: string[]; error?: string }> {
    try {
      var url = baseUrl.replace(/\/+$/, '') + '/api/tags';
      var response = await fetch(url);
      if (!response.ok) {
        return { ok: false, error: 'HTTP ' + response.status };
      }
      var data = await response.json();
      var models: string[] = (data.models || []).map(function (m: any) { return m.name as string; });
      return { ok: true, models: models };
    } catch (e: any) {
      return { ok: false, error: e.message || 'Connection failed' };
    }
  }
}
