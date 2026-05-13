import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 15000,
    clearMocks: true,
    restoreMocks: true,
    watch: false,
    pool: "threads",
    include: ["tests/smoke.test.js"],
    exclude: ["**/node_modules/**", "**/dist/**"],
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
