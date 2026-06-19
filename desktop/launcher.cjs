const path = require("node:path");

const mainPath = path.join(__dirname, "dist", "main.js");

console.log(`Inicializando Electron launcher: ${mainPath}`);

import(mainPath).catch((error) => {
  console.error("Falha ao carregar processo principal do Electron:", error);
  process.exit(1);
});
