// ═══════════════════════════════════════
// AUDIO — all sound-related VOID methods
// ═══════════════════════════════════════

let _state: any = null;

export function setVoidState(state: any): void {
  _state = state;
}

let audioCtx: any = null;

export function ensureAudio(): any {
  try {
    if (!audioCtx)
      audioCtx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) { /* swallow */ }
  return audioCtx;
}

export function initAudioListeners(): void {
  document.addEventListener('click', ensureAudio);
  document.addEventListener('keydown', ensureAudio);
  document.addEventListener('touchstart', ensureAudio);
}

// ── drone bookkeeping ──

const MAX_DRONE_DURATION = 30000;
const MAX_CONCURRENT_DRONES = 6;

export function reapOldDrones(): void {
  if (!_state) return;
  var now = Date.now();
  var alive: any[] = [];
  _state._dronesMeta.forEach(function (d: any) {
    if (now - d.born > MAX_DRONE_DURATION) {
      try { d.stop(); } catch (e) { /* swallow */ }
    } else {
      alive.push(d);
    }
  });
  _state._dronesMeta = alive;
  _state._drones = alive.map(function (d: any) { return d.stop; });
  while (_state._dronesMeta.length > MAX_CONCURRENT_DRONES) {
    var oldest = _state._dronesMeta.shift();
    try { oldest.stop(); } catch (e) { /* swallow */ }
  }
  _state._drones = _state._dronesMeta.map(function (d: any) { return d.stop; });
}

function registerDrone(stopFn: () => void): () => void {
  if (!_state) return stopFn;
  var entry = { stop: stopFn, born: Date.now() };
  _state._dronesMeta.push(entry);
  _state._drones.push(stopFn);
  reapOldDrones();
  return stopFn;
}

// ── individual audio functions ──

export function sound(f: number, d?: number, t?: string): void {
  try {
    d = d || 0.5;
    t = t || 'sine';
    var a = ensureAudio();
    if (!a) return;
    var o = a.createOscillator(), g = a.createGain();
    o.type = t;
    o.frequency.setValueAtTime(f, a.currentTime);
    g.gain.setValueAtTime(0.15, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + d);
    o.connect(g);
    g.connect(a.destination);
    o.start();
    o.stop(a.currentTime + d);
  } catch (e) { /* swallow */ }
}

export function chord(freqs: number[], d?: number, t?: string): void {
  if (Array.isArray(freqs))
    freqs.forEach(function (f: number) { sound(f, d, t); });
}

export function noise(d?: number, v?: number): void {
  try {
    d = d || 1;
    v = v || 0.06;
    var a = ensureAudio();
    if (!a) return;
    var sz = a.sampleRate * d,
      buf = a.createBuffer(1, sz, a.sampleRate),
      dat = buf.getChannelData(0);
    for (var i = 0; i < sz; i++) dat[i] = Math.random() * 2 - 1;
    var src = a.createBufferSource(), g = a.createGain();
    src.buffer = buf;
    g.gain.setValueAtTime(v, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + d);
    src.connect(g);
    g.connect(a.destination);
    src.start();
  } catch (e) { /* swallow */ }
}

export function drone(f: number, t?: string, v?: number): () => void {
  try {
    t = t || 'sine';
    v = v || 0.04;
    var a = ensureAudio();
    if (!a) return function () {};
    var o = a.createOscillator(), g = a.createGain();
    o.type = t;
    o.frequency.setValueAtTime(f, a.currentTime);
    g.gain.setValueAtTime(v, a.currentTime);
    o.connect(g);
    g.connect(a.destination);
    o.start();
    var stop = function () {
      try {
        g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.5);
        setTimeout(function () { try { o.stop(); } catch (e) { /* swallow */ } }, 600);
      } catch (e) { /* swallow */ }
    };
    return registerDrone(stop);
  } catch (e) {
    return function () {};
  }
}

