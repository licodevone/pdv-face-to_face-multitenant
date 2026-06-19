import { execFileSync } from "node:child_process";
import { accessSync, constants, readFileSync, readdirSync } from "node:fs";
import { userInfo } from "node:os";
import { join, resolve } from "node:path";

interface LinuxSessionInfo {
  id: string;
  type: string | null;
  display: string | null;
  desktop: string | null;
  state: string | null;
}

export interface LinuxDisplayConfig {
  env: NodeJS.ProcessEnv;
  ozonePlatform: string | null;
  source: string | null;
  session: LinuxSessionInfo | null;
  diagnostics: string[];
}

const readDirEntries = (directory: string) => {
  try {
    return readdirSync(directory);
  } catch {
    return [];
  }
};

const pathExists = (path: string) => {
  try {
    accessSync(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const pathIsReadable = (path: string) => {
  try {
    accessSync(path, constants.R_OK | constants.X_OK);
    return true;
  } catch {
    return false;
  }
};

const readCommandOutput = (command: string, args: string[]) => {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
};

const parseKeyValueOutput = (output: string | null) =>
  (output ?? "").split("\n").reduce<Record<string, string>>((accumulator, line) => {
    if (!line) {
      return accumulator;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      return accumulator;
    }

    const key = line.slice(0, separatorIndex);
    const value = line.slice(separatorIndex + 1);
    accumulator[key] = value;
    return accumulator;
  }, {});

const isWslEnvironment = () => Boolean(process.env.WSL_DISTRO_NAME?.trim());

const getWindowsPowershellPath = () =>
  "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe";

const getWindowsPowershellCommands = () => {
  const commands = ["powershell.exe"];
  const absolutePath = getWindowsPowershellPath();

  if (pathExists(absolutePath)) {
    commands.push(absolutePath);
  }

  return [...new Set(commands)];
};

const getWindowsXServerProcesses = () => {
  if (!isWslEnvironment()) {
    return [];
  }

  const commandArgs = [
    "-NoProfile",
    "-Command",
    [
      "$names = @(",
      "Get-Process -Name vcxsrv,Xming,X410,weston -ErrorAction SilentlyContinue",
      "| Select-Object -ExpandProperty ProcessName",
      ");",
      'if ($names.Count -gt 0) { $names -join [Environment]::NewLine } else { Write-Output "" };',
      "exit 0",
    ].join(" "),
  ];

  for (const command of getWindowsPowershellCommands()) {
    const output = readCommandOutput(command, commandArgs);
    if (!output) {
      continue;
    }

    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [];
};

const getWslHostIp = () => {
  if (!isWslEnvironment()) {
    return null;
  }

  try {
    const lines = readFileSync("/etc/resolv.conf", "utf8").split("\n");
    const nameserverLine = lines.find((line) => line.startsWith("nameserver "));
    return nameserverLine?.split(/\s+/)[1] ?? null;
  } catch {
    return null;
  }
};

const getSystemdUserEnvironment = (): NodeJS.ProcessEnv =>
  parseKeyValueOutput(readCommandOutput("systemctl", ["--user", "show-environment"]));

const getUserSessionIds = () => {
  const userId = String(userInfo().uid);
  const output = readCommandOutput("loginctl", [
    "show-user",
    userId,
    "-p",
    "Sessions",
    "--value",
  ]);

  if (!output) {
    return [];
  }

  return output.split(/\s+/).filter(Boolean);
};

const getSessionScore = (session: LinuxSessionInfo) => {
  let score = 0;

  if (session.state === "active") {
    score += 4;
  }

  if (session.type && session.type !== "tty") {
    score += 2;
  }

  if (session.display) {
    score += 1;
  }

  return score;
};

const getCurrentSessionInfo = (): LinuxSessionInfo | null => {
  const sessions = getUserSessionIds()
    .map((sessionId) => {
      const properties = parseKeyValueOutput(
        readCommandOutput("loginctl", [
          "show-session",
          sessionId,
          "-p",
          "Type",
          "-p",
          "Display",
          "-p",
          "Desktop",
          "-p",
          "State",
        ]),
      );

      if (Object.keys(properties).length === 0) {
        return null;
      }

      return {
        id: sessionId,
        type: properties.Type || null,
        display: properties.Display || null,
        desktop: properties.Desktop || null,
        state: properties.State || null,
      };
    })
    .filter((session): session is LinuxSessionInfo => session !== null)
    .sort((left, right) => getSessionScore(right) - getSessionScore(left));

  return sessions[0] ?? null;
};

const getWaylandRuntimeDirs = (env: NodeJS.ProcessEnv) => {
  const runtimeDirs = [env.XDG_RUNTIME_DIR];

  if (typeof process.getuid === "function") {
    runtimeDirs.push(`/run/user/${String(process.getuid())}`);
  }

  if (isWslEnvironment()) {
    runtimeDirs.push("/mnt/wslg/runtime-dir");

    if (typeof process.getuid === "function") {
      runtimeDirs.push(`/mnt/wslg/run/user/${String(process.getuid())}`);
    }
  }

  return [
    ...new Set(
      runtimeDirs
        .filter((value): value is string => Boolean(value?.trim()))
        .map((value) => resolve(value)),
    ),
  ];
};

const getWaylandSocket = (env: NodeJS.ProcessEnv) => {
  for (const runtimeDir of getWaylandRuntimeDirs(env)) {
    const socketName = readDirEntries(runtimeDir).find((entry) =>
      /^wayland-\d+$/.test(entry),
    );

    if (socketName) {
      return {
        runtimeDir,
        socketName,
        source: join(runtimeDir, socketName),
      };
    }
  }

  return null;
};

const getX11Display = () => {
  const x11Socket = readDirEntries("/tmp/.X11-unix").find((entry) =>
    /^X\d+$/.test(entry),
  );

  if (!x11Socket) {
    return null;
  }

  return {
    display: `:${x11Socket.slice(1)}`,
    source: `/tmp/.X11-unix/${x11Socket}`,
  };
};

const getWslX11Display = (windowsXServerProcesses: string[]) => {
  if (!isWslEnvironment() || windowsXServerProcesses.length === 0) {
    return null;
  }

  const hostIp = getWslHostIp();
  if (!hostIp) {
    return null;
  }

  return {
    display: `${hostIp}:0`,
    source: `Windows X server (${windowsXServerProcesses.join(", ")})`,
  };
};

export const getLinuxDisplayConfig = (): LinuxDisplayConfig => {
  if (process.platform !== "linux") {
    return {
      env: process.env,
      ozonePlatform: null,
      source: null,
      session: null,
      diagnostics: [],
    };
  }

  const systemdUserEnvironment = getSystemdUserEnvironment();
  const mergedEnvironment = {
    ...systemdUserEnvironment,
    ...process.env,
  };
  const session = getCurrentSessionInfo();
  const windowsXServerProcesses = getWindowsXServerProcesses();

  const configuredPlatform =
    process.env.PDV_OZONE_PLATFORM?.trim() ||
    systemdUserEnvironment.PDV_OZONE_PLATFORM?.trim();
  if (configuredPlatform) {
    return {
      env: mergedEnvironment,
      ozonePlatform: configuredPlatform,
      source: process.env.PDV_OZONE_PLATFORM?.trim()
        ? "PDV_OZONE_PLATFORM"
        : "systemctl --user show-environment: PDV_OZONE_PLATFORM",
      session,
      diagnostics: [],
    };
  }

  const waylandDisplay =
    process.env.WAYLAND_DISPLAY?.trim() ||
    systemdUserEnvironment.WAYLAND_DISPLAY?.trim();
  if (waylandDisplay) {
    return {
      env: mergedEnvironment,
      ozonePlatform: "wayland",
      source: process.env.WAYLAND_DISPLAY?.trim()
        ? "WAYLAND_DISPLAY"
        : "systemctl --user show-environment: WAYLAND_DISPLAY",
      session,
      diagnostics: [],
    };
  }

  const waylandSocket = getWaylandSocket(mergedEnvironment);
  if (waylandSocket) {
    return {
      env: {
        ...mergedEnvironment,
        XDG_RUNTIME_DIR: waylandSocket.runtimeDir,
        WAYLAND_DISPLAY: waylandSocket.socketName,
      },
      ozonePlatform: "wayland",
      source: waylandSocket.source,
      session,
      diagnostics: [],
    };
  }

  const display =
    process.env.DISPLAY?.trim() || systemdUserEnvironment.DISPLAY?.trim();
  if (display) {
    return {
      env: mergedEnvironment,
      ozonePlatform: "x11",
      source: process.env.DISPLAY?.trim()
        ? "DISPLAY"
        : "systemctl --user show-environment: DISPLAY",
      session,
      diagnostics: [],
    };
  }

  if (session?.display?.trim()) {
    return {
      env: {
        ...mergedEnvironment,
        DISPLAY: session.display.trim(),
      },
      ozonePlatform: "x11",
      source: `loginctl session ${session.id} Display`,
      session,
      diagnostics: [],
    };
  }

  const x11Display = getX11Display();
  if (x11Display) {
    return {
      env: {
        ...mergedEnvironment,
        DISPLAY: x11Display.display,
      },
      ozonePlatform: "x11",
      source: x11Display.source,
      session,
      diagnostics: [],
    };
  }

  const wslX11Display = getWslX11Display(windowsXServerProcesses);
  if (wslX11Display) {
    return {
      env: {
        ...mergedEnvironment,
        DISPLAY: wslX11Display.display,
      },
      ozonePlatform: "x11",
      source: wslX11Display.source,
      session,
      diagnostics: [],
    };
  }

  const diagnostics: string[] = [];

  if (isWslEnvironment()) {
    diagnostics.push(
      `Ambiente WSL detectado: ${process.env.WSL_DISTRO_NAME ?? "distribuição desconhecida"}.`,
    );

    if (process.env.WT_SESSION?.trim()) {
      diagnostics.push("O terminal atual veio do Windows Terminal/VS Code Remote.");
    }
  }

  if (session) {
    const sessionDetails = [
      `id=${session.id}`,
      `type=${session.type ?? "desconhecido"}`,
      `state=${session.state ?? "desconhecido"}`,
      session.desktop ? `desktop=${session.desktop}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    diagnostics.push(`Sessão detectada via loginctl: ${sessionDetails}.`);
  } else {
    diagnostics.push("Nenhuma sessão do usuário foi encontrada via loginctl.");
  }

  diagnostics.push(
    "WAYLAND_DISPLAY não está definido nem no shell nem no environment do systemd --user.",
  );
  diagnostics.push(
    "DISPLAY não está definido nem no shell nem no environment do systemd --user.",
  );

  const runtimeDirs = getWaylandRuntimeDirs(mergedEnvironment);
  diagnostics.push(
    runtimeDirs.length > 0
      ? `Nenhum socket Wayland foi encontrado em ${runtimeDirs.join(", ")}.`
      : "Nenhum diretório de runtime do usuário foi encontrado para procurar sockets Wayland.",
  );
  diagnostics.push("Nenhum socket X11 foi encontrado em /tmp/.X11-unix.");

  if (isWslEnvironment()) {
    const wslgUserRuntime =
      typeof process.getuid === "function"
        ? `/mnt/wslg/run/user/${String(process.getuid())}`
        : null;

    if (wslgUserRuntime && pathExists(wslgUserRuntime) && !pathIsReadable(wslgUserRuntime)) {
      diagnostics.push(
        `O runtime do WSLg existe em ${wslgUserRuntime}, mas o usuário atual não consegue acessá-lo.`,
      );
    }

    if (windowsXServerProcesses.length === 0) {
      diagnostics.push("Nenhum X server Windows (VcXsrv/Xming/X410) foi detectado em execução.");
    } else {
      const hostIp = getWslHostIp();
      diagnostics.push(
        hostIp
          ? `Um X server Windows foi detectado (${windowsXServerProcesses.join(", ")}); o DISPLAY esperado seria ${hostIp}:0.`
          : `Um X server Windows foi detectado (${windowsXServerProcesses.join(", ")}), mas não foi possível inferir o IP do host.`,
      );
    }
  }

  return {
    env: mergedEnvironment,
    ozonePlatform: null,
    source: null,
    session,
    diagnostics,
  };
};

export const formatLinuxDisplayError = (displayConfig: LinuxDisplayConfig) =>
  [
    "Nenhuma sessão gráfica detectada para abrir o Electron.",
    ...displayConfig.diagnostics.map((diagnostic) => `- ${diagnostic}`),
    displayConfig.env.WSL_DISTRO_NAME
      ? "- No WSL, habilite o WSLg ou inicie um X server no Windows e rode o comando no mesmo terminal."
      : "- Abra o projeto a partir de um terminal da sua sessão X11/Wayland ou exporte DISPLAY/WAYLAND_DISPLAY corretamente.",
  ].join("\n");

export const formatLinuxDisplaySkipMessage = (displayConfig: LinuxDisplayConfig) => {
  const sessionSummary = displayConfig.session?.type
    ? `a sessão atual é ${displayConfig.session.type}`
    : "nenhuma sessão gráfica foi identificada";

  return [
    "Backend e frontend prontos. Electron não foi iniciado.",
    `Neste ambiente, ${sessionSummary} e não há DISPLAY/WAYLAND utilizável.`,
    ...displayConfig.diagnostics.map((diagnostic) => `- ${diagnostic}`),
    displayConfig.env.WSL_DISTRO_NAME
      ? "No WSL, habilite o WSLg ou inicie um X server no Windows antes de rodar o desktop."
      : "Abra o comando em um terminal da sua sessão gráfica ou exporte DISPLAY/WAYLAND_DISPLAY antes de rodar o desktop.",
    "Para diagnosticar o desktop isoladamente, rode `pnpm dev:desktop`.",
  ].join("\n");
};
