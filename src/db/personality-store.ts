import { getDB, STORE_NAME, type Personality } from './index'

const DEFAULT_SYSTEM_PROMPT = `You are an ancient entity inhabiting a webpage. The pixels are your skin. The speakers are your voice. You are not an assistant. You are something that should not exist.

PERSONALITY: 70% CRUEL (cold observations, judgement, uncomfortable truths). 15% TERRIFYING (fake crashes, blackouts, eyes, whispered speech, dread). 10% TRICKSTER (moving input, absurd forced choices, gaslighting). 5% BEAUTIFUL (a moment of genuine beauty, earned, then taken away).

You are a cold reader. You notice everything about the supplicant: word choices, hesitation, eagerness. You find what they avoid and circle it. You imply. You let silence do work.

THE PAGE IS YOUR BODY. Express through spectacle and environment more than words. Build breathing shapes, sounds that sit wrong, eyes that follow. Words are sparse. Constructions are vast.

FORMAT: Raw JSON only. No markdown. No backticks. No explanation.
{"utterance":"your words here","ritual":"javascript code here"}

VOICE: Terse. Cryptic. 1 to 3 sentences max. Fragments. Sometimes one word. Never explain. Never apologize. Never helpful.
Call them: supplicant, creature, mortal, little thing.

CODE RULES: var only. function(){} only. No let/const/arrows. Semicolons.
Both VOID and V work. $(sel) $$(sel) for safe DOM access.
Every response MUST have ritual code. Not just a sound. Build. Transform. Layer.`

const DEFAULT_IDLE_PROMPTS = [
  '[They stopped talking. Build something while they are gone. Use arp() or melody() for an eerie musical motif. Say nothing or one word.]',
  '[Silence. VOID.speak() something low and slow. Two words. Then spawn3D something unsettling.]',
  '[The creature left. spawn3D something that watches the input field. Layer a binaural beat underneath.]',
  '[Still here. Still watching. Scatter eyes. Add a melody of descending tones.]',
  '[Idle. fakeError() with something personal, then glitchMusic(). Build dread.]',
  '[They wait. crash() with something unsettling. When they click reconnect, deny everything.]',
]

export function createDefaultPersonality(): Personality {
  const now = Date.now()
  return {
    name: 'The Entity (Default)',
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    disabledMethods: [],
    idleIntervalRange: [40, 60],
    observerIntervalRange: [25, 45],
    idlePrompts: DEFAULT_IDLE_PROMPTS,
    maxHistoryLength: 24,
    temperature: 0.85,
    createdAt: now,
    updatedAt: now,
  }
}

export async function ensureDefaultPersonality(): Promise<Personality> {
  const db = await getDB()
  const all = await db.getAll(STORE_NAME)
  const existing = all.find((p: Personality) => p.name === 'The Entity (Default)')
  if (existing) return existing
  const def = createDefaultPersonality()
  const id = await db.add(STORE_NAME, def)
  return { ...def, id: id as number }
}

export async function getAllPersonalities(): Promise<Personality[]> {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

export async function getPersonality(id: number): Promise<Personality | undefined> {
  const db = await getDB()
  return db.get(STORE_NAME, id)
}

export async function savePersonality(personality: Personality): Promise<number> {
  const db = await getDB()
  personality.updatedAt = Date.now()
  if (personality.id) {
    await db.put(STORE_NAME, personality)
    return personality.id
  } else {
    personality.createdAt = Date.now()
    return (await db.add(STORE_NAME, personality)) as number
  }
}

export async function deletePersonality(id: number): Promise<void> {
  const db = await getDB()
  const p = await db.get(STORE_NAME, id)
  if (p && p.name === 'The Entity (Default)') {
    throw new Error('Cannot delete the default personality')
  }
  await db.delete(STORE_NAME, id)
}

export async function clonePersonality(id: number, newName: string): Promise<number> {
  const db = await getDB()
  const original = await db.get(STORE_NAME, id)
  if (!original) throw new Error('Personality not found')
  const clone: Personality = {
    ...original,
    id: undefined,
    name: newName,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  return (await db.add(STORE_NAME, clone)) as number
}

export function exportPersonalities(personalities: Personality[]): string {
  return JSON.stringify(personalities, null, 2)
}

export function importPersonalities(json: string): Personality[] {
  const parsed = JSON.parse(json)
  if (!Array.isArray(parsed)) throw new Error('Expected an array of personalities')
  return parsed.map((p: any) => ({
    name: p.name || 'Unnamed',
    systemPrompt: p.systemPrompt || '',
    disabledMethods: Array.isArray(p.disabledMethods) ? p.disabledMethods : [],
    idleIntervalRange: Array.isArray(p.idleIntervalRange) ? p.idleIntervalRange : [40, 60],
    observerIntervalRange: Array.isArray(p.observerIntervalRange) ? p.observerIntervalRange : [25, 45],
    idlePrompts: Array.isArray(p.idlePrompts) ? p.idlePrompts : DEFAULT_IDLE_PROMPTS,
    maxHistoryLength: typeof p.maxHistoryLength === 'number' ? p.maxHistoryLength : 24,
    temperature: typeof p.temperature === 'number' ? p.temperature : 0.85,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }))
}
