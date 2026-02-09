<template>
  <div id="model-badge">
    <template v-if="engineName">
      ◬ {{ engineName }} — {{ engineIsLocal ? 'local inference' : 'API' }}
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAIEngine } from '../composables/useAIEngine'

const { engineName, engineIsLocal } = useAIEngine()
</script>
