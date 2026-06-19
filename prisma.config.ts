import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";
import { defineConfig } from "prisma/config";

const currentDir = dirname(fileURLToPath(import.meta.url));
const defaultDatabaseUrl = "postgresql://postgres:postgres@localhost:5432/pdv";

config({ path: join(currentDir, ".env") });

const databaseUrl =
  process.env.DATABASE_URL ??
  (process.env.NODE_ENV === "production" ? undefined : defaultDatabaseUrl);

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required in production");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
