import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    exclude: [...configDefaults.exclude, "tests/e2e/**"],
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    clearMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
