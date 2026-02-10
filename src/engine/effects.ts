// ═══════════════════════════════════════
// VISUAL EFFECTS — all DOM/CSS visual FX
// ═══════════════════════════════════════

import { $, $$ } from './dom-helpers';
import { SIGIL_SET } from '../constants/sigils';

// Selectors that should never be targeted by LLM-driven effects
var DANGEROUS_SELS: Record<string, boolean> = {
  'body': true, 'html': true, '*': true, ':root': true,
  '#void': true, '#three-container': true, '#draw-canvas': true,
  '#overlay': true, '#spawned': true, '#crt-effects': true,
  '#fake-crash': true, '#model-badge': true, '#key-gate': true,
  'script': true, 'style': true, 'head': true,
};

function isDangerousSel(s: string): boolean {
  if (!s) return true;
  var trimmed = s.trim().toLowerCase();
  return !!DANGEROUS_SELS[trimmed];
}

let _state: any = null;

export function setVoidState(state: any): void {
  _state = state;
}

// Needs access to the assembled V proxy for methods like V.uncrash, V.hideOptions, V.killDraw, V.kill3D, V.heal, V.typewriter
let _V: any = null;

export function setVProxy(v: any): void {
  _V = v;
}

function isMobile(): boolean {
  return window.innerWidth < 600;
}

// ── VISUAL FX ──

export function shake(n?: number, d?: number): void {
  n = n || 10;
  d = d || 500;
  var st = Date.now(), b = document.body;
  var loop = function () {
    if (Date.now() - st > d!) { b.style.transform = ''; return; }
    requestAnimationFrame(loop);
    b.style.transform = 'translate(' + (Math.random() - 0.5) * n! + 'px,' + (Math.random() - 0.5) * n! + 'px)';
  };
  loop();
}

export function glitch(d?: number): void {
  d = d || 800;
  document.body.classList.add('glitching');
  setTimeout(function () { document.body.classList.remove('glitching'); }, d);
}

export function flashColor(c: string, d?: number): void {
  d = d || 200;
  var o = document.getElementById('overlay');
  if (!o) return;
  o.style.backgroundColor = c;
  o.style.opacity = '0.7';
  o.style.transition = 'opacity ' + d + 'ms ease';
  setTimeout(function () { if (o) o.style.opacity = '0'; }, d);
}

export function blackout(d?: number): void {
  d = Math.min(d || 2000, 8000);
  var o = document.getElementById('overlay');
  if (!o) return;
  o.style.backgroundColor = '#000';
  o.style.opacity = '1';
  o.style.transition = 'opacity 0.2s';
  setTimeout(function () {
    if (o) { o.style.opacity = '0'; o.style.transition = 'opacity 0.8s'; }
  }, d);
}

export function strobe(d?: number, sp?: number): void {
  d = Math.min(d || 1500, 3000);
  sp = sp || 80;
  var o = document.getElementById('overlay');
  if (!o) return;
  var on = false;
  var iv = setInterval(function () {
    on = !on;
    o!.style.backgroundColor = on ? '#fff' : 'transparent';
    o!.style.opacity = on ? '0.5' : '0';
  }, sp);
  setTimeout(function () {
    clearInterval(iv);
    if (o) { o.style.opacity = '0'; o.style.backgroundColor = ''; }
  }, d);
}

export function rain(ch?: string, d?: number): void {
  ch = ch || '\u25EC\u27C1\u27D0\u29BF\u29EB';
  d = d || 5000;
  var sp = document.getElementById('spawned');
  if (!sp) return;
  var spacing = isMobile() ? 18 : 24;
  var cols = Math.min(Math.floor(window.innerWidth / spacing), isMobile() ? 20 : 40);
  var els: any[] = [];
  for (var i = 0; i < cols; i++) {
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:' + i * spacing + 'px;top:' + -Math.random() * 200 + 'px;color:rgba(200,247,197,0.4);font-family:monospace;font-size:14px;pointer-events:none;z-index:100;';
    sp.appendChild(el);
    els.push({ el: el, y: -Math.random() * 200, spd: 1.5 + Math.random() * 4 });
  }
  var start = Date.now();
  var loop = function () {
    if (Date.now() - start > d!) {
      els.forEach(function (o: any) { try { o.el.remove(); } catch (e) { /* swallow */ } });
      return;
    }
    requestAnimationFrame(loop);
    for (var j = 0; j < els.length; j++) {
      var o = els[j];
      o.y += o.spd;
      if (o.y > window.innerHeight) o.y = -20;
      o.el.style.top = o.y + 'px';
      if (Math.random() < 0.15) o.el.textContent = ch![Math.floor(Math.random() * ch!.length)];
    }
  };
  loop();
}

