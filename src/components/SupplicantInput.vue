<template>
  <div id="input-area">
    <input
      id="supplicant"
      ref="inputEl"
      type="text"
      :placeholder="currentPlaceholder"
      autocomplete="off"
      spellcheck="false"
      :disabled="isProcessing"
      @keydown.enter="onSubmit"
    />
    <!-- options-area is managed imperatively by effects.ts showOptions/hideOptions -->
    <div id="options-area"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useChat } from '../composables/useChat'
import { PLACEHOLDERS } from '../constants/sigils'

const emit = defineEmits<{
  submit: [message: string]
}>()

const { isProcessing } = useChat()
const inputEl = ref<HTMLInputElement | null>(null)
const currentPlaceholder = ref('speak')

let phIdx = 0
let placeholderIv: number | undefined

function onSubmit() {
  if (!inputEl.value) return
  const msg = inputEl.value.value.trim()
  if (!msg || isProcessing.value) return
  inputEl.value.value = ''
  emit('submit', msg)
}

function focusInput() {
  inputEl.value?.focus()
}

onMounted(() => {
  placeholderIv = window.setInterval(() => {
    if (!isProcessing.value && document.activeElement !== inputEl.value) {
      currentPlaceholder.value = PLACEHOLDERS[phIdx % PLACEHOLDERS.length] ?? 'speak'
      phIdx++
    }
  }, 7000)
})

onUnmounted(() => {
  if (placeholderIv !== undefined) clearInterval(placeholderIv)
})

defineExpose({ focusInput })
</script>
