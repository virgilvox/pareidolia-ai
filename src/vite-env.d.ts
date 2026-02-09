/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  V: any
  VOID: any
  THREE: typeof import('three')
}

interface Navigator {
  gpu?: any
}
