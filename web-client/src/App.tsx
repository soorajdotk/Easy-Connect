import { useState } from 'react';
import { MousePointer, Keyboard, QrCode, Wifi, LogOut } from 'lucide-react';
import { QRScanner } from './components/QRScanner';
import { useRemoteConnection } from './hooks/useRemoteConnection';
import type { PairingInfo } from 'shared';

function App() {
  const [activeTab, setActiveTab] = useState<'touchpad' | 'keyboard'>('touchpad');
  const [isScanning, setIsScanning] = useState(false);
  const { connectionStatus, connect, disconnect } = useRemoteConnection();

  const handleScan = (data: string) => {
    try {
      const info: PairingInfo = JSON.parse(data);
      if (info.wsUrl && info.deviceId && info.pairToken) {
        connect(info);
        setIsScanning(false);
      } else {
        alert('Invalid QR code format.');
      }
    } catch (err) {
      alert('Failed to parse pairing QR code.');
    }
  };

  const handleForget = () => {
    if (confirm('Are you sure you want to forget this paired computer?')) {
      localStorage.removeItem('pairing_info');
      disconnect();
      window.location.reload(); // Refresh to clean state
    }
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col items-center justify-between p-4 selection:bg-indigo-500 selection:text-white">
      {/* Top Header / Connection Status */}
      <header className="w-full max-w-md glass-card rounded-2xl p-4 flex items-center justify-between shadow-xl mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Wifi className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-md font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Universal Remote
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' 
                  ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' 
                  : connectionStatus === 'connecting'
                    ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
                    : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
              }`} />
              {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {connectionStatus !== 'disconnected' && (
            <button
              onClick={handleForget}
              title="Forget paired device"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all active:scale-95"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
          {connectionStatus === 'disconnected' && (
            <button
              onClick={() => setIsScanning(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              Scan QR
            </button>
          )}
        </div>
      </header>

      {/* Main Control Console */}
      <main className="flex-1 w-full max-w-md flex flex-col justify-center items-center gap-4">
        {connectionStatus === 'disconnected' && !isScanning ? (
          <div className="glass-card rounded-3xl p-8 text-center max-w-sm w-full flex flex-col items-center gap-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <QrCode className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Pair with Computer</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Scan the QR code displayed on your computer's tray agent to establish a direct local connection.
              </p>
            </div>
            <button
              onClick={() => setIsScanning(true)}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/30 active:scale-[0.98]"
            >
              Scan Pairing QR Code
            </button>
          </div>
        ) : isScanning ? (
          <div className="glass-card rounded-3xl p-6 w-full max-w-sm flex flex-col items-center gap-4 shadow-2xl relative overflow-hidden">
            <h2 className="text-md font-bold mb-2">Scanning pairing QR...</h2>
            <QRScanner onScan={handleScan} onClose={() => setIsScanning(false)} />
          </div>
        ) : (
          <div className="flex-1 w-full flex flex-col gap-4">
            {/* View Port for Touchpad/Keyboard */}
            <div className="flex-1 glass-card rounded-3xl p-4 flex flex-col items-center justify-center min-h-[300px]">
              {activeTab === 'touchpad' ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <span className="text-sm font-semibold text-slate-400">Touchpad Panel Placeholder</span>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <span className="text-sm font-semibold text-slate-400">Virtual Keyboard Placeholder</span>
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="glass rounded-2xl p-1.5 flex gap-2 w-full">
              <button
                onClick={() => setActiveTab('touchpad')}
                className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                  activeTab === 'touchpad'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <MousePointer className="w-4 h-4" />
                Touchpad
              </button>
              <button
                onClick={() => setActiveTab('keyboard')}
                className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                  activeTab === 'keyboard'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Keyboard className="w-4 h-4" />
                Keyboard
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-4 text-center">
        <p className="text-[10px] text-slate-600">Universal Remote v1.0.0 • Phase 1</p>
      </footer>
    </div>
  );
}

export default App;
