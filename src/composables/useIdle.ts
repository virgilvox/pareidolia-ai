import { ref } from 'vue'

const idleTimerId = ref<number | null>(null)
const observerTimerId = ref<number | null>(null)

export function useIdle() {
  function startIdleTimer(
    callback: () => Promise<void>,
    range: [number, number] = [40, 60],
  ) {
    stopIdleTimer()
    const delay = (range[0] + Math.random() * (range[1] - range[0])) * 1000
    idleTimerId.value = window.setTimeout(async () => {
      await callback()
      startIdleTimer(callback, range)
    }, delay)
  }

  function stopIdleTimer() {
    if (idleTimerId.value !== null) {
      clearTimeout(idleTimerId.value)
      idleTimerId.value = null
    }
  }

  function resetIdleTimer(
    callback: () => Promise<void>,
    range: [number, number] = [40, 60],
  ) {
    startIdleTimer(callback, range)
  }

  function startObserver(
    callback: () => Promise<void>,
    range: [number, number] = [25, 45],
    chance: number = 0.12,
  ) {
    stopObserver()
    const interval = (range[0] + Math.random() * (range[1] - range[0])) * 1000
    observerTimerId.value = window.setInterval(async () => {
      if (Math.random() < chance) {
        await callback()
      }
    }, interval)
  }

  function stopObserver() {
    if (observerTimerId.value !== null) {
      clearInterval(observerTimerId.value)
      observerTimerId.value = null
    }
  }

  function stopAll() {
    stopIdleTimer()
    stopObserver()
  }

  return {
    startIdleTimer,
    stopIdleTimer,
    resetIdleTimer,
    startObserver,
    stopObserver,
    stopAll,
  }
}
