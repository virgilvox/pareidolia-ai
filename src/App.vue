<template>
  <GateScreen v-if="!entered" @enter="onEnter" />
  <VoidShell v-else />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import GateScreen from './components/GateScreen.vue'
import VoidShell from './components/VoidShell.vue'

const entered = ref(false)

function onEnter() {
  entered.value = true
}
</script>
