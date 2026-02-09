<template>
  <div id="history-container" ref="historyEl">
    <div
      v-for="(msg, idx) in chatMessages"
      :key="idx"
      class="history"
      :class="msg.role === 'supplicant' ? 'supplicant' : 'oracle-hist'"
    >
      {{ msg.role === 'supplicant' ? '> ' + msg.text : msg.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useChat } from '../composables/useChat'

const { chatMessages } = useChat()
const historyEl = ref<HTMLElement | null>(null)

watch(
  () => chatMessages.value.length,
  async () => {
    await nextTick()
    if (historyEl.value) {
      historyEl.value.scrollTop = historyEl.value.scrollHeight
    }
  },
)
</script>
