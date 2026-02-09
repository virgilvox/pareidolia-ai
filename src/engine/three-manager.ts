// ═══════════════════════════════════════
// THREE.js 3D scene management
// ═══════════════════════════════════════

import * as THREE from 'three';

let _state: any = null;

export function setVoidState(state: any): void {
  _state = state;
}

export function spawn3D(code: string): void {
  try {
    kill3D();
    var container = document.getElementById('three-container');
    if (!container) return;
    container.innerHTML = '';
    var r = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    r.setSize(window.innerWidth, window.innerHeight);
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    (r.domElement as HTMLElement).style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;';
    container.appendChild(r.domElement);
    var s = new THREE.Scene();
    var cam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cam.position.z = 5;
    if (_state) {
      _state._threeRenderer = r;
      _state._threeScene = s;
      _state._threeCamera = cam;
    }
    var fn = new Function('scene', 'camera', 'renderer', 'THREE', code);
    var animFn = fn(s, cam, r, THREE);
    var errs = 0;
    var loop = function () {
      if (_state) _state._threeAnim = requestAnimationFrame(loop);
      try {
        if (typeof animFn === 'function') animFn();
        r.render(s, cam);
        errs = 0;
      } catch (e) {
        errs++;
        if (errs > 5) {
          if (_state && _state._threeAnim) cancelAnimationFrame(_state._threeAnim);
          if (_state) _state._threeAnim = null;
        }
      }
    };
    loop();
  } catch (e) {
    kill3D();
  }
}

export function kill3D(): void {
  if (!_state) return;
  if (_state._threeAnim) cancelAnimationFrame(_state._threeAnim);
  _state._threeAnim = null;
  if (_state._threeRenderer) {
    try { _state._threeRenderer.dispose(); } catch (e) { /* swallow */ }
    try { _state._threeRenderer.forceContextLoss(); } catch (e) { /* swallow */ }
    try { _state._threeRenderer.domElement.remove(); } catch (e) { /* swallow */ }
  }
  _state._threeRenderer = null;
  _state._threeScene = null;
  _state._threeCamera = null;
}

export function stop3D(): void {
  kill3D();
}

export function clear3D(): void {
  kill3D();
}

export function handleResize(): void {
  if (!_state) return;
  if (_state._threeRenderer && _state._threeCamera) {
    try {
      _state._threeCamera.aspect = window.innerWidth / window.innerHeight;
      _state._threeCamera.updateProjectionMatrix();
      _state._threeRenderer.setSize(window.innerWidth, window.innerHeight);
    } catch (e) { /* swallow */ }
  }
}
