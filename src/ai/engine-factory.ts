import type { AIEngine } from './engine-interface';
import { WebLLMEngine } from './engines/webllm-engine';
import { OllamaEngine } from './engines/ollama-engine';
import { ClaudeDirectEngine } from './engines/claude-direct-engine';
import { HaikuProvidedEngine } from './engines/haiku-provided-engine';

export type EngineType = 'webllm' | 'ollama' | 'claude' | 'haiku-provided';

export interface EngineConfig {
  type: EngineType;
  modelId?: string;
  modelName?: string;
  apiKey?: string;
  baseUrl?: string;
}

/**
 * Create an AIEngine instance from configuration.
 * The returned engine is NOT yet initialized — call engine.init() to load/connect.
 */
export function createEngine(config: EngineConfig): AIEngine {
  switch (config.type) {
    case 'webllm':
      if (!config.modelId) {
        throw new Error('modelId is required for WebLLM engine');
      }
      return new WebLLMEngine(config.modelId, config.modelName || config.modelId);

    case 'ollama':
      if (!config.baseUrl || !config.modelId) {
        throw new Error('baseUrl and modelId are required for Ollama engine');
      }
      return new OllamaEngine(config.baseUrl, config.modelId);

    case 'claude':
      if (!config.apiKey || !config.modelId) {
        throw new Error('apiKey and modelId are required for Claude engine');
      }
      return new ClaudeDirectEngine(config.apiKey, config.modelId, config.modelName || config.modelId);

    case 'haiku-provided':
      return new HaikuProvidedEngine();

    default:
      throw new Error('Unknown engine type: ' + (config as any).type);
  }
}
