<template>
  <div
    id="thinking-field"
    ref="fieldEl"
    :class="{ hidden: !visible, manifesting: manifesting }"
  ></div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { SIGIL_SET, THINKING_STATUSES } from '../constants/sigils'
import { useChat } from '../composables/useChat'

const { isProcessing } = useChat()

const fieldEl = ref<HTMLElement | null>(null)
const visible = ref(false)
const manifesting = ref(false)

let sigilIv: number | undefined
let statusIv: number | undefined
let sigils: HTMLElement[] = []
let statusEl: HTMLElement | null = null

function pick(): string {
  return SIGIL_SET[Math.floor(Math.random() * SIGIL_SET.length)] ?? '◬'
}

function startThinking() {
  // 12% chance of suppressing the animation
  if (Math.random() < 0.12) return

  const field = fieldEl.value
  if (!field) return

  visible.value = true
  manifesting.value = false
  field.innerHTML = ''
  sigils = []

  const count = 8 + Math.floor(Math.random() * 10)
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div')
    s.className = 'tsigil'
    s.textContent = pick()
    s.style.cssText = `left:${10 + Math.random() * 80}vw;top:${30 + Math.random() * 60}vh;font-size:${0.8 + Math.random() * 1.8}rem;--dx:${(Math.random() - 0.5) * 120}px;--dy:${(Math.random() - 0.5) * 80}px;--sc:${0.5 + Math.random() * 1.2};animation:sigilDrift ${4 + Math.random() * 6}s ease-in-out infinite;animation-delay:-${Math.random() * 5}s;`
    field.appendChild(s)
    sigils.push(s)
  }

  sigilIv = window.setInterval(() => {
    if (!sigils.length) return
    const s = sigils[Math.floor(Math.random() * sigils.length)]
    if (s) s.textContent = pick()
    if (Math.random() < 0.1 && sigils.length < 18) {
      const ns = document.createElement('div')
      ns.className = 'tsigil'
      ns.textContent = pick()
      ns.style.cssText = `left:${Math.random() * 90}vw;top:${Math.random() * 90}vh;font-size:${0.6 + Math.random() * 1.5}rem;--dx:${(Math.random() - 0.5) * 100}px;--dy:${(Math.random() - 0.5) * 60}px;--sc:${0.5 + Math.random()};animation:sigilDrift ${3 + Math.random() * 5}s ease-in-out infinite;`
      field.appendChild(ns)
      sigils.push(ns)
    }
  }, 600)

  // Status text
  statusEl = document.createElement('div')
  statusEl.id = 'thinking-status'
  statusEl.textContent = (THINKING_STATUSES[Math.floor(Math.random() * THINKING_STATUSES.length)] ?? '∴ conjuring ∴')
  const ia = document.getElementById('input-area')
  if (ia) ia.appendChild(statusEl)

  statusIv = window.setInterval(() => {
    if (statusEl) {
      statusEl.textContent = (THINKING_STATUSES[Math.floor(Math.random() * THINKING_STATUSES.length)] ?? '∴ conjuring ∴')
    }
  }, 2500)
}

function stopThinking() {
  if (sigilIv !== undefined) clearInterval(sigilIv)
  if (statusIv !== undefined) clearInterval(statusIv)

  const field = fieldEl.value
  if (field && visible.value) {
    manifesting.value = true
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2
    sigils.forEach((s) => {
      const rect = s.getBoundingClientRect()
      s.style.setProperty('--cx', (cx - rect.left) + 'px')
      s.style.setProperty('--cy', (cy - rect.top) + 'px')
      s.style.animation = 'convergeSigil 0.6s ease-in forwards'
    })
    setTimeout(() => {
      visible.value = false
      if (field) field.innerHTML = ''
      sigils = []
      manifesting.value = false
    }, 700)
  }

  if (statusEl) {
    try { statusEl.remove() } catch (_) { /* noop */ }
    statusEl = null
  }
}

watch(isProcessing, (val) => {
  if (val) startThinking()
  else stopThinking()
})

onUnmounted(() => {
  if (sigilIv !== undefined) clearInterval(sigilIv)
  if (statusIv !== undefined) clearInterval(statusIv)
})
</script>
