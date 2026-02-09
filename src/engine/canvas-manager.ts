// ═══════════════════════════════════════
// 2D Canvas drawing management
// ═══════════════════════════════════════

let _state: any = null;

export function setVoidState(state: any): void {
  _state = state;
}

export function draw(code: string): void {
  try {
    var c = document.getElementById('draw-canvas') as HTMLCanvasElement | null;
    if (!c) return;
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    var ctx = c.getContext('2d');
    new Function('ctx', 'w', 'h', code)(ctx, c.width, c.height);
  } catch (e) { /* swallow */ }
}

export function drawLoop(code: string): void {
  killDraw();
  try {
    var c = document.getElementById('draw-canvas') as HTMLCanvasElement | null;
    if (!c) return;
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    var ctx = c.getContext('2d');
    var frame = 0, errs = 0;
    var fn = new Function('ctx', 'w', 'h', 'frame', code);
    var loop = function () {
      if (_state) _state._drawAnim = requestAnimationFrame(loop);
      try {
        fn(ctx, c!.width, c!.height, frame++);
        errs = 0;
      } catch (e) {
        errs++;
        if (errs > 5) {
          if (_state && _state._drawAnim) cancelAnimationFrame(_state._drawAnim);
          if (_state) _state._drawAnim = null;
        }
      }
    };
    loop();
  } catch (e) { /* swallow */ }
}

export function killDraw(): void {
  if (_state && _state._drawAnim) cancelAnimationFrame(_state._drawAnim);
  if (_state) _state._drawAnim = null;
  try {
    var c = document.getElementById('draw-canvas') as HTMLCanvasElement | null;
    if (c) c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
  } catch (e) { /* swallow */ }
}

export function clearDraw(): void {
  killDraw();
}

export function clearCanvas(): void {
  killDraw();
}
