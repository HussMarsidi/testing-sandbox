import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts", "./tests/setup-msw.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/feature/**/*.test.tsx"],
    fileParallelism: false,
  },
});
