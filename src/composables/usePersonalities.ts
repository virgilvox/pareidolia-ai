import { ref, type Ref } from 'vue'
import type { Personality } from '../db/index'
import {
  getAllPersonalities,
  savePersonality,
  deletePersonality,
  clonePersonality,
  ensureDefaultPersonality,
  importPersonalities,
  exportPersonalities,
} from '../db/personality-store'

const personalities: Ref<Personality[]> = ref([])
const activePersonality: Ref<Personality | null> = ref(null)
const loaded = ref(false)

export function usePersonalities() {
  async function load() {
    await ensureDefaultPersonality()
    personalities.value = await getAllPersonalities()
    if (!activePersonality.value && personalities.value.length > 0) {
      activePersonality.value = personalities.value[0] ?? null
    }
    loaded.value = true
  }

  async function save(personality: Personality) {
    const id = await savePersonality(personality)
    personality.id = id
    await refreshList()
  }

  async function remove(id: number) {
    await deletePersonality(id)
    if (activePersonality.value?.id === id) {
      activePersonality.value = personalities.value.find((p) => p.id !== id) ?? null
    }
    await refreshList()
  }

  async function clone(id: number, newName: string) {
    await clonePersonality(id, newName)
    await refreshList()
  }

  function setActive(personality: Personality) {
    activePersonality.value = personality
  }

  async function refreshList() {
    personalities.value = await getAllPersonalities()
  }

  function exportAll(): string {
    return exportPersonalities(personalities.value)
  }

  async function importAll(json: string) {
    const imported = importPersonalities(json)
    for (const p of imported) {
      await savePersonality(p)
    }
    await refreshList()
  }

  return {
    personalities,
    activePersonality,
    loaded,
    load,
    save,
    remove,
    clone,
    setActive,
    exportAll,
    importAll,
  }
}
