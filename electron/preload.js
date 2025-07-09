const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  runNodeCode: (data) => {
    const { func } = data;
    return new Promise((resolve) => {
      ipcRenderer.send('runNodeCode', data);
      ipcRenderer.once(`onNodeCodeResponse_${func}`, (_, response) => {
        if (response.func !== func) return;
        resolve(response);
      });
    });
  },
  // onNodeCodeResponse: (callback) => {
  //   return ipcRenderer.on('onNodeCodeResponse', callback);
  // },
  onPartialMessageResponse: (callback) => ipcRenderer.on('onPartialMessageResponse', callback),
  onNewExternalMessage: (callback) => ipcRenderer.on('onNewExternalMessage', callback),
  onBackgroundChatUpdated: (callback) => ipcRenderer.on('onBackgroundChatUpdated', callback),
  onNotificationClicked: (callback) => ipcRenderer.on('onNotificationClicked', callback),
});
