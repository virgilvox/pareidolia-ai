export interface ModelOption {
  id: string;
  name: string;
  size: string;
  speed: string;
  desc: string;
  backend: 'webllm' | 'ollama' | 'claude' | 'haiku-provided';
  costHint?: string;
}

export const WEBLLM_MODELS: ModelOption[] = [
  { id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC', name: 'SmolLM2 1.7B', size: '~1.0 GB', speed: 'fast', desc: 'Lightweight. Quick to load.', backend: 'webllm' },
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 1B', size: '~0.7 GB', speed: 'fast', desc: 'Meta. Compact but capable.', backend: 'webllm' },
  { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5 1.5B', size: '~1.0 GB', speed: 'fast', desc: 'Alibaba. Strong for its size.', backend: 'webllm' },
  { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 3B', size: '~1.8 GB', speed: 'medium', desc: 'Meta. Better reasoning.', backend: 'webllm' },
  { id: 'Phi-3.5-mini-instruct-q4f16_1-MLC', name: 'Phi 3.5 Mini', size: '~2.2 GB', speed: 'medium', desc: 'Microsoft. Strong instruction following.', backend: 'webllm' },
  { id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5 3B', size: '~1.9 GB', speed: 'medium', desc: 'Alibaba. Best quality here.', backend: 'webllm' },
];

export const CLAUDE_MODELS: ModelOption[] = [
  { id: 'claude-opus-4-6', name: 'Opus 4.6', size: '', speed: '', desc: 'Most powerful', backend: 'claude', costHint: '~$2-5/hr · most powerful' },
  { id: 'claude-sonnet-4-5-20250929', name: 'Sonnet 4.5', size: '', speed: '', desc: 'Best balance', backend: 'claude', costHint: '~$0.50-1.50/hr · best balance' },
  { id: 'claude-haiku-4-5-20251001', name: 'Haiku 4.5', size: '', speed: '', desc: 'Fast & cheap', backend: 'claude', costHint: '~$0.15-0.50/hr · fast & cheap' },
];

export const PROVIDED_MODEL: ModelOption = {
  id: 'claude-haiku-4-5-20251001', name: 'Haiku 4.5 (Provided)', size: '', speed: '', desc: 'Free, rate limited', backend: 'haiku-provided'
};
