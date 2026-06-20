import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { BrowserWindow, app, ipcMain } from "electron";

import { startCardPayment } from "./hardware/card-terminal-adapter.js";
import type { CardPaymentInput } from "./hardware/card-terminal-adapter.js";
import { readScale } from "./hardware/scale-adapter.js";
import type { ScaleReadInput } from "./hardware/scale-adapter.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
const pdvUrl = `${frontendUrl}/pdv`;
let mainWindow: BrowserWindow | null = null;

app.commandLine.appendSwitch("ozone-platform-hint", "auto");
app.commandLine.appendSwitch("no-sandbox");
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-dev-shm-usage");

app.commandLine.appendSwitch("ozone-platform-hint", "auto");
app.commandLine.appendSwitch("no-sandbox");
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-gpu-compositing");
app.commandLine.appendSwitch("disable-gpu-sandbox");
app.commandLine.appendSwitch("disable-dev-shm-usage");
app.commandLine.appendSwitch("in-process-gpu");

const loadFallbackPage = ({ errorDescription }: { errorDescription: string }) => {
  if (!mainWindow) {
    return;
  }

  const html = encodeURIComponent(`
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>PDV Electron</title>
        <style>
          body { margin: 0; font-family: Arial, sans-serif; background: #10130f; color: #f4f1e8; display: grid; min-height: 100vh; place-items: center; }
          main { max-width: 720px; padding: 32px; border: 1px solid #344031; border-radius: 24px; background: #191f18; }
          h1 { margin-top: 0; color: #d7ff5f; }
          code { background: #0d100c; padding: 3px 7px; border-radius: 6px; }
        </style>
      </head>
      <body>
        <main>
          <h1>Electron iniciado</h1>
          <p>A janela desktop abriu, mas o frontend ainda não respondeu em <code>${pdvUrl}</code>.</p>
          <p>Erro: <code>${errorDescription}</code></p>
          <p>Se estiver usando <code>pnpm dev</code>, aguarde o Next finalizar o carregamento e reinicie o desktop com <code>pnpm dev:desktop</code>.</p>
        </main>
      </body>
    </html>
  `);

  void mainWindow.loadURL(`data:text/html;charset=utf-8,${html}`);
};

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 720,
    title: "PDV Face Delivery",
    show: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(currentDir, "../preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    if (!mainWindow) {
      return;
    }

    mainWindow.show();
    mainWindow.focus();
    mainWindow.center();
    mainWindow.setAlwaysOnTop(true);
    setTimeout(() => mainWindow?.setAlwaysOnTop(false), 1_500).unref();
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedUrl) => {
    console.error(
      `Falha ao carregar ${validatedUrl}: ${String(errorCode)} ${errorDescription}`,
    );

    if (validatedUrl.startsWith(frontendUrl)) {
      loadFallbackPage({ errorDescription });
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  console.log(`Abrindo Electron em ${pdvUrl}`);
  if (process.env.NODE_ENV !== "production") {
   // mainWindow.webContents.openDevTools({ mode: "right" });
  }
  void mainWindow.loadURL(pdvUrl);
};

const registerHardwareHandlers = () => {
  ipcMain.handle("scale:read", (_event, input: ScaleReadInput) => readScale(input));
  ipcMain.handle("card:start-payment", (_event, input: CardPaymentInput) =>
    startCardPayment(input),
  );
};

await app.whenReady();
registerHardwareHandlers();
createMainWindow();

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
