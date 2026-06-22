import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";
import { z } from "zod/v4";

// 1. Detecta de forma segura se a aplicação está rodando empacotada dentro do Electron (.msi)
const isElectronPackaged = process.versions.electron !== undefined && 
  (process as any).resourcesPath !== undefined;

const isProduction = process.env.NODE_ENV === "production";

// 2. Define fallbacks seguros para o ambiente desktop do cliente
const defaultDatabaseUrl = "postgresql://postgres:postgres@localhost:5432/pdv";
const defaultAuthSecret = "production-desktop-default-better-auth-secret-key-32chars";

// Tenta ler o .env na raiz do projeto em desenvolvimento de forma segura
try {
  let currentDir = "";
  if (typeof __dirname !== "undefined") {
    currentDir = __dirname;
  } else if (import.meta.url) {
    currentDir = dirname(fileURLToPath(import.meta.url));
  }
  config({ path: join(currentDir, "../.env") });
} catch (e) {
  // Ignora falhas de carregamento do .env em produção/desktop
}

const envSchema = z.object({
  // Se for produção WEB pura exige a URL. Se for no instalador Desktop (.msi), aceita o fallback local.
  DATABASE_URL: (isProduction && !isElectronPackaged)
    ? z.url()
    : z.url().default(defaultDatabaseUrl),
    
  PORT: z.coerce.number().int().positive().default(4949),
  HOST: z.string().min(1).default("0.0.0.0"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  
  // Mesma lógica: se for o instalador desktop do cliente, injeta um secret padrão válido de 32 caracteres
  BETTER_AUTH_SECRET: (isProduction && !isElectronPackaged)
    ? z.string().min(32)
    : z.string().min(32).default(defaultAuthSecret),
    
  BETTER_AUTH_URL: z.string().min(1).default("http://localhost:4949"),
  TRUSTED_ORIGINS: z.string().default("http://localhost:3000,http://localhost:4949"),
});

export const env = envSchema.parse(process.env);

export const trustedOrigins = env.TRUSTED_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);
