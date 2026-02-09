import { ref, shallowRef } from 'vue'
import type { AIEngine } from '../ai/engine-interface'
import type { EngineConfig } from '../ai/engine-factory'

const activeEngine = shallowRef<AIEngine | null>(null)
const engineLoading = ref(false)
const engineError = ref('')
const engineProgress = ref(0)
const engineProgressText = ref('')
const engineName = ref('')
const engineIsLocal = ref(true)

export function useAIEngine() {
  async function initEngine(config: EngineConfig): Promise<boolean> {
    engineLoading.value = true
    engineError.value = ''
    engineProgress.value = 0
    engineProgressText.value = ''

    try {
      const { createEngine } = await import('../ai/engine-factory')
      const engine = createEngine(config)

      await engine.init((info) => {
        if (info.progress !== undefined) {
          engineProgress.value = Math.round(info.progress * 100)
        }
        if (info.text) {
          engineProgressText.value = info.text
          // Extract percentage from text if progress not provided
          if (info.progress === undefined) {
            const m = info.text.match(/(\d+)%/)
            if (m?.[1]) engineProgress.value = parseInt(m[1])
          }
        }
      })

      activeEngine.value = engine
      engineName.value = engine.name
      engineIsLocal.value = engine.isLocal
      engineLoading.value = false
      return true
    } catch (err: any) {
      engineError.value = err.message || 'Failed to initialize engine'
      engineLoading.value = false
      return false
    }
  }

  function destroyEngine() {
    if (activeEngine.value) {
      activeEngine.value.destroy()
      activeEngine.value = null
      engineName.value = ''
    }
  }

  return {
    activeEngine,
    engineLoading,
    engineError,
    engineProgress,
    engineProgressText,
    engineName,
    engineIsLocal,
    initEngine,
    destroyEngine,
  }
}