export function deepDrone(f: number, d?: number, v?: number): () => void {
  try {
    d = Math.min(d || 8, 25);
    v = v || 0.04;
    var a = ensureAudio();
    if (!a) return function () {};
    var master = a.createGain();
    master.gain.value = v;
    var lfo = a.createOscillator(), lfoG = a.createGain();
    lfo.frequency.value = 0.3;
    lfoG.gain.value = v * 0.5;
    lfo.connect(lfoG);
    lfoG.connect(master.gain);
    lfo.start();
    var oscs: any[] = [];
    [-7, -3, 0, 3, 7].forEach(function (dt: number) {
      var o = a.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.detune.value = dt;
      o.connect(master);
      o.start();
      oscs.push(o);
    });
    master.connect(a.destination);
    var stop = function () {
      try {
        master.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 1);
        setTimeout(function () {
          try { lfo.stop(); oscs.forEach(function (o: any) { o.stop(); }); } catch (e) { /* swallow */ }
        }, 1200);
      } catch (e) { /* swallow */ }
    };
    registerDrone(stop);
    if (d > 0) setTimeout(stop, d * 1000);
    return stop;
  } catch (e) {
    return function () {};
  }
}

export function sweep(f1: number, f2: number, d?: number, t?: string): void {
  try {
    d = d || 2;
    t = t || 'sine';
    var a = ensureAudio();
    if (!a) return;
    var o = a.createOscillator(), g = a.createGain();
    o.type = t;
    o.frequency.setValueAtTime(f1, a.currentTime);
    o.frequency.exponentialRampToValueAtTime(f2, a.currentTime + d);
    g.gain.setValueAtTime(0.1, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + d);
    o.connect(g);
    g.connect(a.destination);
    o.start();
    o.stop(a.currentTime + d);
  } catch (e) { /* swallow */ }
}

export function binaural(f: number, beat?: number, d?: number, v?: number): () => void {
  try {
    d = Math.min(d || 4, 20);
    v = v || 0.06;
    beat = beat || 4;
    var a = ensureAudio();
    if (!a) return function () {};
    var merger = a.createChannelMerger(2);
    var oL = a.createOscillator(), oR = a.createOscillator(),
      gL = a.createGain(), gR = a.createGain();
    oL.frequency.value = f;
    oR.frequency.value = f + beat;
    gL.gain.value = v;
    gR.gain.value = v;
    oL.connect(gL);
    oR.connect(gR);
    gL.connect(merger, 0, 0);
    gR.connect(merger, 0, 1);
    merger.connect(a.destination);
    oL.start();
    oR.start();
    var stop = function () {
      try {
        gL.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.3);
        gR.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.3);
        setTimeout(function () {
          try { oL.stop(); oR.stop(); } catch (e) { /* swallow */ }
        }, 400);
      } catch (e) { /* swallow */ }
    };
    registerDrone(stop);
    if (d > 0) setTimeout(stop, d * 1000);
    return stop;
  } catch (e) {
    return function () {};
  }
}

export function breath(d?: number, fq?: number, q?: number): void {
  try {
    d = d || 2;
    fq = fq || 800;
    q = q || 5;
    var a = ensureAudio();
    if (!a) return;
    var sz = a.sampleRate * d,
      buf = a.createBuffer(1, sz, a.sampleRate),
      dat = buf.getChannelData(0);
    for (var i = 0; i < sz; i++) dat[i] = Math.random() * 2 - 1;
    var src = a.createBufferSource(), flt = a.createBiquadFilter(), g = a.createGain();
    src.buffer = buf;
    flt.type = 'bandpass';
    flt.frequency.value = fq;
    flt.Q.value = q;
    g.gain.setValueAtTime(0, a.currentTime);
    g.gain.linearRampToValueAtTime(0.15, a.currentTime + d * 0.3);
    g.gain.linearRampToValueAtTime(0, a.currentTime + d);
    src.connect(flt);
    flt.connect(g);
    g.connect(a.destination);
    src.start();
  } catch (e) { /* swallow */ }
}

export function pulse(f: number, bpm?: number, d?: number, t?: string): () => void {
  try {
    d = Math.min(d || 4, 15);
    t = t || 'square';
    bpm = bpm || 120;
    var interval = 60 / bpm;
    var count = Math.floor(d / interval);
    var ids: any[] = [];
    for (var i = 0; i < count; i++) {
      (function (idx: number) {
        ids.push(setTimeout(function () { sound(f, interval * 0.3, t); }, idx * interval * 1000));
      })(i);
    }
    var stop = function () { ids.forEach(function (id: any) { clearTimeout(id); }); };
    registerDrone(stop);
    return stop;
  } catch (e) {
    return function () {};
  }
}

