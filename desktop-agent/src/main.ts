import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from 'electron';
import * as path from 'path';
import * as QRCode from 'qrcode';
import { RemoteServer } from './server';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let remoteServer: RemoteServer | null = null;

// Keep track of the current state to send to window when it loads
let currentStatus: 'Disconnected' | 'Connected' | 'Waiting' = 'Disconnected';
let currentQrDataUrl: string = '';
let currentRawPayload: string = '';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 480,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'src', 'index.html'));

  mainWindow.webContents.on('did-finish-load', () => {
    if (currentQrDataUrl) {
      mainWindow?.webContents.send('update-pairing', currentQrDataUrl, currentRawPayload);
    }
    mainWindow?.webContents.send('update-status', currentStatus === 'Waiting' ? 'Waiting for connection' : currentStatus);
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

function updateTrayMenu() {
  if (!tray) return;

  const statusLabel = currentStatus === 'Connected' 
    ? 'Status: Connected' 
    : currentStatus === 'Waiting' 
      ? 'Status: Waiting for Client' 
      : 'Status: Disconnected';

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Remote Status',
      click: () => {
        mainWindow?.show();
      }
    },
    { type: 'separator' },
    {
      label: statusLabel,
      enabled: false,
      id: 'conn-status'
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function createTray() {
  const iconPath = path.join(__dirname, '..', 'public', 'icon.png');
  let icon = nativeImage.createFromPath(iconPath);
  if (icon.isEmpty()) {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('Universal Remote Agent');
  updateTrayMenu();

  tray.on('double-click', () => {
    mainWindow?.show();
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Initialize Remote WebSocket Server on port 8080
  remoteServer = new RemoteServer({
    port: 8080,
    onStatusChange: (status) => {
      currentStatus = status;
      updateTrayMenu();
      if (mainWindow && !mainWindow.isDestroyed()) {
        const displayStatus = status === 'Waiting' ? 'Waiting for connection' : status;
        mainWindow.webContents.send('update-status', displayStatus);
      }
    },
    onPairingInfoReady: (pairingPayload) => {
      currentRawPayload = pairingPayload;
      // Generate QR Code data URL
      QRCode.toDataURL(pairingPayload, (err, url) => {
        if (err) {
          console.error('Failed to generate QR code:', err);
          return;
        }
        currentQrDataUrl = url;
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('update-pairing', url, pairingPayload);
        }
      });
    }
  });

  remoteServer.start();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
