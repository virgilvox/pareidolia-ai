<template>
  <div id="ambient-field" ref="fieldEl"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { SIGIL_SET } from '../constants/sigils'

const fieldEl = ref<HTMLElement | null>(null)
let spawnInterval: number | undefined

const glyphs = SIGIL_SET.slice(0, 30)

function spawnAmbient() {
  const field = fieldEl.value
  if (!field) return
  const el = document.createElement('div')
  el.className = 'ambient-glyph'
  el.textContent = glyphs[Math.floor(Math.random() * glyphs.length)] ?? '◬'
  const dur = 20 + Math.random() * 40
  el.style.cssText = `left:${Math.random() * 100}vw;top:100vh;font-size:${0.6 + Math.random() * 1.2}rem;opacity:${0.02 + Math.random() * 0.05};animation:ambientFloat ${dur}s linear forwards;`
  field.appendChild(el)
  setTimeout(() => {
    try { el.remove() } catch (_) { /* noop */ }
  }, dur * 1000)
}

onMounted(() => {
  const field = fieldEl.value
  if (!field) return

  // Initial floating glyphs
  for (let i = 0; i < 8; i++) {
    setTimeout(spawnAmbient, Math.random() * 10000)
  }

  // Periodic spawning
  spawnInterval = window.setInterval(() => {
    if (field.children.length < 14) spawnAmbient()
  }, 3500)

  // Static pulsing sigils
  for (let j = 0; j < 6; j++) {
    const sigil = document.createElement('div')
    sigil.className = 'ambient-glyph'
    sigil.textContent = glyphs[Math.floor(Math.random() * glyphs.length)] ?? '◬'
    sigil.style.cssText = `left:${10 + Math.random() * 80}vw;top:${10 + Math.random() * 80}vh;font-size:${1.5 + Math.random() * 3}rem;animation:ambientPulse ${6 + Math.random() * 8}s ease-in-out infinite;animation-delay:-${Math.random() * 8}s;`
    field.appendChild(sigil)
  }
})

onUnmounted(() => {
  if (spawnInterval !== undefined) clearInterval(spawnInterval)
})
</script>
