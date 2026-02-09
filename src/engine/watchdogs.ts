// ═══════════════════════════════════════
// Watchdog intervals — readability, input, crash screen, drone reaper
// ═══════════════════════════════════════

import { $$ } from './dom-helpers';
import { reapOldDrones } from './audio';

let _V: any = null;

export function setVProxy(v: any): void {
  _V = v;
}

export function initWatchdogs(isProcessingFn: () => boolean): void {
  // ── Readability watchdog ──
  var readabilityTimer = 0;
  setInterval(function () {
    var oracle = document.getElementById('oracle');
    if (!oracle) return;
    var oS = window.getComputedStyle(oracle);
    var unreadable = false;
    if (parseFloat(oS.fontSize) < 10) unreadable = true;
    if (oS.opacity === '0' || oS.visibility === 'hidden' || oS.display === 'none') unreadable = true;
    if (unreadable) {
      if (!readabilityTimer) readabilityTimer = Date.now();
      if (Date.now() - readabilityTimer > 8000) {
        oracle.style.fontSize = '';
        oracle.style.opacity = '';
        oracle.style.visibility = '';
        oracle.style.display = '';
        oracle.style.color = '';
        readabilityTimer = 0;
      }
    } else {
      readabilityTimer = 0;
    }
  }, 2000);

  // ── Input watchdog ──
  // Tracks two conditions independently:
  //   1. "gone" — input is hidden, offscreen, or too small. Recovery after 5s.
  //   2. "distorted" — input has extreme transforms (flip, spin, heavy rotation).
  //      Allowed for a bit of fun, auto-reset after 8s.
  var inputGoneAt = 0;
  var inputDistortedAt = 0;
  var INPUT_TIMEOUT = 5000;
  var DISTORT_TIMEOUT = 8000;
  setInterval(function () {
    var inp = document.getElementById('supplicant') as HTMLInputElement | null;
    var area = document.getElementById('input-area');
    if (!inp || !area) return;
    var gone = false;
    var distorted = false;
    try {
      var aS = window.getComputedStyle(area);
      var iS = window.getComputedStyle(inp);
      if (
        aS.display === 'none' || aS.visibility === 'hidden' || parseFloat(aS.opacity) < 0.1 ||
        iS.display === 'none' || iS.visibility === 'hidden' || parseFloat(iS.opacity) < 0.1
      ) gone = true;
      var rect = area.getBoundingClientRect();
      if (rect.right < 10 || rect.bottom < 10 || rect.left > window.innerWidth - 10 || rect.top > window.innerHeight - 10) gone = true;
      if (rect.width < 30 || rect.height < 10) gone = true;
      // Check for extreme transforms (flip, heavy rotation, scale to nothing)
      var tf = aS.transform;
      if (tf && tf !== 'none') {
        distorted = true;
      }
    } catch (e) {
      gone = true;
    }
    // Recovery from gone state (hidden, offscreen, too small)
    if (gone) {
      if (!inputGoneAt) inputGoneAt = Date.now();
      if (Date.now() - inputGoneAt > INPUT_TIMEOUT) {
        area.style.cssText = 'position:relative;transition:all 0.5s ease;min-height:2.8rem;display:block;visibility:visible;opacity:1;transform:none;';
        inp.style.cssText = 'background:transparent;border:none;border-bottom:1px solid #2a2a35;color:#999;font-family:IBM Plex Mono,monospace;font-size:1.1rem;font-weight:300;width:100%;max-width:55ch;padding:0.7rem 0;outline:none;caret-color:var(--glow);display:block;visibility:visible;opacity:1;';
        inp.disabled = false;
        inputGoneAt = 0;
        inputDistortedAt = 0;
      }
    } else {
      inputGoneAt = 0;
    }
    // Recovery from distorted state (transforms like flip, spin, etc.)
    if (distorted && !gone) {
      if (!inputDistortedAt) inputDistortedAt = Date.now();
      if (Date.now() - inputDistortedAt > DISTORT_TIMEOUT) {
        area.style.transform = '';
        area.style.transition = 'transform 0.5s ease';
        area.style.position = '';
        area.style.left = '';
        area.style.top = '';
        area.style.zIndex = '';
        inputDistortedAt = 0;
      }
    } else if (!distorted) {
      inputDistortedAt = 0;
    }
    if (inp.disabled && !isProcessingFn()) inp.disabled = false;
    var t = document.getElementById('thinking-status');
    if (t && !isProcessingFn()) t.remove();
  }, 1200);

  // ── Crash screen watchdog ──
  var crashWatchdog: number | null = null;
  setInterval(function () {
    var fc = document.getElementById('fake-crash');
    if (fc && fc.classList.contains('active')) {
      if (!crashWatchdog) crashWatchdog = Date.now();
      if (Date.now() - crashWatchdog > 10000) {
        if (_V) _V.uncrash();
        crashWatchdog = null;
      }
    } else {
      crashWatchdog = null;
    }
    $$('.void-error-overlay').forEach(function (el: any) {
      var born = parseInt(el.getAttribute('data-born') || '0');
      if (born && Date.now() - born > 12000) {
        try { el.remove(); } catch (e) { /* swallow */ }
      }
    });
  }, 3000);

  // ── Drone reaper ──
  setInterval(reapOldDrones, 5000);
}
