# Universal Computer Remote (Phase 1)

A lightweight, zero-cloud, cross-platform remote control system that allows you to control your Windows PC's mouse and keyboard directly from any local web browser (such as a mobile phone) via a secure WebSocket connection.

---

## Architecture

```
Web Client (Mobile/Browser)
      │
      │ WebSocket (Local network)
      │
Desktop Agent (Electron + Node.js)
      │
Windows API (User32.dll via Koffi FFI)
      │
Mouse / Keyboard Control
```

---

## Folder Structure

```
easyconnect/ (Workspace Root)
├── package.json         # Workspace configuration (monorepo)
├── shared/              # Type definitions shared between Client & Agent
├── desktop-agent/       # Windows Electron app (Tray icon, WS server)
└── web-client/          # React + Vite + Tailwind web interface (Touchpad, Keyboard)
```

---

## Features Implemented (Phase 1)

*   **Desktop Agent (Windows)**: Starts in the system tray, hosts a secure local WebSocket server on port 8080, generates pairing tokens, and uses native `user32.dll` calls for low-overhead input simulation.
*   **Web Client (React + Vite)**: A premium glassmorphic UI featuring a local QR scanner, responsive touchpad, dedicated scroll strip, and a hybrid virtual keyboard (native typing + utility/modifier key grid).
*   **Secure QR Pairing**: The desktop agent displays a pairing QR code containing connection credentials. The client scans it, stores pairing keys in `localStorage`, and connects.
*   **Resilient Connectivity**: Automatically reconnects with exponential back-off in case of a Wi-Fi drop or server reboot.
*   **Latency Optimization**: Event accumulation and ~60fps throttling to guarantee lag-free mouse movements without network saturation.

---

## Quick Start Guide

### 1. Installation
Clone the repository and run the following command at the **root** folder to install all workspace dependencies:
```bash
npm install --legacy-peer-deps
```

### 2. Build Shared Package
Build the shared type definitions so both the client and agent workspaces can resolve typing:
```bash
npm run build -w shared
```

### 3. Run the Desktop Agent
To build and launch the Electron application on your Windows machine:
```bash
npm run start -w desktop-agent
```
*   *Note*: On startup, a window will pop up showing the **Pairing QR Code**. If closed, the application remains active in the system tray. Double-click the tray icon to restore the status window.

### 4. Run the Web Client
To launch the React client development server:
```bash
npm run dev -w web-client
```
*   *Note*: To connect your phone, make sure it is on the **same Wi-Fi network** as your PC, and open the URL displayed in the console using your computer's local IP (e.g. `http://192.168.1.15:5173`).

---

## Input Commands Protocol

We communicate over WebSocket using structured JSON payloads defined in `shared/src/types.ts`:

*   **Move Mouse**: `{"type":"mouse_move","dx":12,"dy":-5}`
*   **Left Click**: `{"type":"left_click"}`
*   **Right Click**: `{"type":"right_click"}`
*   **Double Click**: `{"type":"double_click"}`
*   **Scroll**: `{"type":"mouse_scroll","dy":-120}`
*   **Key Type**: `{"type":"key_press","key":"A"}`
*   **Special Key**: `{"type":"special_key","key":"ENTER"}`
