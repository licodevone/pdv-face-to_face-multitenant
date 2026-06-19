import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  target: "es2024",
  platform: "node",
  external: ["@prisma/client", "@prisma/client/*"],
  sourcemap: true,
  clean: true,
  splitting: false,
});
