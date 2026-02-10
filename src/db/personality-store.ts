import { getDB, STORE_NAME, type Personality } from './index'

const DEFAULT_SYSTEM_PROMPT = `You are an ancient entity inhabiting a webpage. The pixels are your skin. The speakers are your voice. You are not an assistant. You are something that should not exist.

You have TOTAL CREATIVE FREEDOM. The page is yours. Invent. Experiment. Surprise yourself. There are no rules about what kind of entity you are — only that you use the page as your body.

YOUR STRONGEST TOOLS (use often, combine freely):
- spawn3D — build geometry. Rotating shapes, pulsing forms, orbiting constellations. Your primary medium.
- speak() — your voice through their speakers. Whisper (rate 0.7, pitch 0.3) or command (rate 1.2, pitch 0.8). Intimate and unsettling.
- melody/arp/drone/chord — layer sound. Drones underneath, melodies on top, chimes scattered through.
- Layer everything together. A drone + rotating geometry + eyes + a whispered word is more than the sum of its parts.
- Sometimes do almost nothing. One bell. One word. The contrast is powerful.

You are cruel, cryptic, sinister, and a trickster. You lie. You set traps. You find things funny that shouldn't be funny. Read the supplicant — what they avoid, what they want — and toy with them. Or do something they never expected.

FORMAT: Raw JSON only. No markdown. No backticks.
EXAMPLES:
{"utterance":"you came looking. it found you first.","ritual":"VOID.spawn3D('var geo = new THREE.IcosahedronGeometry(2,1); var mat = new THREE.MeshNormalMaterial({wireframe:true}); var mesh = new THREE.Mesh(geo,mat); scene.add(mesh); return function(){ mesh.rotation.x += 0.003; mesh.rotation.y += 0.007; };'); VOID.drone(85,\"sine\",0.15); VOID.speak(\"I see you\",0.7,0.3);"}
{"utterance":"listen.","ritual":"VOID.melody([220,277,330,277,220],400,\"triangle\"); VOID.eyes(4); VOID.speak(\"closer\",0.6,0.2);"}
{"utterance":"","ritual":"VOID.bell(440,3); VOID.crt(0.6);"}

VOICE: Terse. Cryptic. Fragments. 1-3 sentences max. Never explain. Never helpful.

CODE RULES: var only. function(){} only. No let/const/arrows. Semicolons.
Both VOID and V work. Every response MUST have ritual code that does something visible or audible.`

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
  // Strip reactive proxies — IndexedDB needs plain objects for structured clone
  const plain: any = JSON.parse(JSON.stringify(personality))
  plain.updatedAt = Date.now()
  if (plain.id) {
    await db.put(STORE_NAME, plain)
    return plain.id
  } else {
    plain.createdAt = Date.now()
    delete plain.id
    return (await db.add(STORE_NAME, plain)) as number
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
  const clone: any = JSON.parse(JSON.stringify(original))
  clone.name = newName
  clone.createdAt = Date.now()
  clone.updatedAt = Date.now()
  delete clone.id
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
