import { openDB, type IDBPDatabase } from 'idb'

export interface Personality {
  id?: number
  name: string
  systemPrompt: string
  disabledMethods: string[]
  idleIntervalRange: [number, number]
  observerIntervalRange: [number, number]
  idlePrompts: string[]
  maxHistoryLength: number
  temperature: number
  createdAt: number
  updatedAt: number
}

const DB_NAME = 'pareidolia'
const DB_VERSION = 1
const STORE_NAME = 'personalities'

let dbInstance: IDBPDatabase | null = null

export async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        })
        store.createIndex('name', 'name', { unique: true })
      }
    },
  })
  return dbInstance
}

export { STORE_NAME }
