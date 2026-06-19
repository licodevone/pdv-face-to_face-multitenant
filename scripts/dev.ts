import { spawn, type ChildProcess } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface ManagedProcess {
  name: string;
  child: ChildProcess;
  critical: boolean;
}

interface SpawnCommandInput {
  name: string;
  args: string[];
  critical?: boolean;
}

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDir, "..");
const managedProcesses: ManagedProcess[] = [];
let isShuttingDown = false;

const sleep = async (milliseconds: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const shutdown = (exitCode: number) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  managedProcesses.forEach(({ child }) => {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  });

  setTimeout(() => process.exit(exitCode), 500).unref();
};

const isUrlAvailable = async (url: string) => {
  try {
    const response = await fetch(url);
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
};

const spawnPnpm = ({ name, args, critical = true }: SpawnCommandInput) => {
  const child = spawn("pnpm", args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    cwd: projectRoot,
  });

  managedProcesses.push({ name, child, critical });

  child.on("exit", (code, signal) => {
    if (isShuttingDown) {
      return;
    }

    if (critical) {
      console.error(`${name} finalizou com code=${String(code)} signal=${String(signal)}`);
      shutdown(code ?? 1);
      return;
    }

    if (code !== 0) {
      console.error(`${name} finalizou com code=${String(code)} signal=${String(signal)}`);
      return;
    }

    console.log(`${name} finalizado.`);
  });
};

const waitForUrl = async ({ url, name }: { url: string; name: string }) => {
  for (let attempt = 1; attempt <= 90; attempt += 1) {
    if (await isUrlAvailable(url)) {
      return;
    }

    if (attempt < 90) {
      await sleep(1_000);
    }
  }

  throw new Error(`${name} não ficou disponível em ${url}`);
};

const ensureService = async ({
  name,
  args,
  url,
}: {
  name: string;
  args: string[];
  url: string;
}) => {
  if (await isUrlAvailable(url)) {
    console.log(`${name} já está disponível em ${url}. Reutilizando instância existente.`);
    return;
  }

  spawnPnpm({ name, args });
  await waitForUrl({ name, url });
};

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

try {
  await Promise.all([
    ensureService({
      name: "backend",
      args: ["dev:backend"],
      url: "http://localhost:4949/health",
    }),
    ensureService({
      name: "frontend",
      args: ["dev:frontend"],
      url: "http://localhost:3000",
    }),
  ]);

  console.log("Backend e frontend prontos.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Falha ao iniciar ambiente dev");
  shutdown(1);
}
