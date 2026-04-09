/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_DEFAULT_TEMPLATE_ID?: string;
  readonly VITE_DISCOVERY_WEBHOOK_URL?: string;
  readonly VITE_REVISION_WEBHOOK_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

