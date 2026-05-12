const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendNotification: (title, body) => ipcRenderer.send('send-notification', { title, body }),
  updateTray: (text) => ipcRenderer.send('update-tray', text),
  minimize: () => ipcRenderer.send('minimize'),
  close: () => ipcRenderer.send('close'),
  setAlwaysOnTop: (flag) => ipcRenderer.send('set-always-on-top', flag),
});
