import { fileURLToPath } from "node:url";
import path from "node:path";

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // Playwright specs run under `playwright test`, not Vitest.
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
    pool: "threads",
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "src"),
    },
  },
});
