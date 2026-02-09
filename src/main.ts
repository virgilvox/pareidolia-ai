import { createApp } from 'vue'
import App from './App.vue'
import * as THREE from 'three'
import { initVoidApi, V, VOID } from './engine/void-api'
import { useChat } from './composables/useChat'

// Import all styles
import './styles/base.css'
import './styles/crt.css'
import './styles/void.css'
import './styles/gate.css'
import './styles/thinking.css'
import './styles/crash.css'
import './styles/ambient.css'
import './styles/editor.css'

// Expose globals for VOID API rituals
window.THREE = THREE
window.V = V
window.VOID = VOID

// Suppress uncaught errors from entity rituals
window.onerror = () => true
window.addEventListener('unhandledrejection', (e) => e.preventDefault())

// Initialize the VOID API with processing state for watchdogs
const { isProcessing } = useChat()
initVoidApi(() => isProcessing.value)

// Mount Vue app
createApp(App).mount('#app')