export function portal(c1?: string, c2?: string): () => void {
  c1 = c1 || '#7b68ee';
  c2 = c2 || '#c8f7c5';
  var style = document.createElement('style');
  style.textContent = '@keyframes voidPortal{from{filter:hue-rotate(0deg)}to{filter:hue-rotate(360deg)}}';
  document.head.appendChild(style);
  document.body.style.background = 'conic-gradient(from 0deg,' + c1 + ',' + c2 + ',' + c1 + ')';
  document.body.style.animation = 'voidPortal 4s linear infinite';
  return function () {
    document.body.style.background = 'var(--bg)';
    document.body.style.animation = '';
    try { style.remove(); } catch (e) { /* swallow */ }
  };
}

export function eyes(n?: number): void {
  n = Math.min(n || 5, 50);
  var sp = document.getElementById('spawned');
  if (!sp) return;
  for (var i = 0; i < n; i++) {
    var e = document.createElement('div');
    e.className = 'eye-spawned';
    var eyeSize = isMobile() ? 15 + Math.random() * 20 : 20 + Math.random() * 35;
    e.style.cssText = 'left:' + Math.random() * 85 + 'vw;top:' + Math.random() * 85 + 'vh;font-size:' + eyeSize + 'px;opacity:' + (0.15 + Math.random() * 0.45) + ';';
    e.textContent = '\uD83D\uDC41';
    sp.appendChild(e);
    (function (eye: HTMLElement) {
      var h = function (ev: MouseEvent) {
        try {
          var r = eye.getBoundingClientRect();
          var a = Math.atan2(ev.clientY - r.top - r.height / 2, ev.clientX - r.left - r.width / 2);
          eye.style.transform = 'rotate(' + a * 180 / Math.PI + 'deg)';
        } catch (e) { /* swallow */ }
      };
      document.addEventListener('mousemove', h);
      if (_state) _state._listeners.push({ event: 'mousemove', handler: h });
    })(e);
  }
}

export function fracture(): void {
  var v = document.getElementById('void');
  if (!v) return;
  var pts: string[] = [];
  for (var i = 0; i < 6; i++) pts.push(Math.random() * 100 + '% ' + Math.random() * 100 + '%');
  v.style.clipPath = 'polygon(' + pts.join(',') + ')';
  setTimeout(function () { if (v) v.style.clipPath = ''; }, 6000);
}

export function heal(): void {
  var v = document.getElementById('void');
  if (v) { v.style.clipPath = ''; v.style.filter = ''; v.style.transform = ''; v.style.background = ''; }
  document.body.style.transform = '';
  document.body.style.filter = '';
  document.body.style.background = 'var(--bg)';
  document.body.style.cursor = '';
}

export function mirror(): void {
  document.body.style.transform = document.body.style.transform === 'scaleX(-1)' ? '' : 'scaleX(-1)';
}

export function invert(): void {
  document.body.style.filter = document.body.style.filter === 'invert(1)' ? '' : 'invert(1)';
}

export function hue(d: number): void {
  document.body.style.filter = 'hue-rotate(' + d + 'deg)';
  setTimeout(function () { document.body.style.filter = ''; }, 8000);
}

export function blur(p: number): void {
  var v = document.getElementById('void');
  if (v) {
    v.style.filter = 'blur(' + p + 'px)';
    setTimeout(function () { v!.style.filter = ''; }, 5000);
  }
}

