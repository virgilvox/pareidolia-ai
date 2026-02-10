// ═══════════════════════════════════════
// SAFE DOM helpers
// ═══════════════════════════════════════

export const DUMMY: any = {
  style: {},
  textContent: '',
  innerHTML: '',
  value: '',
  disabled: false,
  placeholder: '',
  classList: {
    add: function () {},
    remove: function () {},
    contains: function () { return false; },
    toggle: function () {},
  },
  appendChild: function () {},
  removeChild: function () {},
  remove: function () {},
  getBoundingClientRect: function () {
    return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
  },
  animate: function () {},
  setAttribute: function () {},
  getAttribute: function () { return ''; },
  addEventListener: function () {},
  removeEventListener: function () {},
  querySelectorAll: function () { return []; },
  querySelector: function () { return null; },
  insertAdjacentHTML: function () {},
  focus: function () {},
  blur: function () {},
  cloneNode: function () { return DUMMY; },
  parentNode: null,
  children: [],
  childNodes: [],
};

export function $(s: string): any {
  try { return document.querySelector(s) || DUMMY; } catch (e) { return DUMMY; }
}

export function $$(s: string): any[] {
  try {
    return Array.prototype.slice.call(document.querySelectorAll(s));
  } catch (e) {
    return [];
  }
}

export let mouseX = 0;
export let mouseY = 0;

export function initMouseTracking(): void {
  document.addEventListener('mousemove', function (e: MouseEvent) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  document.addEventListener(
    'touchmove',
    function (e: TouchEvent) {
      if (e.touches[0]) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
      }
    },
    { passive: true },
  );

  window.onerror = function () { return true; };
  window.addEventListener('unhandledrejection', function (e: PromiseRejectionEvent) {
    e.preventDefault();
  });
}

export function safeInterval(fn: () => void, ms: number): number {
  return window.setInterval(function () {
    try { fn(); } catch (e) { /* swallow */ }
  }, ms);
}
