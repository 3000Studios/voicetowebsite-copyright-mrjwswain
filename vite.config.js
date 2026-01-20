import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
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
        blog: resolve(__dirname, "blog.html"),
        livestream: resolve(__dirname, "livestream.html"),
        gamezone: resolve(__dirname, "gamezone.html"),
        referrals: resolve(__dirname, "referrals.html"),
        projects: resolve(__dirname, "projects.html"),
        studio3000: resolve(__dirname, "studio3000.html"),
        the3000: resolve(__dirname, "the3000.html"),
        the3000gallery: resolve(__dirname, "the3000-gallery.html"),
        race3000: resolve(__dirname, "race3000.html"),
      },
    },
  },
});
