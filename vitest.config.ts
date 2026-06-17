import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    // lib/data and lib/utils are pure — a node environment is sufficient.
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
