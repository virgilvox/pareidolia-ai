// ═══════════════════════════════════════
// Safe code execution
// ═══════════════════════════════════════

import { mouseX, mouseY, $, $$ } from './dom-helpers';

export let ritualErrorCount = 0;
export let lastRitualError = '';

export const PROTECTED_SELS = ['body', 'html', '#void', '#spawned', 'script', '#key-gate', '#crt-effects'];

function _isProtected(s: string): boolean {
  if (!s) return false;
  for (var i = 0; i < PROTECTED_SELS.length; i++) {
    if (s === PROTECTED_SELS[i]) return true;
  }
  return false;
}

/**
 * Fix literal newlines inside JS string literals (single/double quoted).
 * LLMs generate JSON where \n in ritual code becomes real newlines after parsing,
 * which breaks any string that spans multiple lines (e.g. spawn3D code argument).
 */
function fixNewlinesInStrings(code: string): string {
  var result = '';
  var inStr = false;
  var strChar = '';
  var esc = false;
  for (var i = 0; i < code.length; i++) {
    var ch = code[i]!;
    if (esc) { result += ch; esc = false; continue; }
    if (ch === '\\') { esc = true; result += ch; continue; }
    if (!inStr && (ch === "'" || ch === '"')) { inStr = true; strChar = ch; result += ch; continue; }
    if (inStr && ch === strChar) { inStr = false; result += ch; continue; }
    if (inStr && ch === '\n') { result += '\\n'; continue; }
    if (inStr && ch === '\r') { continue; }
    result += ch;
  }
  return result;
}

/**
 * Sanitize LLM-generated code before execution.
 * Models produce various patterns that aren't valid in a Function body.
 */
function sanitizeCode(code: string): string {
  var s = code.trim();

  // Strip markdown code fences that leak through the response parser
  s = s.replace(/^```(?:javascript|js)?\s*/i, '').replace(/\s*```$/, '').trim();

  // Fix literal newlines inside string literals (the most common LLM error)
  s = fixNewlinesInStrings(s);

  // Bare anonymous function wrapper → IIFE
  // Matches: function(){...}, function (){...}, function(...){...}
  if (/^function\s*\(/.test(s) && s[s.length - 1] === '}') {
    s = '(' + s + ')();';
  }

  // Arrow function wrapper → IIFE
  // Matches: () => {...}, ()=>{...}
  if (/^\(\s*\)\s*=>/.test(s) && s[s.length - 1] === '}') {
    s = '(' + s + ')();';
  }

  // Convert let/const to var (models forget the "var only" rule)
  s = s.replace(/\b(let|const)\s+/g, 'var ');

  // Convert arrow functions inside code to regular functions
  // e.g. setTimeout(() => { ... }) → setTimeout(function() { ... })
  // Only handles simple cases to avoid breaking string literals
  s = s.replace(/\(\s*\)\s*=>\s*\{/g, 'function(){');
  s = s.replace(/\((\w+)\)\s*=>\s*\{/g, 'function($1){');
  s = s.replace(/(\w+)\s*=>\s*\{/g, 'function($1){');

  return s;
}

/**
 * Execute user-supplied code in a sandboxed Function scope.
 * Receives the V proxy and THREE as arguments.
 */
export function safeExec(code: string, label: string, V: any, THREE: any): boolean {
  try {
    if (typeof code === 'string') {
      if (
        code.indexOf('document.body.innerHTML') !== -1 ||
        code.indexOf('document.documentElement') !== -1 ||
        code.indexOf('document.write') !== -1 ||
        code.indexOf('.outerHTML') !== -1
      )
        return false;
      code = sanitizeCode(code);
    }
    var fn = new Function('VOID', 'V', 'THREE', 'mouseX', 'mouseY', '$', '$$', code);
    fn(V, V, THREE, mouseX, mouseY, $, $$);
    ritualErrorCount = 0;
    return true;
  } catch (e: any) {
    ritualErrorCount++;
    lastRitualError = e.message;
    console.error('[' + label + ']', e, '\n', code);
    return false;
  }
}

export function resetRitualErrorCount(): void {
  ritualErrorCount = 0;
}