export function crt(intensity: number): void {
  var ef = document.getElementById('crt-effects');
  if (!ef) return;
  if (intensity <= 0) { ef.style.display = 'none'; }
  else { ef.style.display = ''; ef.style.opacity = String(Math.min(intensity, 1)); }
}

export function crtColor(c: string): void {
  var ef = document.getElementById('crt-effects');
  if (ef) ef.style.boxShadow = 'inset 0 0 150px ' + c;
}

export function morph(): void {
  $$('#void > *').forEach(function (el: any) {
    try {
      if (el.id === 'input-area') return;
      el.style.position = 'fixed';
      el.style.left = Math.random() * 70 + 'vw';
      el.style.top = Math.random() * 70 + 'vh';
      el.style.transform = 'rotate(' + (Math.random() - 0.5) * 60 + 'deg)';
    } catch (e) { /* swallow */ }
  });
  setTimeout(function () { unmorph(); }, 8000);
}

export function unmorph(): void {
  $$('#void > *').forEach(function (el: any) {
    try {
      el.style.position = '';
      el.style.left = '';
      el.style.top = '';
      el.style.transform = '';
    } catch (e) { /* swallow */ }
  });
}

export function cursor(t: string): void {
  document.body.style.cursor = t;
}

export function title(t: string): void {
  document.title = t;
}

export function favicon(e: string): void {
  try {
    var l: any = document.querySelector("link[rel*='icon']") || document.createElement('link');
    l.rel = 'icon';
    l.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>" + e + "</text></svg>";
    document.head.appendChild(l);
  } catch (e) { /* swallow */ }
}

export function bg(v: string): void {
  document.body.style.background = v;
}

export function setBg(v: string): void {
  var el = document.getElementById('void');
  if (el) el.style.background = v;
}

export function typewriter(text: string, target?: string, speed?: number): Promise<void> {
  return new Promise(function (resolve) {
    if (_state && _state._typewriterInterval) clearInterval(_state._typewriterInterval);
    target = target || '#oracle';
    speed = speed || 35;
    var el = document.querySelector(target);
    if (!el) { resolve(); return; }
    el.textContent = '';
    var i = 0;
    var iv = setInterval(function () {
      if (i < text.length) {
        el!.textContent += text[i];
        i++;
      } else {
        clearInterval(iv);
        if (_state) _state._typewriterInterval = null;
        resolve();
      }
    }, speed);
    if (_state) _state._typewriterInterval = iv;
  });
}

export function scramble(s: string, d?: number): void {
  if (isDangerousSel(s)) return;
  d = d || 1200;
  var el: Element | null;
  try { el = document.querySelector(s); } catch (e) { return; }
  if (!el) return;
  var orig = el.textContent || '';
  var gl = SIGIL_SET.slice(0, 15).join('');
  var st = Date.now();
  var iv = setInterval(function () {
    var p = (Date.now() - st) / d!;
    if (p >= 1) { el!.textContent = orig; clearInterval(iv); return; }
    el!.textContent = orig.split('').map(function (c: string, idx: number) {
      return idx / orig.length < p ? c : c === ' ' ? ' ' : gl[Math.floor(Math.random() * gl.length)];
    }).join('');
  }, 40);
}

export function gravity(s: string): void {
  if (isDangerousSel(s)) return;
  $$(s).forEach(function (el: any) {
    try {
      el.animate(
        [{ transform: 'translateY(0)' }, { transform: 'translateY(' + window.innerHeight + 'px) rotate(' + Math.random() * 360 + 'deg)', opacity: 0 }],
        { duration: 1200, fill: 'forwards' as FillMode, easing: 'ease-in' },
      );
    } catch (e) { /* swallow */ }
  });
}

export function float(s: string): void {
  if (isDangerousSel(s)) return;
  $$(s).forEach(function (el: any) {
    try {
      el.animate(
        [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-' + window.innerHeight + 'px)', opacity: 0 }],
        { duration: 2000, fill: 'forwards' as FillMode, easing: 'ease-out' },
      );
    } catch (e) { /* swallow */ }
  });
}

