/// <reference types="vite/client" />

// Optional: add strong typing for your variables
interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;   // or make it string if required
  readonly VITE_API_BASE2?: string;  // keep if you actually use this
  // add more VITE_* here
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
