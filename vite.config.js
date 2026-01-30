import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Route API calls to the local Cloudflare Worker (`wrangler dev`).
      "/api/orchestrator": "http://127.0.0.1:8787",
      "/admin/logs": "http://127.0.0.1:8787",
      "/api/analytics": "http://127.0.0.1:8787",
    },
  },
  build: {
    target: "esnext",
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        admin: resolve(__dirname, "admin/index.html"),
        adminVoice: resolve(__dirname, "admin/voice-commands.html"),
        adminAnalytics: resolve(__dirname, "admin/analytics.html"),
        adminLive: resolve(__dirname, "admin/live-stream.html"),
        adminStore: resolve(__dirname, "admin/store-manager.html"),
        adminAppStore: resolve(__dirname, "admin/app-store-manager.html"),
        store: resolve(__dirname, "store.html"),
        appstore: resolve(__dirname, "appstore.html"),
        webforge: resolve(__dirname, "webforge.html"),
        rushPercussion: resolve(__dirname, "rush-percussion.html"),
        blog: resolve(__dirname, "blog.html"),
        contact: resolve(__dirname, "contact.html"),
        gallery: resolve(__dirname, "gallery.html"),
        legal: resolve(__dirname, "legal.html"),
        copyrights: resolve(__dirname, "copyrights.html"),
        livestream: resolve(__dirname, "livestream.html"),
        referrals: resolve(__dirname, "referrals.html"),
        projects: resolve(__dirname, "projects.html"),
        studio3000: resolve(__dirname, "studio3000.html"),
        the3000: resolve(__dirname, "the3000.html"),
        the3000gallery: resolve(__dirname, "the3000-gallery.html"),
        neuralEngine: resolve(__dirname, "neural-engine.html"),
        strataDesignSystem: resolve(__dirname, "strata-design-system.html"),
        apiDocumentation: resolve(__dirname, "api-documentation.html"),
        voiceToJson: resolve(__dirname, "voice-to-json.html"),
        geologicalStudies: resolve(__dirname, "geological-studies.html"),
        privacy: resolve(__dirname, "privacy.html"),
        terms: resolve(__dirname, "terms.html"),
        lexiconPro: resolve(__dirname, "lexicon-pro.html"),
      },
    },
  },
});
