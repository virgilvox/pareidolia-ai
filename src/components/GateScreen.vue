<template>
  <div id="key-gate">
    <div class="kg-particles" id="kg-particles" ref="particlesEl"></div>
    <div class="kg-glyph">⏃ ⏁ ⏂</div>
    <div class="kg-label">choose a vessel</div>

    <!-- Tier Tabs -->
    <div class="tier-tabs">
      <button
        v-for="tier in tiers"
        :key="tier.id"
        class="tier-tab"
        :class="{ active: activeTier === tier.id }"
        @click="activeTier = tier.id"
      >
        <span class="tier-name">{{ tier.label }}</span>
        <span class="tier-sub">{{ tier.subtitle }}</span>
      </button>
    </div>

    <!-- WebGPU Warning -->
    <div v-if="activeTier === 'webllm' && !hasWebGPU" id="webgpu-warning" style="display:block">
      ⟁ your browser does not support WebGPU. try Chrome 113+ or Edge 113+ on desktop.
    </div>

    <!-- Tier: WebLLM -->
    <template v-if="activeTier === 'webllm' && hasWebGPU">
      <div class="model-grid" id="model-grid">
        <button
          v-for="model in webllmModels"
          :key="model.id"
          class="model-option"
          :class="{ selected: selectedModel === model.id, disabled: engineLoading }"
          @click="selectWebLLM(model)"
        >
          <span>
            <span class="model-name">{{ model.name }}</span>
            <span style="opacity:0.4;font-size:0.65rem"> {{ model.desc }}</span>
          </span>
          <span class="model-meta">{{ model.size }} · {{ model.speed }}</span>
        </button>
      </div>
    </template>

    <!-- Tier: Ollama -->
    <template v-if="activeTier === 'ollama'">
      <div class="gate-form">
        <label class="gate-label">Ollama URL</label>
        <input
          v-model="ollamaUrl"
          class="gate-input"
          type="text"
          placeholder="http://localhost:11434"
        />
        <label class="gate-label">Model name</label>
        <input
          v-model="ollamaModel"
          class="gate-input"
          type="text"
          placeholder="llama3.2:3b"
        />
        <button class="gate-btn" @click="testOllama" :disabled="engineLoading">
          {{ ollamaTestResult || 'test connection' }}
        </button>
        <details class="gate-details">
          <summary>setup instructions</summary>
          <p>Install Ollama from <a href="https://ollama.com" target="_blank">ollama.com</a></p>
          <p>Pull a model: <code>ollama pull llama3.2:3b</code></p>
          <p>Start with CORS: <code>OLLAMA_ORIGINS=* ollama serve</code></p>
        </details>
        <button
          class="gate-btn gate-btn-go"
          @click="selectOllama"
          :disabled="engineLoading || !ollamaModel"
        >
          enter the void
        </button>
      </div>
    </template>

    <!-- Tier: Claude (user key) -->
    <template v-if="activeTier === 'claude'">
      <div class="gate-form">
        <label class="gate-label">API Key</label>
        <input
          v-model="claudeApiKey"
          class="gate-input"
          type="password"
          placeholder="sk-ant-..."
        />
        <label class="gate-label">Model</label>
        <div class="model-grid">
          <button
            v-for="model in claudeModels"
            :key="model.id"
            class="model-option"
            :class="{ selected: selectedModel === model.id }"
            @click="selectedModel = model.id; selectedModelName = model.name"
          >
            <span class="model-name">{{ model.name }}</span>
            <span class="model-meta">{{ model.costHint }}</span>
          </button>
        </div>
        <button
          class="gate-btn gate-btn-go"
          @click="selectClaude"
          :disabled="engineLoading || !claudeApiKey || !selectedModel"
        >
          enter the void
        </button>
      </div>
    </template>

    <!-- Tier: Provided Haiku -->
    <template v-if="activeTier === 'haiku-provided'">
      <div class="gate-form">
        <p class="gate-note">Free access to Haiku 4.5. Rate limited. For a taste of what the entity can do.</p>
        <button
          class="gate-btn gate-btn-go"
          @click="selectProvided"
          :disabled="engineLoading"
        >
          enter the void
        </button>
      </div>
    </template>

    <!-- Personality Selector -->
    <div v-if="personalities.length > 0" class="gate-personality">
      <label class="gate-label">personality</label>
      <select
        class="gate-select"
        :value="activePersonality?.id"
        @change="onPersonalityChange"
      >
        <option
          v-for="p in personalities"
          :key="p.id"
          :value="p.id"
        >
          {{ p.name }}
        </option>
      </select>
      <button class="gate-link" @click="showEditor = true">edit personalities</button>
    </div>

    <!-- Progress -->
    <div id="model-progress" :class="{ active: engineLoading }">
      <div id="progress-bar-outer">
        <div id="progress-bar-inner" :style="{ width: engineProgress + '%' }"></div>
      </div>
      <div id="progress-text">{{ progressPhase }}</div>
    </div>

    <div class="kg-err" :style="{ opacity: engineError ? 1 : 0 }">{{ engineError }}</div>
    <div class="kg-hint" v-if="activeTier === 'webllm'">
      runs entirely in your browser via WebGPU. nothing leaves this machine.
    </div>

    <!-- Personality Editor Overlay -->
    <PersonalityEditor
      v-if="showEditor"
      @close="showEditor = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { WEBLLM_MODELS, CLAUDE_MODELS } from '../constants/models'
