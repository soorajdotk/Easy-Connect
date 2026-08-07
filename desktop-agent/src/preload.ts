import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdatePairing: (callback: (pairingUrl: string, rawPayload: string) => void) => {
    ipcRenderer.on('update-pairing', (_event, qrUrl, rawStr) => callback(qrUrl, rawStr));
  },
  onUpdateStatus: (callback: (status: string) => void) => {
    ipcRenderer.on('update-status', (_event, value) => callback(value));
  }
});
