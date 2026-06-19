import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";
import { z } from "zod/v4";

const currentDir = dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";
const defaultDatabaseUrl = "postgresql://postgres:postgres@localhost:5432/pdv";
const defaultAuthSecret = "development-only-better-auth-secret-change-in-production";

config({ path: join(currentDir, "../.env") });

const envSchema = z.object({
  DATABASE_URL: isProduction
    ? z.url()
    : z.url().default(defaultDatabaseUrl),
  PORT: z.coerce.number().int().positive().default(4949),
  HOST: z.string().min(1).default("0.0.0.0"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BETTER_AUTH_SECRET: isProduction
    ? z.string().min(32)
    : z.string().min(16).default(defaultAuthSecret),
  BETTER_AUTH_URL: z.string().min(1).default("http://localhost:4949"),
  TRUSTED_ORIGINS: z.string().default("http://localhost:3000,http://localhost:4949"),
});

export const env = envSchema.parse(process.env);

export const trustedOrigins = env.TRUSTED_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);
