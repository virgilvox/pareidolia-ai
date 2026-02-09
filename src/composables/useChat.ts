import { ref, type Ref } from 'vue'

export interface ChatEntry {
  role: 'supplicant' | 'oracle'
  text: string
}

const isProcessing = ref(false)
const oracleText = ref('')
const chatMessages: Ref<ChatEntry[]> = ref([])
const messageCount = ref(0)
const lastUserMsgTime = ref(0)

export function useChat() {
  function addHistory(entry: ChatEntry) {
    chatMessages.value.push(entry)
  }

  function setOracleText(text: string) {
    oracleText.value = text
  }

  function setProcessing(val: boolean) {
    isProcessing.value = val
  }

  function incrementMessageCount() {
    messageCount.value++
  }

  function updateLastUserMsgTime() {
    lastUserMsgTime.value = Date.now()
  }

  function clearChat() {
    chatMessages.value = []
    oracleText.value = ''
    messageCount.value = 0
  }

  return {
    isProcessing,
    oracleText,
    chatMessages,
    messageCount,
    lastUserMsgTime,
    addHistory,
    setOracleText,
    setProcessing,
    incrementMessageCount,
    updateLastUserMsgTime,
    clearChat,
  }
}
