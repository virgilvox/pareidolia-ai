<template>
  <div class="editor-overlay" @click.self="$emit('close')">
    <div class="editor-panel">
      <div class="editor-header">
        <h2>personalities</h2>
        <button class="editor-close" @click="$emit('close')">×</button>
      </div>

      <div class="editor-warning">
        ⟁ Personalities are stored in your browser. Clearing browser data will delete them.
      </div>

      <div class="editor-body">
        <!-- Personality List -->
        <div class="editor-list">
          <button
            v-for="p in personalities"
            :key="p.id"
            class="editor-list-item"
            :class="{ active: editing?.id === p.id }"
            @click="selectForEdit(p)"
          >
            {{ p.name }}
          </button>
          <button class="editor-list-item editor-add" @click="createNew">+ new</button>
          <div class="editor-io">
            <button class="editor-io-btn" @click="doExport">export all</button>
            <button class="editor-io-btn" @click="triggerImport">import</button>
            <input
              ref="importInput"
              type="file"
              accept=".json"
              style="display:none"
              @change="doImport"
            />
          </div>
        </div>

        <!-- Editor Form -->
        <div v-if="editing" class="editor-form">
          <label class="editor-label">Name</label>
          <input
            v-model="editing.name"
            class="editor-input"
            :disabled="isDefault"
          />

          <label class="editor-label">System Prompt</label>
          <textarea
            v-model="editing.systemPrompt"
            class="editor-textarea"
            rows="12"
            :disabled="isDefault"
          ></textarea>

          <label class="editor-label">Temperature: {{ editing.temperature }}</label>
          <input
            v-model.number="editing.temperature"
            type="range"
            min="0"
            max="2"
            step="0.05"
            class="editor-range"
          />

          <label class="editor-label">Max History Length: {{ editing.maxHistoryLength }}</label>
          <input
            v-model.number="editing.maxHistoryLength"
            type="range"
            min="4"
            max="48"
            step="2"
            class="editor-range"
          />

          <label class="editor-label">Idle Interval (seconds)</label>
          <div class="editor-row">
            <input v-model.number="editing.idleIntervalRange[0]" type="number" class="editor-input-sm" />
            <span>to</span>
            <input v-model.number="editing.idleIntervalRange[1]" type="number" class="editor-input-sm" />
          </div>

          <label class="editor-label">Observer Interval (seconds)</label>
          <div class="editor-row">
            <input v-model.number="editing.observerIntervalRange[0]" type="number" class="editor-input-sm" />
            <span>to</span>
            <input v-model.number="editing.observerIntervalRange[1]" type="number" class="editor-input-sm" />
          </div>

          <!-- Disabled Methods -->
          <label class="editor-label">Tool Access</label>
          <div class="editor-methods">
            <div
              v-for="group in methodGroups"
              :key="group.name"
              class="method-group"
            >
              <div class="method-group-name">{{ group.name }}</div>
              <label
                v-for="method in group.methods"
                :key="method"
                class="method-toggle"
              >
                <input
                  type="checkbox"
                  :checked="!editing.disabledMethods.includes(method)"
                  @change="toggleMethod(method)"
                />
                <span>{{ method }}</span>
              </label>
            </div>
          </div>

          <div class="editor-actions">
            <button v-if="!isDefault" class="editor-btn" @click="doSave">save</button>
            <button class="editor-btn" @click="doClone">clone</button>
            <button v-if="!isDefault" class="editor-btn editor-btn-danger" @click="doDelete">delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePersonalities } from '../composables/usePersonalities'
import type { Personality } from '../db/index'

defineEmits<{ close: [] }>()

const { personalities, save, remove, clone, exportAll, importAll } = usePersonalities()

const editing = ref<Personality | null>(null)
const importInput = ref<HTMLInputElement | null>(null)

const isDefault = computed(() => editing.value?.name === 'The Entity (Default)')

const methodGroups = [
  { name: 'Audio', methods: ['sound', 'chord', 'noise', 'drone', 'deepDrone', 'sweep', 'binaural', 'breath', 'pulse', 'dissonance', 'stab', 'scream', 'siren', 'rumble', 'speak', 'arp', 'sequence', 'melody', 'chime', 'glitchMusic', 'bell', 'silence'] },
  { name: 'Visual FX', methods: ['shake', 'glitch', 'flashColor', 'blackout', 'strobe', 'rain', 'portal', 'eyes', 'fracture', 'heal', 'mirror', 'invert', 'hue', 'blur'] },
  { name: 'CRT', methods: ['crt', 'crtColor'] },
  { name: '3D', methods: ['spawn3D', 'kill3D'] },
  { name: 'Canvas', methods: ['draw', 'drawLoop', 'killDraw'] },
  { name: 'Webcam', methods: ['webcam.start', 'webcam.stop', 'webcam.snapshot'] },
  { name: 'Scare', methods: ['crash', 'fakeError', 'bsod'] },
  { name: 'Input', methods: ['showOptions', 'hideOptions', 'hideInput', 'showInput', 'moveInput', 'resetInput', 'flipInput', 'spinInput'] },
  { name: 'DOM', methods: ['css', 'inject', 'remove'] },
  { name: 'Page', methods: ['title', 'favicon', 'bg', 'setBg', 'cursor'] },
  { name: 'Text', methods: ['typewriter', 'scramble', 'gravity', 'float', 'morph'] },
]

function selectForEdit(p: Personality) {
  editing.value = JSON.parse(JSON.stringify(p))
}

function createNew() {
  editing.value = {
    name: 'New Personality',
    systemPrompt: '',
    disabledMethods: [],
    idleIntervalRange: [40, 60],
    observerIntervalRange: [25, 45],
    idlePrompts: [],
    maxHistoryLength: 24,
    temperature: 0.85,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

function toggleMethod(method: string) {
  if (!editing.value) return
  const idx = editing.value.disabledMethods.indexOf(method)
  if (idx >= 0) {
    editing.value.disabledMethods.splice(idx, 1)
  } else {
    editing.value.disabledMethods.push(method)
  }
}

async function doSave() {
  if (!editing.value) return
  await save(editing.value)
}

async function doClone() {
  if (!editing.value?.id) return
  await clone(editing.value.id, editing.value.name + ' (copy)')
}

async function doDelete() {
  if (!editing.value?.id) return
  await remove(editing.value.id)
  editing.value = null
}

function doExport() {
  const json = exportAll()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'pareidolia-personalities.json'
  a.click()
  URL.revokeObjectURL(url)
}

function triggerImport() {
  importInput.value?.click()
}

async function doImport(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const text = await file.text()
  await importAll(text)
  input.value = ''
}
</script>
