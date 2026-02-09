<template>
  <div id="oracle">{{ oracleText || '' }}</div>
</template>

<script setup lang="ts">
import { useChat } from '../composables/useChat'

const { oracleText } = useChat()
</script>
