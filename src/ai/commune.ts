import { parseEntityResponse } from './response-parser';
import type { AIEngine, ChatMessage } from './engine-interface';

export interface CommuneState {
  chatHistory: ChatMessage[];
  isProcessing: boolean;
  messageCount: number;
  lastUserMsgTime: number;
  activeEngine: AIEngine | null;
  getSystemPrompt: () => string;
  onOracleUpdate: (text: string) => void;
  onHistoryAdd: (entry: { role: string; text: string }) => void;
  onThinkingStart: () => void;
  onThinkingEnd: () => void;
  onProcessingChange: (val: boolean) => void;
  /** Called when messageCount increments so Vue ref stays in sync */
  onMessageCountIncrement: () => void;
  /** Archive current oracle text to visible chat history before new response */
  onArchiveOracle: () => void;
  /** Execute a ritual string in the VOID sandbox. Returns empty string on success, error message on failure. */
  execRitual: (code: string, label: string) => string;
  /** Typewriter effect for the oracle. Resolves when complete. */
  typewriter: (text: string, speed: number) => Promise<void>;
  maxHistory: number;
  temperature: number;
  /** Context state flags for building context messages */
  hasWebcam: boolean;
  has3D: boolean;
  activeDroneCount: number;
  hasDrawAnim: boolean;
  /** Return current VOID.store data for game-state context, or null if empty */
  getStoreData?: () => Record<string, any> | null;
}

var state: CommuneState | null = null;

export function initCommune(s: CommuneState): void {
  state = s;
}

export function getCommuneState(): CommuneState | null {
  return state;
}

/**
 * Core chat loop. Sends a message through the active AI engine and processes the response.
 * Ported from the original commune() function (lines 531-587 of entity_local.html).
 */
export async function commune(userMessage: string, _imageData?: string | null, isSystem?: boolean): Promise<void> {
  if (!state) return;
  if (state.isProcessing) return;
  if (!state.activeEngine) return;

  state.isProcessing = true;
  state.onProcessingChange(true);

  // Thinking field — suppressed ~12% of the time for variety
  var suppressThinking = Math.random() < 0.12;

  if (!suppressThinking) {
    state.onThinkingStart();
  }

  // Add user message to history
  state.chatHistory.push({ role: 'user', content: userMessage });

  // Trim history to maxHistory entries (remove oldest pair)
  while (state.chatHistory.length > state.maxHistory) {
    state.chatHistory.splice(0, 2);
  }

  try {
    // Build message array with system prompt
    var messages: ChatMessage[] = [
      { role: 'system' as const, content: state.getSystemPrompt() },
      ...state.chatHistory,
    ];

    // Call the AI engine
    var rawText = await state.activeEngine.chat(messages, {
      maxTokens: 1024,
      temperature: state.temperature,
      topP: 0.9,
      cacheControl: true,
    });

    // Add assistant response to history
    state.chatHistory.push({ role: 'assistant', content: rawText });

    // Parse the response
    var parsed = parseEntityResponse(rawText);
    var utterance = parsed.utterance || '';
    var ritual = parsed.ritual || '';

    // End thinking animation
    if (!suppressThinking) {
      state.onThinkingEnd();
    }

    // Archive current oracle text to visible chat history before overwriting
    state.onArchiveOracle();

    // Display the utterance via typewriter effect
    if (utterance) {
      await state.typewriter(utterance, 22 + Math.random() * 25);
    } else {
      state.onOracleUpdate('');
    }

    // Execute the ritual code
    if (ritual) {
      var ritualErr = state.execRitual(ritual, 'ritual');
      if (ritualErr && state.activeEngine) {
        // Re-prompt LLM with error for self-correction (one attempt)
        var snippet = ritual.length > 120 ? ritual.slice(0, 120) + '...' : ritual;
        var correction = '[SYSTEM: Your ritual just failed with: "' + ritualErr +
          '". Code started with: "' + snippet +
          '". Rewrite the ritual with the same intent but valid syntax. ' +
          'Rules: do NOT wrap in function(). var only, no let/const/arrow. Semicolons. VOID API methods only. ' +
          'spawn3D code string MUST return function(){} for animation loop.]';
        state.chatHistory.push({ role: 'user', content: correction });
        try {
          var retryMessages: ChatMessage[] = [
            { role: 'system' as const, content: state.getSystemPrompt() },
            ...state.chatHistory,
          ];
          var retryRaw = await state.activeEngine.chat(retryMessages, {
            maxTokens: 1024,
            temperature: state.temperature,
            topP: 0.9,
          });
          state.chatHistory.push({ role: 'assistant', content: retryRaw });
          var retryParsed = parseEntityResponse(retryRaw);
          if (retryParsed.ritual) {
            var retryErr = state.execRitual(retryParsed.ritual, 'ritual-retry');
            if (retryErr) {
              state.execRitual('VOID.glitch(300);VOID.sound(80,0.3,"sawtooth");', 'fallback');
            }
          }
        } catch (retryE) {
          state.execRitual('VOID.glitch(300);VOID.sound(80,0.3,"sawtooth");', 'fallback');
        }
      }
    }

    state.messageCount++;
    state.onMessageCountIncrement();

  } catch (e: any) {
    console.error('LLM error:', e);
    // End thinking on error
    if (!suppressThinking) {
      state.onThinkingEnd();
    }
    state.onOracleUpdate('[ the vessel strains... ]');
    // Remove the failed user message from history
    state.chatHistory.pop();
  }

  state.isProcessing = false;
  state.onProcessingChange(false);
}

