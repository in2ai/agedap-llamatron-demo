const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  //runNodeCode: (data) => ipcRenderer.send("run-node-code", data),
  runNodeCode: (data) => {
    return new Promise((resolve) => {
      ipcRenderer.send("run-node-code", data);
      ipcRenderer.once("node-code-response", (_, response) => {
        resolve(response);
      });
    });
  },
  onNodeCodeResponse: (callback) =>
    ipcRenderer.on("node-code-response", callback),
  onPartialResponse: (callback) => ipcRenderer.on("partial-response", callback),
});
