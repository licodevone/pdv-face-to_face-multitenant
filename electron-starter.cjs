import { app } from 'electron';

// Força o Electron a usar o sistema gráfico correto do WSL e desativa a GPU
app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');

(async () => {
  await import('./dist/server.js');
})();