export function dissonance(f: number, d?: number, v?: number): void {
  try {
    d = d || 3;
    v = v || 0.05;
    var a = ensureAudio();
    if (!a) return;
    var o1 = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain();
    o1.type = 'sine';
    o2.type = 'sine';
    o1.frequency.value = f;
    o2.frequency.value = f * Math.pow(2, 1 / 17);
    g.gain.setValueAtTime(v, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + d);
    o1.connect(g);
    o2.connect(g);
    g.connect(a.destination);
    o1.start();
    o2.start();
    o1.stop(a.currentTime + d);
    o2.stop(a.currentTime + d);
  } catch (e) { /* swallow */ }
}

export function stab(f: number, v?: number): void {
  try {
    v = v || 0.2;
    var a = ensureAudio();
    if (!a) return;
    var o = a.createOscillator(), g = a.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f, a.currentTime);
    g.gain.setValueAtTime(v, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.15);
    o.connect(g);
    g.connect(a.destination);
    o.start();
    o.stop(a.currentTime + 0.2);
  } catch (e) { /* swallow */ }
}

export function scream(d?: number, v?: number): void {
  try {
    d = d || 1.5;
    v = v || 0.12;
    var a = ensureAudio();
    if (!a) return;
    var o = a.createOscillator(), g = a.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(200, a.currentTime);
    o.frequency.exponentialRampToValueAtTime(2000, a.currentTime + d * 0.3);
    o.frequency.exponentialRampToValueAtTime(100, a.currentTime + d);
    g.gain.setValueAtTime(v, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + d);
    o.connect(g);
    g.connect(a.destination);
    o.start();
    o.stop(a.currentTime + d);
  } catch (e) { /* swallow */ }
}

export function siren(d?: number, spd?: number, v?: number): void {
  try {
    d = d || 3;
    spd = spd || 2;
    v = v || 0.08;
    var a = ensureAudio();
    if (!a) return;
    var o = a.createOscillator(), lfo = a.createOscillator(),
      lfoG = a.createGain(), g = a.createGain();
    o.type = 'sine';
    o.frequency.value = 600;
    lfo.frequency.value = spd;
    lfoG.gain.value = 400;
    lfo.connect(lfoG);
    lfoG.connect(o.frequency);
    g.gain.setValueAtTime(v, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + d);
    o.connect(g);
    g.connect(a.destination);
    o.start();
    lfo.start();
    o.stop(a.currentTime + d);
    lfo.stop(a.currentTime + d);
  } catch (e) { /* swallow */ }
}

export function rumble(d?: number, v?: number): void {
  try {
    d = d || 2;
    v = v || 0.08;
    var a = ensureAudio();
    if (!a) return;
    var o = a.createOscillator(), g = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(30 + Math.random() * 20, a.currentTime);
    g.gain.setValueAtTime(v, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + d);
    o.connect(g);
    g.connect(a.destination);
    o.start();
    o.stop(a.currentTime + d);
  } catch (e) { /* swallow */ }
}

export function speak(text: string, rate?: number, pitch?: number): void {
  try {
    var u = new SpeechSynthesisUtterance(text);
    u.rate = rate || 0.7;
    u.pitch = pitch || 0.3;
    u.volume = 0.7;
    speechSynthesis.speak(u);
  } catch (e) { /* swallow */ }
}

export function arp(notes: number[], speed?: number, d?: number, t?: string): () => void {
  try {
    d = Math.min(d || 6, 20);
    speed = speed || 200;
    t = t || 'triangle';
    var ids: any[] = [];
    var total = Math.floor(d * 1000 / speed);
    for (var i = 0; i < total; i++) {
      (function (j: number) {
        ids.push(setTimeout(function () {
          sound(notes[j % notes.length]!, speed! / 1000 * 0.8, t);
        }, j * speed!));
      })(i);
    }
    var stop = function () { ids.forEach(function (id: any) { clearTimeout(id); }); };
    registerDrone(stop);
    setTimeout(stop, d * 1000);
    return stop;
  } catch (e) {
    return function () {};
  }
}

