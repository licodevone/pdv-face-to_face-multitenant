const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pdvHardware", {
  readScale: (input) => ipcRenderer.invoke("scale:read", input),
  startCardPayment: (input) => ipcRenderer.invoke("card:start-payment", input),
});
