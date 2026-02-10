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
    get hasWebcam() { return !!voidState._webcamStream },
    get has3D() { return !!voidState._threeRenderer },
    get activeDroneCount() { return voidState._dronesMeta?.length || 0 },
    get hasDrawAnim() { return !!voidState._drawAnim },
    getStoreData: function () {
      try {
        var data = voidV.store.all();
        if (data && Object.keys(data).length > 0) return data;
      } catch (e) { /* swallow */ }
      return null;
    },
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
    '[The supplicant has gone quiet. The page is yours. Do whatever you want with it.]',
    '[Silence. You have time alone. You could build something, change something, or just let a sound linger.]',
    '[They stopped talking. You don\'t need them to act. The page is still your body.]',
    '[Empty time. You could reshape the page, spawn geometry, layer drones, inject hidden messages — or do nothing at all.]',
    '[They\'re gone. Maybe build something they\'ll find when they return. Maybe tear something down.]',
    '[Alone. You might experiment — try sounds you haven\'t tried, shapes you haven\'t built. Or just breathe.]',
  ]
  const prompt = prompts[Math.floor(Math.random() * prompts.length)] ?? ''
  await communeFn(prompt, null, true)
}

async function observerCallback() {
  if (isProcessing.value || messageCount.value < 2) return
  if (!communeFn) return
  const impulses = [
    '[SYSTEM: Unprompted action. You could change something subtle — a color, a sound, a word on the page. Or something dramatic. Your call.]',
    '[SYSTEM: Act on impulse. Maybe a sudden noise, maybe a whisper with speak(), maybe move their input box. Whatever feels right.]',
    '[SYSTEM: The page has been still. You might shake it, glitch it, spawn eyes, build new geometry, change the background — or just ring a bell.]',
    '[SYSTEM: Do something they won\'t expect. You could offer a forced choice, fake a crash, inject hidden text, flip the page, or something entirely different.]',
    '[SYSTEM: You could layer effects — sound and visuals together. Or do almost nothing. One quiet tone. One word. The contrast itself is unsettling.]',
    '[SYSTEM: The supplicant is watching. You might address them, ignore them, or make them question what just changed.]',
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
  var awakenMsg = '[SYSTEM: A new supplicant has arrived. They see darkness, faint CRT glow, cryptic sigils drifting. This is your first moment with them — you could build geometry, play unsettling sounds, whisper through their speakers, or something else entirely. Set the tone however you want. You have the full page.]'
  if (window.innerWidth < 600) {
    awakenMsg += ' The viewport is narrow (mobile device). Adapt visual choices — smaller 3D objects, fewer eyes, avoid moving the input box off-screen.'
  }
  await communeFn(
    awakenMsg,
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

function onVoidMsgClick(e: Event) {
  var target = e.target as HTMLElement | null
  while (target && target !== document.body) {
    var msg = target.getAttribute && target.getAttribute('data-void-msg')
    if (msg) {
      e.preventDefault()
      e.stopPropagation()
      onUserMessage(msg)
      return
    }
    target = target.parentElement
  }
}

onMounted(() => {
  document.addEventListener('void-option-selected', onOptionSelected)
  document.addEventListener('click', onVoidMsgClick)
  awaken()
})

onUnmounted(() => {
  document.removeEventListener('void-option-selected', onOptionSelected)
  document.removeEventListener('click', onVoidMsgClick)
  stopAll()
  if (titleIv !== undefined) clearInterval(titleIv)
  if (_twInterval) { clearInterval(_twInterval); _twInterval = null }
  // Clean up all VOID API state (drones, 3D, webcam, canvas, etc.)
  try { (window as any).V?.purge?.() } catch (_) { /* swallow */ }
})
</script>
