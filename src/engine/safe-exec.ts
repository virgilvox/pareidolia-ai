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
export function sanitizeCode(code: string): string {
  var s = code.trim();

  // Strip markdown code fences that leak through the response parser
  s = s.replace(/^```(?:javascript|js)?\s*/i, '').replace(/\s*```$/, '').trim();

  // Fix literal newlines inside string literals (the most common LLM error)
  s = fixNewlinesInStrings(s);

  // Bare anonymous function wrapper → IIFE
  // Matches: function(){...}, function (){...}, function(...){...}
  // Also handles broken self-invoke: function(){...}() → strip the () first
  if (/^function\s*\(/.test(s)) {
    // Strip broken self-invocation: }() or }(args) at end
    s = s.replace(/\}\s*\([^)]*\)\s*;?\s*$/, '}');
    var trimEnd = s.replace(/[\s;]*$/, '');
    if (trimEnd[trimEnd.length - 1] === '}') {
      s = '(' + trimEnd + ')();';
    } else {
      // LLM forgot closing brace — strip the wrapper, execute body directly
      s = s.replace(/^function\s*\([^)]*\)\s*\{?\s*/, '');
    }
  }

  // Arrow function wrapper → IIFE
  // Matches: () => {...}, ()=>{...}
  if (/^\(\s*\)\s*=>/.test(s)) {
    s = s.replace(/\}\s*\([^)]*\)\s*;?\s*$/, '}');
    var trimEnd2 = s.replace(/[\s;]*$/, '');
    if (trimEnd2[trimEnd2.length - 1] === '}') {
      s = '(' + trimEnd2 + ')();';
    }
  }

  // Convert let/const to var and arrow functions to regular functions,
  // but only OUTSIDE of string literals to avoid corrupting spawn3D code strings.
  s = transformOutsideStrings(s);

  return s;
}

/**
 * Apply let/const→var and arrow→function transformations only outside string literals.
 * Uses a character-level parser to track string context.
 */
function transformOutsideStrings(code: string): string {
  // Split code into segments: string literals (unchanged) and non-string code (transformed)
  var segments: string[] = [];
  var current = '';
  var inStr = false;
  var strChar = '';
  var esc = false;
  for (var i = 0; i < code.length; i++) {
    var ch = code[i]!;
    if (esc) { current += ch; esc = false; continue; }
    if (ch === '\\') { esc = true; current += ch; continue; }
    if (!inStr && (ch === "'" || ch === '"' || ch === '`')) {
      // Flush non-string segment, apply transforms
      if (current) segments.push(transformCodeSegment(current));
      current = ch;
      inStr = true;
      strChar = ch;
      continue;
    }
    if (inStr && ch === strChar) {
      current += ch;
      segments.push(current); // Push string literal unchanged
      current = '';
      inStr = false;
      continue;
    }
    current += ch;
  }
  if (current) segments.push(inStr ? current : transformCodeSegment(current));
  return segments.join('');
}

