import { useState, useRef } from 'react';
import type { SpecialKey } from 'shared';
import { ArrowLeft, ArrowUp, ArrowDown, ArrowRight, CornerDownLeft, Delete, Key } from 'lucide-react';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onSpecialKey: (key: SpecialKey) => void;
}

export function VirtualKeyboard({ onKeyPress, onSpecialKey }: VirtualKeyboardProps) {
  const [ctrlActive, setCtrlActive] = useState(false);
  const [altActive, setAltActive] = useState(false);
  const [shiftActive, setShiftActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length > 0) {
      // Send the last character typed
      const char = val.charAt(val.length - 1);
      onKeyPress(char);
      // Clear input
      e.target.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Intercept backspace and enter when typing inside input
    if (e.key === 'Backspace') {
      onSpecialKey('BACKSPACE');
    } else if (e.key === 'Enter') {
      onSpecialKey('ENTER');
    } else if (e.key === 'Escape') {
      onSpecialKey('ESCAPE');
    }
  };

  const triggerSpecialKey = (key: SpecialKey) => {
    if (key === 'CONTROL') setCtrlActive(!ctrlActive);
    if (key === 'ALT') setAltActive(!altActive);
    if (key === 'SHIFT') setShiftActive(!shiftActive);
    onSpecialKey(key);
  };

  const resetModifiers = () => {
    if (ctrlActive) triggerSpecialKey('CONTROL');
    if (altActive) triggerSpecialKey('ALT');
    if (shiftActive) triggerSpecialKey('SHIFT');
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Native Keyboard Trigger Box */}
      <div className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Tap here to open keyboard & type..."
          className="w-full py-4 px-4 pr-12 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
          <Key className="w-4 h-4" />
        </div>
      </div>

      {/* Modifier Indicators & Clear */}
      <div className="flex gap-2 items-center justify-between px-1">
        <div className="flex gap-2">
          {ctrlActive && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">CTRL</span>}
          {altActive && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">ALT</span>}
          {shiftActive && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">SHIFT</span>}
        </div>
        {(ctrlActive || altActive || shiftActive) && (
          <button 
            onClick={resetModifiers}
            className="text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            Clear Modifiers
          </button>
        )}
      </div>

      {/* Special Keys Pad */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => triggerSpecialKey('ESCAPE')}
          className="py-3.5 rounded-xl text-xs font-semibold bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/50 text-slate-300 transition-all active:scale-95"
        >
          ESC
        </button>
        <button
          onClick={() => triggerSpecialKey('BACKSPACE')}
          className="py-3.5 rounded-xl text-xs font-semibold bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/50 text-slate-300 transition-all active:scale-95 flex items-center justify-center gap-1.5"
        >
          <Delete className="w-4 h-4" />
          BACKSPACE
        </button>
        <button
          onClick={() => triggerSpecialKey('ENTER')}
          className="py-3.5 rounded-xl text-xs font-semibold bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/50 text-slate-300 transition-all active:scale-95 flex items-center justify-center gap-1.5"
        >
          <CornerDownLeft className="w-4 h-4" />
          ENTER
        </button>
      </div>

      {/* Modifier Keys Pad */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => triggerSpecialKey('CONTROL')}
          className={`py-3.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
            ctrlActive 
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20' 
              : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800/50 text-slate-300'
          }`}
        >
          CTRL
        </button>
        <button
          onClick={() => triggerSpecialKey('ALT')}
          className={`py-3.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
            altActive 
              ? 'bg-pink-600 border-pink-500 text-white shadow-md shadow-pink-600/20' 
              : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800/50 text-slate-300'
          }`}
        >
          ALT
        </button>
        <button
          onClick={() => triggerSpecialKey('SHIFT')}
          className={`py-3.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
            shiftActive 
              ? 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-600/20' 
              : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800/50 text-slate-300'
          }`}
        >
          SHIFT
        </button>
      </div>

      {/* Arrow Keys Pad */}
      <div className="flex flex-col items-center gap-2 mt-2">
        <button
          onClick={() => triggerSpecialKey('UP')}
          className="w-16 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/50 text-slate-300 flex items-center justify-center transition-all active:scale-95"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => triggerSpecialKey('LEFT')}
            className="w-16 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/50 text-slate-300 flex items-center justify-center transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => triggerSpecialKey('DOWN')}
            className="w-16 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/50 text-slate-300 flex items-center justify-center transition-all active:scale-95"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => triggerSpecialKey('RIGHT')}
            className="w-16 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/50 text-slate-300 flex items-center justify-center transition-all active:scale-95"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default VirtualKeyboard;
