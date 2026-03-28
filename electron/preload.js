const { contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// specific Electron APIs without exposing the entire Electron object
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
});