function transformCodeSegment(s: string): string {
  // Convert let/const to var
  s = s.replace(/\b(let|const)\s+/g, 'var ');
  // Convert arrow functions to regular functions
  s = s.replace(/\(\s*\)\s*=>\s*\{/g, 'function(){');
  s = s.replace(/\((\w+)\)\s*=>\s*\{/g, 'function($1){');
  s = s.replace(/(\w+)\s*=>\s*\{/g, 'function($1){');
  return s;
}

/**
 * Sanitize code that will be used as a function BODY (e.g. spawn3D code strings).
 * spawn3D wraps this in new Function('scene','camera','renderer','THREE', body),
 * so we need a raw body — no outer function/arrow/IIFE wrappers.
 *
 * LLM variants we handle:
 * 1. Raw body:           "var g=...; return function(){...}"              → pass through
 * 2. function(){}:       "function(){ var g=...; return function(){...} }" → extract body
 * 3. function(params){}:  "function(scene,camera,renderer,THREE){...}"    → extract body
 * 4. Named function:     "function setup(){...}"                          → extract body
 * 5. Missing close brace: "function(){ var g=...; return function(){...}" → extract body
 * 6. Arrow wrapper:      "() => { var g=...; return () => {...} }"        → extract body
 * 7. IIFE:               "(function(){...})()" or "(()=>{...})()"         → extract body
 * 8. Markdown fences:    "```js\n...\n```"                                → strip fences
 * 9. let/const/arrows inside body                                         → convert to var/function
 */
export function sanitizeCodeBody(code: string): string {
  var s = code.trim();

  // Strip markdown code fences
  s = s.replace(/^```(?:javascript|js)?\s*/i, '').replace(/\s*```$/, '').trim();

  // Fix literal newlines inside string literals
  s = fixNewlinesInStrings(s);

  // Strip IIFE wrapper: (function(...){...})(...) or (()=>{...})()
  var iife = s.match(/^\(\s*(function\s*\w*\s*\([^)]*\)\s*\{|(?:\(\s*\)|(?:\([^)]*\)))\s*=>\s*\{)/);
  if (iife) {
    // Remove leading ( and the function/arrow header
    s = s.replace(/^\(\s*/, '');
    // Will be handled by the function/arrow strippers below
    // Also strip trailing )(...) or )() invocation
    s = s.replace(/\)\s*\([^)]*\)\s*;?\s*$/, '');
  }

  // Strip function wrapper (named or anonymous, with any params)
  if (/^function[\s(]/.test(s)) {
    s = s.replace(/^function\s*\w*\s*\([^)]*\)\s*\{?\s*/, '');
    s = stripTrailingWrapperBrace(s);
  }

  // Strip arrow wrapper: () => {, (x) => {, or bare params => {
  if (/^(?:\(\s*(?:[^)]*)\s*\)|\w+)\s*=>\s*\{?/.test(s)) {
    s = s.replace(/^(?:\(\s*(?:[^)]*)\s*\)|\w+)\s*=>\s*\{?\s*/, '');
    s = stripTrailingWrapperBrace(s);
  }

  // Convert let/const and arrows outside strings
  s = transformOutsideStrings(s);

  return s;
}

/**
 * After stripping a function/arrow prefix, check if there's an extra closing brace
 * at the end that belonged to the wrapper. Uses brace counting outside strings.
 * If closes > opens, the trailing } is the wrapper's and should be removed.
 */
function stripTrailingWrapperBrace(s: string): string {
  var trimmed = s.replace(/[\s;]*$/, '');
  if (!trimmed || trimmed[trimmed.length - 1] !== '}') return s;

  // Count { and } outside string literals
  var depth = 0;
  var inStr = false;
  var strCh = '';
  var esc = false;
  for (var i = 0; i < trimmed.length; i++) {
    var ch = trimmed[i]!;
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (!inStr && (ch === "'" || ch === '"' || ch === '`')) { inStr = true; strCh = ch; continue; }
    if (inStr && ch === strCh) { inStr = false; continue; }
    if (inStr) continue;
    if (ch === '{') depth++;
    if (ch === '}') depth--;
  }
  // depth < 0 means more closes than opens — the trailing } is the wrapper's
  if (depth < 0) {
    return trimmed.slice(0, -1);
  }
  return s;
}

/**
 * Execute user-supplied code in a sandboxed Function scope.
 * Receives the V proxy and THREE as arguments.
 */
export function safeExec(code: string, label: string, V: any, THREE: any): string {
  try {
    if (typeof code === 'string') {
      if (
        code.indexOf('document.body.innerHTML') !== -1 ||
        code.indexOf('document.documentElement') !== -1 ||
        code.indexOf('document.write') !== -1 ||
        code.indexOf('.outerHTML') !== -1
      )
        return 'blocked: destructive DOM method';
      code = sanitizeCode(code);
    }
    var fn = new Function('VOID', 'V', 'THREE', 'mouseX', 'mouseY', '$', '$$', code);
    fn(V, V, THREE, mouseX, mouseY, $, $$);
    ritualErrorCount = 0;
    return '';
  } catch (e: any) {
    ritualErrorCount++;
    lastRitualError = e.message;
    console.error('[' + label + ']', e, '\n', code);
    return e.message;
  }
}

export function resetRitualErrorCount(): void {
  ritualErrorCount = 0;
}