import { useAIEngine } from '../composables/useAIEngine'
import { usePersonalities } from '../composables/usePersonalities'
import { SIGIL_SET } from '../constants/sigils'
import PersonalityEditor from './PersonalityEditor.vue'

const emit = defineEmits<{
  enter: []
}>()

const { engineLoading, engineError, engineProgress, engineProgressText, initEngine } = useAIEngine()
const { personalities, activePersonality, loaded: personalitiesLoaded, load: loadPersonalities, setActive } = usePersonalities()

type TierType = 'webllm' | 'ollama' | 'claude' | 'haiku-provided' | ''
const activeTier = ref<TierType>('')
const selectedModel = ref('')
const selectedModelName = ref('')
const showEditor = ref(false)

// Tier config
const tiers = [
  { id: 'webllm' as TierType, label: 'LOCAL · WEBGPU', subtitle: 'free · runs on your GPU · nothing leaves this machine' },
  { id: 'ollama' as TierType, label: 'OLLAMA · LOCAL API', subtitle: 'free · your hardware · requires Ollama running' },
  { id: 'claude' as TierType, label: 'CLAUDE · YOUR API KEY', subtitle: 'your key · your cost · best quality' },
  { id: 'haiku-provided' as TierType, label: 'PROVIDED · FREE', subtitle: 'free · rate limited · uses our API' },
]

// WebGPU check
const hasWebGPU = ref(!!navigator.gpu)
const webllmModels = WEBLLM_MODELS
const claudeModels = CLAUDE_MODELS

// Ollama state
const ollamaUrl = ref('http://localhost:11434')
const ollamaModel = ref('')
const ollamaTestResult = ref('')

// Claude state
const claudeApiKey = ref('')

// Progress display
const progressPhase = computed(() => {
  const t = engineProgressText.value
  if (!t) return ''
  let phase = 'downloading weights'
  if (t.indexOf('wasm') !== -1) phase = 'compiling wasm runtime'
  else if (t.indexOf('Loading model') !== -1) phase = 'loading into GPU memory'
  else if (t.indexOf('Finish') !== -1) phase = 'ready'
  else if (t.indexOf('cache') !== -1) phase = 'loading from cache'
  return `∴ ${phase} · ${engineProgress.value}% ∴`
})

// Gate particles
const particlesEl = ref<HTMLElement | null>(null)
let particleIv: number | undefined
const glyphs = SIGIL_SET.slice(0, 25)

function spawnParticle() {
  const kgp = particlesEl.value
  if (!kgp) return
  const p = document.createElement('div')
  p.className = 'kg-particle'
  p.textContent = glyphs[Math.floor(Math.random() * glyphs.length)] ?? '◬'
  const dur = 15 + Math.random() * 25
  p.style.cssText = `left:${Math.random() * 100}%;font-size:${0.8 + Math.random() * 1.4}rem;animation-duration:${dur}s;animation-delay:-${Math.random() * dur}s;opacity:${0.04 + Math.random() * 0.08};`
  kgp.appendChild(p)
  setTimeout(() => {
    try { p.remove() } catch (_) { /* noop */ }
  }, dur * 1000)
}

// Actions
async function selectWebLLM(model: typeof WEBLLM_MODELS[0]) {
  selectedModel.value = model.id
  selectedModelName.value = model.name
  const ok = await initEngine({
    type: 'webllm',
    modelId: model.id,
    modelName: model.name,
  })
  if (ok) emit('enter')
}

async function testOllama() {
  ollamaTestResult.value = 'testing...'
  try {
    const res = await fetch(ollamaUrl.value + '/api/tags')
    if (res.ok) {
      const data = await res.json()
      const models = data.models?.map((m: any) => m.name) || []
      ollamaTestResult.value = `connected · ${models.length} models`
      if (models.length > 0 && !ollamaModel.value) {
        ollamaModel.value = models[0]
      }
    } else {
      ollamaTestResult.value = 'connection failed'
    }
  } catch (_) {
    ollamaTestResult.value = 'connection failed'
  }
}

async function selectOllama() {
  const ok = await initEngine({
    type: 'ollama',
    modelId: ollamaModel.value,
    modelName: ollamaModel.value,
    baseUrl: ollamaUrl.value,
  })
  if (ok) emit('enter')
}

async function selectClaude() {
  sessionStorage.setItem('claude-api-key', claudeApiKey.value)
  const ok = await initEngine({
    type: 'claude',
    modelId: selectedModel.value,
    modelName: selectedModelName.value,
    apiKey: claudeApiKey.value,
  })
  if (ok) emit('enter')
}

async function selectProvided() {
  const ok = await initEngine({ type: 'haiku-provided' })
  if (ok) emit('enter')
}

function onPersonalityChange(e: Event) {
  const id = Number((e.target as HTMLSelectElement).value)
  const p = personalities.value.find((p) => p.id === id)
  if (p) setActive(p)
}

onMounted(async () => {
  // Particles
  for (let i = 0; i < 20; i++) spawnParticle()
  particleIv = window.setInterval(() => {
    const kgp = particlesEl.value
    if (kgp && kgp.children.length < 25) spawnParticle()
  }, 2000)

  // Load personalities
  await loadPersonalities()

  // Restore API key from session
  const savedKey = sessionStorage.getItem('claude-api-key')
  if (savedKey) claudeApiKey.value = savedKey
})

onUnmounted(() => {
  if (particleIv !== undefined) clearInterval(particleIv)
})
</script>
