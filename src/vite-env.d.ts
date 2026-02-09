/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINIAPIKEY2: string;
  readonly VITE_PAYPAL_CLIENT_ID?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  // Add other env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
