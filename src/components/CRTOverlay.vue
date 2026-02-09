<template>
  <div id="crt-effects">
    <canvas id="crt-static" ref="crtCanvas"></canvas>
    <div class="crt-scan-beam"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const crtCanvas = ref<HTMLCanvasElement | null>(null)
let resizeTimer: number | undefined

function render() {
  const canvas = crtCanvas.value
  if (!canvas) return
  const dpr = Math.min(window.devicePixelRatio, 1)
  const w = window.innerWidth
  const h = window.innerHeight
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)
  ctx.fillStyle = 'rgba(0,0,0,0.1)'
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 2)
  const vg = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7)
  vg.addColorStop(0, 'transparent')
  vg.addColorStop(0.6, 'rgba(0,0,0,0.2)')
  vg.addColorStop(1, 'rgba(0,0,0,0.6)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, w, h)
}

function onResize() {
  clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(render, 400)
}

onMounted(() => {
  render()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  if (resizeTimer !== undefined) clearTimeout(resizeTimer)
})
</script>