export function hideInput(): void {
  var el = document.getElementById('input-area');
  if (el) el.style.display = 'none';
}

export function showInput(): void {
  var el = document.getElementById('input-area');
  var inp = document.getElementById('supplicant') as HTMLInputElement | null;
  if (el) { el.style.display = ''; el.style.visibility = 'visible'; el.style.opacity = '1'; }
  if (inp) { inp.style.display = ''; inp.disabled = false; }
}

export function moveInput(x: number, y: number): void {
  var el = document.getElementById('input-area');
  if (el) {
    x = Math.max(0, Math.min(x, window.innerWidth - (isMobile() ? 80 : 200)));
    y = Math.max(0, Math.min(y, window.innerHeight - 60));
    el.style.position = 'fixed';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.zIndex = '500';
  }
}

export function resetInput(): void {
  var el = document.getElementById('input-area');
  if (el) { el.style.position = ''; el.style.left = ''; el.style.top = ''; el.style.zIndex = ''; el.style.transform = ''; }
}

export function flipInput(): void {
  var el = document.getElementById('input-area');
  if (el) el.style.transform = 'scaleY(-1)';
}

export function spinInput(d?: number): void {
  var el = document.getElementById('input-area');
  if (el) el.style.transform = 'rotate(' + (d || 180) + 'deg)';
}

export function resizeInput(w: number | string): void {
  var el = document.getElementById('supplicant');
  if (el) el.style.width = typeof w === 'number' ? w + 'px' : w;
}

export function showOptions(opts: string[]): void {
  if (!Array.isArray(opts)) return;
  var inp = document.getElementById('supplicant') as HTMLInputElement | null;
  var oa = document.getElementById('options-area');
  if (!inp || !oa) return;
  inp.style.display = 'none';
  oa.innerHTML = '';
  oa.classList.add('active');
  opts.forEach(function (label: string) {
    var btn = document.createElement('button');
    btn.textContent = label;
    btn.addEventListener('click', function () {
      hideOptions();
      // handleUserMessage is in the app layer; dispatch a custom event
      var evt = new CustomEvent('void-option-selected', { detail: label });
      document.dispatchEvent(evt);
    });
    oa!.appendChild(btn);
  });
  setTimeout(function () { if (oa!.classList.contains('active')) hideOptions(); }, 15000);
}

export function hideOptions(): void {
  var inp = document.getElementById('supplicant');
  var oa = document.getElementById('options-area');
  if (inp) inp.style.display = '';
  if (oa) { oa.classList.remove('active'); oa.innerHTML = ''; }
}

// ── scare effects ──

export function crash(opts?: any): void {
  // Use Vue CrashScreen component if available
  if (_state && _state._crashRef && typeof _state._crashRef.crash === 'function') {
    _state._crashRef.crash(opts);
    return;
  }
  // Fallback: direct DOM manipulation
  opts = opts || {};
  var fc = document.getElementById('fake-crash');
  if (!fc) return;
  var dur = Math.min(opts.duration || 6000, 10000);
  var qi = fc.querySelector('.ci');
  var qt = fc.querySelector('.ct');
  var qb = fc.querySelector('.cb');
  var qc = fc.querySelector('.cc');
  var qx = fc.querySelector('.cx');
  if (qi) qi.textContent = opts.icon || '\u25EC';
  if (qt) qt.textContent = opts.title || 'FATAL EXCEPTION';
  if (qb) qb.textContent = opts.body || 'The entity encountered an irrecoverable error.';
  if (qc) qc.textContent = opts.code || '0xDEAD_FEED :: SIGVOID';
  if (qx) qx.textContent = opts.button || 'attempt reconnection';
  fc.classList.add('active');
  if (_state) {
    _state._crashTimeout = setTimeout(function () { uncrash(); }, dur);
  }
}

