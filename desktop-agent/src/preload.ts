import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdatePairing: (callback: (pairingUrl: string) => void) => {
    ipcRenderer.on('update-pairing', (_event, value) => callback(value));
  },
  onUpdateStatus: (callback: (status: string) => void) => {
    ipcRenderer.on('update-status', (_event, value) => callback(value));
  }
});
