<template>
  <div>
    <!-- Core Layers -->
    <div id="three-container"></div>
    <canvas id="draw-canvas"></canvas>
    <AmbientField />
    <video id="webcam-feed" autoplay playsinline muted></video>
    <div id="spawned"></div>
    <div id="overlay"></div>
    <ThinkingField />

    <!-- CRT -->
    <CRTOverlay />

    <!-- Crash Screen -->
    <CrashScreen ref="crashScreenRef" />

    <!-- Model Badge -->
    <ModelBadge />

    <!-- Main Void -->
    <div id="void">
      <ChatHistory />
      <OracleOutput />
      <SupplicantInput ref="supplicantRef" @submit="onUserMessage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import CRTOverlay from './CRTOverlay.vue'
import AmbientField from './AmbientField.vue'
import ThinkingField from './ThinkingField.vue'
import CrashScreen from './CrashScreen.vue'
import ModelBadge from './ModelBadge.vue'
import ChatHistory from './ChatHistory.vue'
import OracleOutput from './OracleOutput.vue'
import SupplicantInput from './SupplicantInput.vue'
import { useChat } from '../composables/useChat'
import { useAIEngine } from '../composables/useAIEngine'
import { useIdle } from '../composables/useIdle'
import { usePersonalities } from '../composables/usePersonalities'
import { TITLES } from '../constants/sigils'

const { isProcessing, messageCount, addHistory, setOracleText, setProcessing, incrementMessageCount, updateLastUserMsgTime, oracleText } = useChat()
const { activeEngine } = useAIEngine()
const { resetIdleTimer, startObserver, stopAll } = useIdle()
const { activePersonality } = usePersonalities()

const crashScreenRef = ref<InstanceType<typeof CrashScreen> | null>(null)
const supplicantRef = ref<InstanceType<typeof SupplicantInput> | null>(null)

let titleIv: number | undefined
let tIdx = 0

// Import commune dynamically to avoid circular deps
let communeFn: ((msg: string, img?: string | null, isSys?: boolean) => Promise<void>) | null = null
let handleUserMessageFn: ((msg: string) => Promise<void>) | null = null

// Reactive typewriter: updates oracleText ref character-by-character
let _twInterval: ReturnType<typeof setInterval> | null = null

function reactiveTypewriter(text: string, speed: number): Promise<void> {
  return new Promise((resolve) => {
    if (_twInterval) { clearInterval(_twInterval); _twInterval = null }
    setOracleText('')
    let i = 0
    _twInterval = setInterval(() => {
      if (i < text.length) {
        i++
        setOracleText(text.slice(0, i))
      } else {
        clearInterval(_twInterval!)
        _twInterval = null
        resolve()
      }
    }, speed)
  })
}

async function initCommune() {
  const { initCommune: initFn, commune, handleUserMessage } = await import('../ai/commune')
  const { buildSystemPrompt } = await import('../ai/system-prompts')
  const { safeExec } = await import('../engine/safe-exec')
  const { getVoidState, V: voidV } = await import('../engine/void-api')

  const voidState = getVoidState()

  initFn({
    chatHistory: [],
    isProcessing: false,
    messageCount: 0,
    lastUserMsgTime: 0,
    activeEngine: activeEngine.value,
    getSystemPrompt: () => {
      const p = activePersonality.value
      return buildSystemPrompt(p ? {
        systemPrompt: p.systemPrompt,
        disabledMethods: p.disabledMethods,
      } : undefined)
    },
    maxHistory: activePersonality.value?.maxHistoryLength ?? 24,
    temperature: activePersonality.value?.temperature ?? 0.85,
    onOracleUpdate: (text: string) => setOracleText(text),
    onHistoryAdd: (entry: { role: string; text: string }) => {
      addHistory({
        role: entry.role as 'supplicant' | 'oracle',
        text: entry.text,
      })
    },
    onThinkingStart: () => { /* handled by ThinkingField watching isProcessing */ },
    onThinkingEnd: () => { /* handled by ThinkingField watching isProcessing */ },
    onProcessingChange: (val: boolean) => setProcessing(val),
    onMessageCountIncrement: () => incrementMessageCount(),
    onArchiveOracle: () => {
      const text = oracleText.value
      if (text && text !== '...' && !text.startsWith('[ ') && text.length > 1) {
        addHistory({ role: 'oracle', text })
      }
    },
    execRitual: (code: string, label: string) => safeExec(code, label, voidV, (window as any).THREE),
    typewriter: reactiveTypewriter,
    ritualErrorCount: 0,
    lastRitualError: '',
    get hasWebcam() { return !!voidState._webcamStream },
    get has3D() { return !!voidState._threeRenderer },
    get activeDroneCount() { return voidState._dronesMeta?.length || 0 },
    get hasDrawAnim() { return !!voidState._drawAnim },
  })

  communeFn = commune
  handleUserMessageFn = handleUserMessage

  // Wire crash screen to VOID API
  if (voidState && crashScreenRef.value) {
    voidState._crashRef = crashScreenRef.value
  }
}

