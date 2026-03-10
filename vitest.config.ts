import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],

    testTimeout: 10000,
    clearMocks: true,
    restoreMocks: true,
    watch: false,
    pool: "threads",

    // Fix Node.js path issues for Windsurf/Vitest
    poolOptions: {
      threads: {
        isolate: false,
        singleThread: true,
      },
    },

    // Use node executable directly to avoid path issues
    exec: "node",
  },

  // Resolve configuration
  resolve: {
    alias: {
      "@": "./src",
      "@functions": "./functions",
      "@tests": "./tests",
    },
  },

  // Define global constants
  define: {
    "process.env.NODE_ENV": '"test"',
  },
});
