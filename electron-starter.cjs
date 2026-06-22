const { app } = require('electron');
const path = require('path');
const fs = require('fs');

app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');

try {
  // 1. Caminho padrão de Desenvolvimento (raiz do projeto)
  let serverPath = path.join(__dirname, 'dist', 'server.js');

  // 2. Se não achar ali, significa que está em Produção (copiado via extraResource para a pasta recursos)
  if (!fs.existsSync(serverPath)) {
    serverPath = path.join(__dirname, '..', 'dist', 'server.js');
  }

  require(serverPath);
} catch (err) {
  console.error("Erro crítico ao carregar o servidor do backend:", err);
}