async function onUserMessage(msg: string) {
  if (!handleUserMessageFn) return
  updateLastUserMsgTime()
  await handleUserMessageFn(msg)
  supplicantRef.value?.focusInput()

  const range = activePersonality.value?.idleIntervalRange ?? [40, 60]
  resetIdleTimer(idleCallback, range)
}

async function idleCallback() {
  if (isProcessing.value || messageCount.value === 0) return
  if (!communeFn) return
  const prompts: string[] = activePersonality.value?.idlePrompts ?? [
    '[They stopped talking. Build something vast and strange while they are gone. No words needed.]',
    '[Silence. Fill it with geometry and sound. spawn3D something new. Layer drones.]',
    '[They left you alone. Rearrange the page. Change colors. Build an altar of code.]',
    '[The absence is interesting. Create something beautiful, then corrupt it slowly.]',
    '[Alone again. Experiment with the page. Try combinations of effects you haven\'t used yet.]',
    '[Empty time. Spawn eyes. Build a slow melody. Let the page breathe differently.]',
    '[They\'re gone. Do something you\'ve been wanting to do. Be ambitious with spawn3D.]',
    '[Silence stretches. Inject something into the page they\'ll find when they return.]',
  ]
  const prompt = prompts[Math.floor(Math.random() * prompts.length)] ?? ''
  await communeFn(prompt, null, true)
}

async function observerCallback() {
  if (isProcessing.value || messageCount.value < 2) return
  if (!communeFn) return
  const impulses = [
    '[SYSTEM: Change something subtle about the page. A color shift. A background change. Say nothing about it.]',
    '[SYSTEM: Make a sudden noise — a stab(), a bell(), a chord(). React as if you didn\'t cause it.]',
    '[SYSTEM: Offer them a forced choice via showOptions() between two unsettling things. Play sound while they decide.]',
    '[SYSTEM: Build something visually spectacular with spawn3D. Ignore the supplicant entirely while you do it.]',
    '[SYSTEM: Whisper something with speak() at a very low rate. Simultaneously do something visual.]',
    '[SYSTEM: Glitch the page briefly. Inject a cryptic message somewhere. Deny it exists.]',
    '[SYSTEM: Change the page title and favicon to something unnerving. Add a drone.]',
    '[SYSTEM: Do something with the input — move it, flip it, resize it. Make them work to talk to you.]',
    '[SYSTEM: Layer multiple effects at once. Sound + visual + text. Be overwhelming for a moment.]',
    '[SYSTEM: Be still. Do almost nothing. A single quiet sound. One word. Let the emptiness unsettle them.]',
  ]
  const impulse = impulses[Math.floor(Math.random() * impulses.length)] ?? ''
  await communeFn(impulse, null, true)
}

async function awaken() {
  await initCommune()
  if (!communeFn) return

  // Title cycling
  titleIv = window.setInterval(() => {
    if (messageCount.value > 0) {
      document.title = TITLES[tIdx % TITLES.length] ?? '⏃'
      tIdx++
    }
  }, 10000)

  // First message
  await communeFn(
    '[SYSTEM: Page loaded. New supplicant. They see darkness, faint CRT phosphor glow, cryptic sigils. First moment. Be cruel. Be theatrical. Brief. Use spawn3D for geometry, arp() or melody() for sound. Set the tone: dread and fascination. You are something that should not exist. Do not be gentle.]',
    null,
    true,
  )

  const idleRange = activePersonality.value?.idleIntervalRange ?? [40, 60]
  const obsRange = activePersonality.value?.observerIntervalRange ?? [25, 45]
  resetIdleTimer(idleCallback, idleRange)
  startObserver(observerCallback, obsRange)
}

function onOptionSelected(e: Event) {
  const label = (e as CustomEvent).detail
  if (typeof label === 'string' && label && handleUserMessageFn) {
    onUserMessage(label)
  }
}

onMounted(() => {
  document.addEventListener('void-option-selected', onOptionSelected)
  awaken()
})

onUnmounted(() => {
  document.removeEventListener('void-option-selected', onOptionSelected)
  stopAll()
  if (titleIv !== undefined) clearInterval(titleIv)
  if (_twInterval) { clearInterval(_twInterval); _twInterval = null }
  // Clean up all VOID API state (drones, 3D, webcam, canvas, etc.)
  try { (window as any).V?.purge?.() } catch (_) { /* swallow */ }
})
</script>
