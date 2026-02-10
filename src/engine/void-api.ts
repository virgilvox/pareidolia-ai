// ═══════════════════════════════════════
// THE VOID API — assembler
// ═══════════════════════════════════════

import { mouseX, mouseY, initMouseTracking, safeInterval } from './dom-helpers';
import {
  setVoidState as setAudioState,
  initAudioListeners,
  ensureAudio,
  sound, chord, noise, drone, deepDrone, sweep, binaural, breath, pulse,
  dissonance, stab, scream, siren, rumble, speak, arp, sequence, melody,
  chime, glitchMusic, bell, silence, stopDrones, stopAllDrones, getAudioCtx,
} from './audio';
import {
  setVoidState as setEffectsState,
  setVProxy as setEffectsVProxy,
  shake, glitch, flashColor, blackout, strobe, rain, portal, eyes, fracture,
  heal, mirror, invert, hue, blur, crt, crtColor, morph, unmorph, cursor,
  title, favicon, bg, setBg, typewriter, scramble, gravity, float as floatFx,
  hideInput, showInput, moveInput, resetInput, flipInput, spinInput, resizeInput,
  showOptions, hideOptions, crash, uncrash, fakeError, bsod,
  inject, remove, css,
} from './effects';
import {
  setVoidState as setThreeState,
  spawn3D, kill3D, stop3D, clear3D, handleResize as threeHandleResize,
} from './three-manager';
import {
  setVoidState as setCanvasState,
  draw, drawLoop, killDraw, clearDraw, clearCanvas,
} from './canvas-manager';
import {
  setVoidState as setWebcamState,
  webcam,
} from './webcam';
import { safeExec, ritualErrorCount, lastRitualError, resetRitualErrorCount } from './safe-exec';
import { setVProxy as setWatchdogVProxy, initWatchdogs } from './watchdogs';

import * as THREE from 'three';

// ── internal state ──

