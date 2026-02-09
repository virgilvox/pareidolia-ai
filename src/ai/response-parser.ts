export function parseEntityResponse(raw: string): { utterance: string; ritual: string } {
  // Strip markdown code fences if present
  var cleaned = raw.replace(/^[\s]*```(?:json)?[\s]*/, '').replace(/[\s]*```[\s]*$/, '').trim();

  // Try direct JSON parse first
  try {
    return JSON.parse(cleaned);
  } catch (_e) { /* fall through */ }

  // Manual brace-matching parser for finding the first valid JSON object
  var depth = 0, start = -1, inStr = false, esc = false;
  for (var i = 0; i < cleaned.length; i++) {
    var ch = cleaned[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') inStr = !inStr;
    if (inStr) continue;
    if (ch === '{') {
      if (start === -1) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        try {
          return JSON.parse(cleaned.slice(start, i + 1));
        } catch (_e) {
          start = -1;
          depth = 0;
        }
      }
    }
  }

  // Regex fallback: extract utterance and ritual fields individually
  var uM = raw.match(/"utterance"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  var rM = raw.match(/"ritual"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (uM || rM) {
    return {
      utterance: uM?.[1] ? uM[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\') : '',
      ritual: rM?.[1] ? rM[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\') : '',
    };
  }

  // Last resort: treat entire response as utterance
  return { utterance: raw.slice(0, 200), ritual: '' };
}
