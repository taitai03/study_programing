import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
    // "server-only" を読み込んでもエラーにならないようにする
    conditions: ["react-server"],
  },
  test: { environment: "node", include: ["src/**/*.test.ts", "content/**/*.test.ts"] },
});