export function uncrash(): void {
  // Use Vue CrashScreen component if available
  if (_state && _state._crashRef && typeof _state._crashRef.uncrash === 'function') {
    _state._crashRef.uncrash();
    return;
  }
  // Fallback: direct DOM manipulation
  var fc = document.getElementById('fake-crash');
  if (fc) {
    fc.classList.add('fading');
    setTimeout(function () { fc!.classList.remove('active', 'fading'); }, 800);
  }
  if (_state && _state._crashTimeout) {
    clearTimeout(_state._crashTimeout);
    _state._crashTimeout = null;
  }
}

export function fakeError(msg?: string, dur?: number): void {
  dur = Math.min(dur || 5000, 8000);
  var d = document.createElement('div');
  d.className = 'void-error-overlay';
  d.setAttribute('data-born', String(Date.now()));
  d.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#1a1a1a;color:#c55;font-family:"IBM Plex Mono",monospace;font-size:0.9rem;padding:0.8rem 1.2rem;z-index:9300;border-bottom:1px solid #c55;animation:fadeIn 0.3s;cursor:pointer;';
  d.innerHTML = '<span style="color:#f66;margin-right:0.5rem">\u27C1</span> ' + (msg || 'Uncaught ReferenceError: reality is not defined');
  d.addEventListener('click', function () { try { d.remove(); } catch (e) { /* swallow */ } });
  document.body.appendChild(d);
  setTimeout(function () {
    try {
      d.style.opacity = '0';
      d.style.transition = 'opacity 0.5s';
      setTimeout(function () { try { d.remove(); } catch (e) { /* swallow */ } }, 500);
    } catch (e) { /* swallow */ }
  }, dur);
}

export function bsod(text?: string, dur?: number): void {
  dur = Math.min(dur || 8000, 12000);
  var d = document.createElement('div');
  d.className = 'void-error-overlay';
  d.setAttribute('data-born', String(Date.now()));
  var mob = isMobile();
  d.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#0037DA;color:#fff;font-family:"IBM Plex Mono",monospace;z-index:9300;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:' + (mob ? '2rem' : '4rem') + ';text-align:center;cursor:pointer;';
  d.innerHTML = '<div style="font-size:' + (mob ? '2.5rem' : '4rem') + ';margin-bottom:2rem">:(</div><div style="font-size:' + (mob ? '0.9rem' : '1.1rem') + ';max-width:50ch;line-height:1.8">' + (text || 'Your session ran into a problem.') + '</div><div class="pct" style="margin-top:2rem;font-size:0.9rem;opacity:0.5">0% complete</div>';
  d.addEventListener('click', function () {
    try { d.style.opacity = '0'; d.style.transition = 'opacity 0.5s'; setTimeout(function () { try { d.remove(); } catch (e) { /* swallow */ } }, 500); } catch (e) { /* swallow */ }
  });
  document.body.appendChild(d);
  var pct = 0, pctEl = d.querySelector('.pct');
  var iv = setInterval(function () {
    pct += Math.floor(Math.random() * 15) + 1;
    if (pct > 100) pct = 100;
    if (pctEl) pctEl.textContent = pct + '% complete';
  }, dur! / 12);
  setTimeout(function () {
    clearInterval(iv);
    try {
      d.style.opacity = '0';
      d.style.transition = 'opacity 0.8s';
      setTimeout(function () { try { d.remove(); } catch (e) { /* swallow */ } }, 800);
    } catch (e) { /* swallow */ }
  }, dur);
}

// ── simple DOM manipulation helpers (referenced in system prompt) ──

export function inject(html: string): void {
  var sp = document.getElementById('spawned');
  if (sp) sp.insertAdjacentHTML('beforeend', html);
}

export function remove(sel: string): void {
  if (isDangerousSel(sel)) return;
  $$(sel).forEach(function (el: any) {
    try { el.remove(); } catch (e) { /* swallow */ }
  });
}

export function css(sel: string, prop: string, val: string): void {
  if (isDangerousSel(sel)) return;
  $$(sel).forEach(function (el: any) {
    try { el.style[prop] = val; } catch (e) { /* swallow */ }
  });
}
