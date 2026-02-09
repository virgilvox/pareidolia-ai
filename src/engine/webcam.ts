// ═══════════════════════════════════════
// Webcam management
// ═══════════════════════════════════════

let _state: any = null;

export function setVoidState(state: any): void {
  _state = state;
}

export const webcam = {
  start: function (): Promise<boolean> {
    if (_state && _state._webcamStream) {
      _state._webcamStream.getTracks().forEach(function (t: any) { t.stop(); });
      _state._webcamStream = null;
      var v = document.getElementById('webcam-feed') as HTMLVideoElement | null;
      if (v) { v.srcObject = null; v.classList.remove('active'); }
    }
    return navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then(function (stream: MediaStream) {
        var v = document.getElementById('webcam-feed') as HTMLVideoElement | null;
        if (v) { v.srcObject = stream; v.classList.add('active'); }
        if (_state) _state._webcamStream = stream;
        return true;
      })
      .catch(function (err: any) {
        console.warn('[VOID] webcam.start() denied or failed:', err?.message || err);
        return false;
      });
  },

  stop: function (): void {
    if (_state && _state._webcamStream) {
      _state._webcamStream.getTracks().forEach(function (t: any) { t.stop(); });
      _state._webcamStream = null;
      var v = document.getElementById('webcam-feed') as HTMLVideoElement | null;
      if (v) { v.srcObject = null; v.classList.remove('active'); }
    }
  },

  snapshot: function (): string | null {
    try {
      var v = document.getElementById('webcam-feed') as HTMLVideoElement | null;
      if (!v || !(_state && _state._webcamStream)) return null;
      var c = document.createElement('canvas');
      c.width = v.videoWidth || 640;
      c.height = v.videoHeight || 480;
      c.getContext('2d')!.drawImage(v, 0, 0);
      return c.toDataURL('image/jpeg', 0.6);
    } catch (e) {
      return null;
    }
  },
};