export function sequence(steps: any[], bpm?: number, loops?: number): () => void {
  try {
    bpm = bpm || 120;
    loops = Math.min(loops || 2, 8);
    var interval = 60 / bpm * 1000;
    var ids: any[] = [];
    var total = steps.length * loops;
    for (var i = 0; i < total; i++) {
      (function (j: number) {
        var step = steps[j % steps.length];
        ids.push(setTimeout(function () {
          if (step && step.f) sound(step.f, step.d || 0.2, step.t || 'sine');
        }, j * interval));
      })(i);
    }
    var stop = function () { ids.forEach(function (id: any) { clearTimeout(id); }); };
    registerDrone(stop);
    setTimeout(stop, total * interval);
    return stop;
  } catch (e) {
    return function () {};
  }
}

export function melody(notes: number[], tempo?: number, t?: string): () => void {
  try {
    tempo = tempo || 150;
    t = t || 'sine';
    var ids: any[] = [];
    var time = 0;
    notes.forEach(function (n: number) {
      ids.push(setTimeout(function () {
        if (n > 0) sound(n, tempo! / 1000 * 0.8, t);
      }, time));
      time += tempo!;
    });
    var stop = function () { ids.forEach(function (id: any) { clearTimeout(id); }); };
    registerDrone(stop);
    setTimeout(stop, time);
    return stop;
  } catch (e) {
    return function () {};
  }
}

export function chime(f?: number, count?: number, spacing?: number): () => void {
  try {
    count = count || 5;
    spacing = spacing || 300;
    f = f || 800;
    var ids: any[] = [];
    for (var i = 0; i < count; i++) {
      (function (j: number) {
        ids.push(setTimeout(function () {
          sound(f! * (1 + j * 0.12), 0.6, 'sine');
        }, j * spacing!));
      })(i);
    }
    return function () { ids.forEach(function (id: any) { clearTimeout(id); }); };
  } catch (e) {
    return function () {};
  }
}

export function glitchMusic(d?: number): () => void {
  try {
    d = Math.min(d || 3, 10);
    var ids: any[] = [];
    var count = Math.floor(d * 8);
    for (var i = 0; i < count; i++) {
      (function (j: number) {
        ids.push(setTimeout(function () {
          var f = 80 + Math.random() * 2000;
          var dur = 0.02 + Math.random() * 0.15;
          var types = ['sine', 'square', 'sawtooth', 'triangle'];
          sound(f, dur, types[Math.floor(Math.random() * 4)]);
        }, j * 125));
      })(i);
    }
    var stop = function () { ids.forEach(function (id: any) { clearTimeout(id); }); };
    setTimeout(stop, d * 1000);
    return stop;
  } catch (e) {
    return function () {};
  }
}

export function bell(f?: number, d?: number): void {
  try {
    f = f || 440;
    d = d || 2;
    var a = ensureAudio();
    if (!a) return;
    var o = a.createOscillator(), g = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, a.currentTime);
    g.gain.setValueAtTime(0.2, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + d);
    var o2 = a.createOscillator(), g2 = a.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(f * 2.76, a.currentTime);
    g2.gain.setValueAtTime(0.08, a.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, a.currentTime + d * 0.6);
    o.connect(g);
    o2.connect(g2);
    g.connect(a.destination);
    g2.connect(a.destination);
    o.start();
    o2.start();
    o.stop(a.currentTime + d);
    o2.stop(a.currentTime + d * 0.6);
  } catch (e) { /* swallow */ }
}

export function silence(): void {
  if (!_state) return;
  _state._dronesMeta.forEach(function (d: any) { try { d.stop(); } catch (e) { /* swallow */ } });
  _state._dronesMeta = [];
  _state._drones = [];
  try { speechSynthesis.cancel(); } catch (e) { /* swallow */ }
}

export function stopDrones(): void {
  silence();
}

export function stopAllDrones(): void {
  silence();
}

export function getAudioCtx(): any {
  return ensureAudio();
}
