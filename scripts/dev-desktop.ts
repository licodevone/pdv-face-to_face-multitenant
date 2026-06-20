import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDir, "..");
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

const isUrlAvailable = async (url: string) => {
  try {
    const res = await fetch(url);
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
};

const waitForUrl = async (url: string, name: string, maxAttempts = 60) => {
  for (let i = 1; i <= maxAttempts; i++) {
    if (await isUrlAvailable(url)) return;
    console.log(`Aguardando ${name}... (${i}/${maxAttempts})`);
    if (i < maxAttempts) await new Promise<void>((r) => setTimeout(r, 1_000));
  }
  throw new Error(`${name} não ficou disponível em ${url} após ${maxAttempts}s`);
};

try {
  await waitForUrl(frontendUrl, "frontend");
  console.log(`Frontend disponível em ${frontendUrl}. Abrindo Electron...`);
} catch (err) {
  console.warn(err instanceof Error ? err.message : String(err));
  console.warn("Abrindo Electron mesmo assim (exibirá página de erro interna).");
}

const desktopMain = resolve(projectRoot, "desktop/launcher.cjs");

const child = spawn("pnpm", ["exec", "electron", desktopMain], {
  stdio: "inherit",
  shell: process.platform === "win32",
  cwd: projectRoot,
  env: {
    ...process.env,
    FRONTEND_URL: frontendUrl,
    NODE_ENV: "development",
  },
});

child.on("error", (err) => {
  console.error("Falha ao iniciar Electron:", err.message);
  process.exit(1);
});

child.on("exit", (code) => process.exit(code ?? 0));
