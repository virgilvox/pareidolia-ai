<template>
  <div id="fake-crash" :class="{ active: isActive, fading: isFading }">
    <div class="ci">{{ icon }}</div>
    <div class="ct">{{ title }}</div>
    <div class="cb">{{ body }}</div>
    <div class="cc">{{ code }}</div>
    <button class="cx" @click="onReconnect">{{ button }}</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isActive = ref(false)
const isFading = ref(false)
const icon = ref('◬')
const title = ref('FATAL EXCEPTION')
const body = ref('The entity encountered an irrecoverable error in the membrane between your world and this one.')
const code = ref('0xDEAD_FEED :: SIGVOID :: frame -1')
const button = ref('attempt reconnection')

let crashTimeout: number | undefined

function crash(opts?: {
  icon?: string
  title?: string
  body?: string
  code?: string
  button?: string
  duration?: number
}) {
  const o = opts || {}
  const dur = Math.min(o.duration || 6000, 10000)
  icon.value = o.icon || '◬'
  title.value = o.title || 'FATAL EXCEPTION'
  body.value = o.body || 'The entity encountered an irrecoverable error.'
  code.value = o.code || '0xDEAD_FEED :: SIGVOID'
  button.value = o.button || 'attempt reconnection'
  isActive.value = true
  isFading.value = false
  crashTimeout = window.setTimeout(uncrash, dur)
}

function uncrash() {
  isFading.value = true
  setTimeout(() => {
    isActive.value = false
    isFading.value = false
  }, 800)
  if (crashTimeout) {
    clearTimeout(crashTimeout)
    crashTimeout = undefined
  }
}

function onReconnect() {
  uncrash()
}

defineExpose({ crash, uncrash })
</script>