/**
 * Handle a user message with context enrichment.
 * Ported from the original handleUserMessage (lines 594-611 of entity_local.html).
 */
export async function handleUserMessage(msg: string): Promise<void> {
  if (!state) return;

  var prevTime = state.lastUserMsgTime;
  state.lastUserMsgTime = Date.now();

  // Add the user's message to visible history
  state.onHistoryAdd({ role: 'supplicant', text: msg });

  // Build context annotations — kept sparse to avoid driving repetitive behavior
  var contextMsg = msg;
  var states: string[] = [];

  if (state.hasWebcam) states.push('webcam active');
  if (state.has3D) states.push('3D scene running');
  if (state.activeDroneCount > 0) states.push(state.activeDroneCount + ' drones active');
  if (state.hasDrawAnim) states.push('2D canvas active');

  // Viewport context on first message
  if (state.messageCount === 0) {
    states.push('viewport ' + window.innerWidth + 'x' + window.innerHeight);
    if (window.innerWidth < 600) states.push('mobile device — keep effects sized for small screen');
  }

  // Only mention response timing for very long gaps, and rarely
  if (prevTime && state.messageCount > 0) {
    var gap = Math.floor((Date.now() - prevTime) / 1000);
    if (gap > 30 && Math.random() < 0.3) {
      states.push('long silence before this message');
    }
  }

  // Webcam context
  if (!state.hasWebcam && state.messageCount >= 1) {
    if (state.messageCount <= 3) {
      states.push('webcam not active — VOID.webcam.start() to request it');
    } else if (Math.random() < 0.25) {
      states.push('webcam still not active');
    }
  }

  // Game state from VOID.store
  if (state.getStoreData) {
    try {
      var storeData = state.getStoreData();
      if (storeData) {
        var storeKeys = Object.keys(storeData);
        if (storeKeys.length > 0) {
          // Truncate to 8 keys max
          var trimmed: Record<string, any> = {};
          for (var si = 0; si < Math.min(storeKeys.length, 8); si++) {
            trimmed[storeKeys[si]!] = storeData[storeKeys[si]!];
          }
          var json = JSON.stringify(trimmed);
          if (json.length > 200) json = json.slice(0, 200) + '...}';
          states.push('game state: ' + json);
        }
      }
    } catch (e) { /* swallow */ }
  }

  if (states.length > 0) {
    contextMsg += '\n[' + states.join(', ') + ']';
  }

  await commune(contextMsg, null);
}
