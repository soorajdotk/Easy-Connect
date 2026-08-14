import { useState } from 'react';
import { MousePointer, Keyboard, QrCode, Wifi, LogOut, Settings, X, Sliders } from 'lucide-react';
import { QRScanner } from './components/QRScanner';
import { Touchpad } from './components/Touchpad';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { useRemoteConnection } from './hooks/useRemoteConnection';
import type { PairingInfo } from 'shared';
import { VoiceControl } from './components/VoiceControl';

function App() {
  const [activeTab, setActiveTab] = useState<'touchpad' | 'keyboard'>('touchpad');
  const [isScanning, setIsScanning] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualData, setManualData] = useState('');
  const [showSettings, setShowSettings] = useState(false);

const [pointerSensitivity, setPointerSensitivity] = useState(() => {
  const saved = localStorage.getItem('pointer_sensitivity');
  return saved ? parseFloat(saved) : 1.0;
});

const [scrollSpeed, setScrollSpeed] = useState(() => {
  const saved = localStorage.getItem('scroll_speed');
  return saved ? parseInt(saved, 10) : 3;
});
 const {
  connectionStatus,
  connect,
  disconnect,
  sendMessage,
  addMessageListener
} = useRemoteConnection();

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

  const handleManualConnect = () => {
    try {
      const info: PairingInfo = JSON.parse(manualData.trim());
      if (info.wsUrl && info.deviceId && info.pairToken) {
        connect(info);
        setShowManual(false);
        setManualData('');
      } else {
        alert('Invalid pairing code format.');
      }
    } catch (err) {
      alert('Failed to parse pairing code JSON.');
    }
  };

  const handleForget = () => {
    if (confirm('Are you sure you want to forget this paired computer?')) {
      localStorage.removeItem('pairing_info');
      disconnect();
      window.location.reload();
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
          <button
            onClick={() => setShowSettings(true)}
            title="Configure settings"
            className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800/50 transition-all active:scale-95"
          >
            <Settings className="w-4 h-4" />
          </button>
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
            {!showManual ? (
              <>
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
                <button
                  onClick={() => setShowManual(true)}
                  className="text-xs text-slate-400 hover:text-slate-300 underline mt-1 transition-colors active:scale-95"
                >
                  Enter pairing code manually
                </button>
              </>
            ) : (
              <>
                <div className="w-full text-left">
                  <h2 className="text-lg font-bold text-center">Manual Connection</h2>
                  <p className="text-xs text-slate-400 mt-2 text-center leading-relaxed">
                    Paste the manual pairing JSON string from the desktop status window below:
                  </p>
                  <textarea
                    value={manualData}
                    onChange={(e) => setManualData(e.target.value)}
                    placeholder='{"wsUrl": "ws://...", "deviceId": "...", "pairToken": "..."}'
                    className="w-full mt-4 h-24 p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-200 placeholder-slate-600 text-xs font-mono focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                  />
                </div>
                <div className="w-full flex gap-2">
                  <button
                    onClick={() => {
                      setShowManual(false);
                      setManualData('');
                    }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all active:scale-[0.98]"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleManualConnect}
                    disabled={!manualData.trim()}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/40 disabled:text-slate-500 text-white transition-all shadow-md active:scale-[0.98]"
                  >
                    Connect
                  </button>
                </div>
              </>
            )}
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
                <Touchpad
                  onMouseMove={(dx, dy) => sendMessage({ type: 'mouse_move', dx, dy })}
                  onLeftClick={() => sendMessage({ type: 'left_click' })}
                  onRightClick={() => sendMessage({ type: 'right_click' })}
                  onDoubleClick={() => sendMessage({ type: 'double_click' })}
                  onScroll={(dy) => sendMessage({ type: 'mouse_scroll', dy })}
                  pointerSensitivity={pointerSensitivity}
                  scrollSpeed={scrollSpeed}
                />
              ) : (
                <VirtualKeyboard
                  onKeyPress={(key) => sendMessage({ type: 'key_press', key })}
                  onSpecialKey={(key) => sendMessage({ type: 'special_key', key })}
                />
              )}
            </div>

            {/* Voice Control */}
            <VoiceControl
              sendMessage={sendMessage}
              addMessageListener={addMessageListener}
              isConnected={connectionStatus === 'connected'}
            />

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

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm glass-card rounded-3xl p-6 shadow-2xl border border-slate-800/80 relative flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400">
                <Sliders className="w-5 h-5" />
                <h2 className="text-sm font-bold text-slate-100">Controls Settings</h2>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex flex-col gap-5">
              {/* Pointer Sensitivity Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-300">Pointer Sensitivity</span>
                  <span className="text-indigo-400 font-mono">{pointerSensitivity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={pointerSensitivity}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setPointerSensitivity(val);
                    localStorage.setItem('pointer_sensitivity', val.toString());
                  }}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-900 accent-indigo-500 border border-slate-800 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-medium px-0.5">
                  <span>Slow (0.2x)</span>
                  <span>Fast (3.0x)</span>
                </div>
              </div>

              {/* Scroll Speed Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-300">Scrolling Speed</span>
                  <span className="text-indigo-400 font-mono">{scrollSpeed}x {scrollSpeed === 3 && '(Default)'}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={scrollSpeed}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setScrollSpeed(val);
                    localStorage.setItem('scroll_speed', val.toString());
                  }}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-900 accent-indigo-500 border border-slate-800 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-medium px-0.5">
                  <span>Slow (1x)</span>
                  <span>Fast (10x)</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
