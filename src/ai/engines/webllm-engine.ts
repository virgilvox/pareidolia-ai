import type { AIEngine, ChatMessage, ChatOptions } from '../engine-interface';

export class WebLLMEngine implements AIEngine {
  private engine: any = null;
  private modelId: string;
  private _name: string;

  constructor(modelId: string, modelName: string) {
    this.modelId = modelId;
    this._name = modelName;
  }

  get name(): string { return this._name; }
  get isLocal(): boolean { return true; }

  async init(onProgress?: (info: { progress?: number; text?: string }) => void): Promise<void> {
    // Dynamic import from ESM CDN — @mlc-ai/web-llm is NOT in package.json
    // @ts-ignore - dynamic ESM CDN import
    const webllm: any = await import(/* @vite-ignore */ 'https://esm.run/@mlc-ai/web-llm');

    this.engine = await webllm.CreateMLCEngine(this.modelId, {
      initProgressCallback: function (info: any) {
        if (!onProgress) return;

        var pct = 0;
        if (info.progress !== undefined) {
          pct = Math.round(info.progress * 100);
        } else if (info.text) {
          var m = info.text.match(/(\d+)%/);
          if (m) pct = parseInt(m[1], 10);
        }

        var phase = 'downloading weights';
        if (info.text) {
          if (info.text.indexOf('wasm') !== -1) phase = 'compiling wasm runtime';
          else if (info.text.indexOf('Loading model') !== -1) phase = 'loading into GPU memory';
          else if (info.text.indexOf('Finish') !== -1) phase = 'ready';
          else if (info.text.indexOf('cache') !== -1) phase = 'loading from cache';
        }

        onProgress({ progress: pct / 100, text: phase + ' \u00B7 ' + pct + '%' });
      },
    });
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    if (!this.engine) {
      throw new Error('WebLLM engine not initialized. Call init() first.');
    }

    var reply = await this.engine.chat.completions.create({
      messages: messages.map(function (m: ChatMessage) {
        return { role: m.role, content: m.content };
      }),
      max_tokens: options?.maxTokens ?? 1024,
      temperature: options?.temperature ?? 0.85,
      top_p: options?.topP ?? 0.9,
    });

    return reply.choices[0].message.content || '';
  }

  destroy(): void {
    if (this.engine) {
      try {
        if (typeof this.engine.unload === 'function') {
          this.engine.unload();
        }
      } catch (_e) { /* swallow */ }
      this.engine = null;
    }
  }
}