export const _VOID: any = {
  _drones: [],
  _dronesMeta: [],
  _intervals: [],
  _timeouts: [],
  _listeners: [],
  _threeRenderer: null,
  _threeScene: null,
  _threeCamera: null,
  _threeAnim: null,
  _drawAnim: null,
  _webcamStream: null,
  _typewriterInterval: null,
  _crashTimeout: null,

  // ── Audio ──
  sound: sound,
  chord: chord,
  noise: noise,
  drone: drone,
  deepDrone: deepDrone,
  sweep: sweep,
  binaural: binaural,
  breath: breath,
  pulse: pulse,
  dissonance: dissonance,
  stab: stab,
  scream: scream,
  siren: siren,
  rumble: rumble,
  speak: speak,
  arp: arp,
  sequence: sequence,
  melody: melody,
  chime: chime,
  glitchMusic: glitchMusic,
  bell: bell,
  audioCtx: function () { return getAudioCtx(); },
  silence: silence,
  stopDrones: stopDrones,
  stopAllDrones: stopAllDrones,

  // ── Visual FX ──
  shake: shake,
  glitch: glitch,
  flashColor: flashColor,
  blackout: blackout,
  strobe: strobe,
  rain: rain,
  portal: portal,
  eyes: eyes,
  fracture: fracture,
  heal: heal,
  mirror: mirror,
  invert: invert,
  hue: hue,
  blur: blur,
  crt: crt,
  crtColor: crtColor,
  morph: morph,
  unmorph: unmorph,
  cursor: cursor,
  title: title,
  favicon: favicon,
  bg: bg,
  setBg: setBg,
  typewriter: typewriter,
  scramble: scramble,
  gravity: gravity,
  float: floatFx,

  // ── Input ──
  hideInput: hideInput,
  showInput: showInput,
  moveInput: moveInput,
  resetInput: resetInput,
  flipInput: flipInput,
  spinInput: spinInput,
  resizeInput: resizeInput,
  showOptions: showOptions,
  hideOptions: hideOptions,

  // ── 3D ──
  spawn3D: spawn3D,
  kill3D: kill3D,
  stop3D: stop3D,
  clear3D: clear3D,

  // ── 2D Canvas ──
  draw: draw,
  drawLoop: drawLoop,
  killDraw: killDraw,
  clearDraw: clearDraw,
  clearCanvas: clearCanvas,

  // ── Webcam ──
  webcam: webcam,

  // ── Scare ──
  crash: crash,
  uncrash: uncrash,
  fakeError: fakeError,
  bsod: bsod,

  // ── DOM helpers ──
  inject: inject,
  remove: remove,
  css: css,

  // ── Utility ──
  interval: function (fn: () => void, ms: number): number {
    var id = safeInterval(fn, ms);
    _VOID._intervals.push(id);
    return id;
  },
  clearInterval: function (id: number): void {
    clearInterval(id);
    _VOID._intervals = _VOID._intervals.filter(function (i: number) { return i !== id; });
  },
  setTimeout: function (fn: () => void, ms: number): number {
    return window.setTimeout(fn, ms);
  },
  on: function (ev: string, h: EventListener): void {
    document.addEventListener(ev, h);
    _VOID._listeners.push({ event: ev, handler: h });
  },
  off: function (ev: string, h: EventListener): void {
    try { document.removeEventListener(ev, h); } catch (e) { /* swallow */ }
  },
  exec: function (code: string): string {
    if (typeof code === 'string') {
      if (
        code.indexOf('document.body.innerHTML') !== -1 ||
        code.indexOf('document.write') !== -1 ||
        code.indexOf('.outerHTML') !== -1
      )
        return 'blocked: destructive DOM method';
    }
    return safeExec(code, 'exec', V, THREE);
  },

  purge: function (): void {
    var sp = document.getElementById('spawned');
    if (sp) sp.innerHTML = '';
    _VOID._dronesMeta.forEach(function (d: any) { try { d.stop(); } catch (e) { /* swallow */ } });
    _VOID._dronesMeta = [];
    _VOID._drones = [];
    _VOID._intervals.forEach(function (i: number) { clearInterval(i); });
    _VOID._intervals = [];
    _VOID._listeners.forEach(function (o: any) {
      try { document.removeEventListener(o.event, o.handler); } catch (e) { /* swallow */ }
    });
    _VOID._listeners = [];
    killDraw();
    kill3D();
    try { speechSynthesis.cancel(); } catch (e) { /* swallow */ }
  },
  clear: function (): void { _VOID.purge(); },
  reset: function (): void { _VOID.purge(); _VOID.heal(); },
};

// ── computed properties ──

Object.defineProperty(_VOID, 'width', { get: function () { return window.innerWidth; } });
Object.defineProperty(_VOID, 'height', { get: function () { return window.innerHeight; } });
Object.defineProperty(_VOID, 'hasWebcam', { get: function () { return !!_VOID._webcamStream; } });
Object.defineProperty(_VOID, 'has3D', { get: function () { return !!_VOID._threeRenderer; } });
Object.defineProperty(_VOID, 'mouseX', { get: function () { return mouseX; } });
Object.defineProperty(_VOID, 'mouseY', { get: function () { return mouseY; } });

// ── Proxy wrapper ──

export let V: any;

if (typeof Proxy !== 'undefined') {
  V = new Proxy(_VOID, {
    get: function (target: any, prop: string) {
      if (prop in target) return target[prop];
      return function () {};
    },
    set: function (target: any, prop: string, val: any) {
      target[prop] = val;
      return true;
    },
  });
} else {
  V = _VOID;
}

export const VOID = V;

// ── Wire up module-level state references ──

setAudioState(_VOID);
setEffectsState(_VOID);
setEffectsVProxy(V);
setThreeState(_VOID);
setCanvasState(_VOID);
setWebcamState(_VOID);
setWatchdogVProxy(V);

// ── Re-export for external use ──

export { safeExec, ritualErrorCount, lastRitualError, resetRitualErrorCount } from './safe-exec';
export { ensureAudio } from './audio';

// ── Initialization ──

export function getVoidState(): any {
  return _VOID;
}

export function initVoidApi(isProcessingFn?: () => boolean): void {
  initMouseTracking();
  initAudioListeners();
  initWatchdogs(isProcessingFn || (() => false));

  // Resize handler for THREE
  window.addEventListener('resize', threeHandleResize);
}
