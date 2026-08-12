import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { parseVoiceCommand } from '../services/voiceCommandParser';
import type { WsMessage } from 'shared/src/types';

interface VoiceControlProps {
  sendMessage: (msg: WsMessage) => void;
  addMessageListener: (listener: (msg: WsMessage) => void) => () => void;
  isConnected: boolean;
}

type VoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

export function VoiceControl({ sendMessage, addMessageListener, isConnected }: VoiceControlProps) {
  const [state, setState] = useState<VoiceState>('IDLE');
  const [spokenText, setSpokenText] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const startListening = () => {
    if (!isSupported) {
      setState('ERROR');
      setStatusMessage('Voice control is not supported in this browser.');
      return;
    }

    if (!isConnected) {
      setState('ERROR');
      setStatusMessage('Computer is not connected.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setState('LISTENING');
      setSpokenText('');
      setStatusMessage('');
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event);
      setState('ERROR');
      if (event.error === 'not-allowed') {
        setStatusMessage('Microphone permission is required for voice control.');
      } else {
        setStatusMessage(`Error: ${event.error || 'Failed to recognize speech.'}`);
      }
    };

    recognition.onend = () => {
      // Only transition back if we were listening and didn't transition to PROCESSING/ERROR
      setState((prev) => (prev === 'LISTENING' ? 'IDLE' : prev));
    };

    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setSpokenText(result);
      setState('PROCESSING');
      handleParsedSpeech(result);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error(e);
      setState('ERROR');
      setStatusMessage('Failed to start speech recognition.');
    }
  };

  const handleParsedSpeech = (text: string) => {
    const command = parseVoiceCommand(text);
    if (!command) {
      setState('ERROR');
      setStatusMessage("Sorry, I don't understand that command.");
      return;
    }

    // Register temporary message listener for result
    let removeListener: (() => void) | null = null;
    
    // Timeout for safety if agent doesn't respond
    const timeoutId = setTimeout(() => {
      if (removeListener) removeListener();
      setState('ERROR');
      setStatusMessage('Response timed out.');
    }, 5000);

    removeListener = addMessageListener((msg) => {
      if (msg.type === 'voice_result') {
        clearTimeout(timeoutId);
        if (removeListener) removeListener();
        
        if (msg.success) {
          setState('SUCCESS');
          setStatusMessage(`✓ ${msg.message}`);
        } else {
          setState('ERROR');
          setStatusMessage(msg.message);
        }
      }
    });

    sendMessage(command);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  return (
    <div className="w-full glass rounded-2xl p-4 flex flex-col gap-3 border border-slate-800/80">
      <div className="flex items-center justify-between w-full">
        <span className="text-xs font-semibold text-slate-400">🎤 Voice</span>
        {state === 'LISTENING' && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 uppercase animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            🔴 Listening
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 w-full">
        {/* Toggle Button */}
        {state === 'LISTENING' ? (
          <button
            onClick={stopListening}
            className="w-12 h-12 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 flex items-center justify-center text-rose-400 transition-all cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
          >
            <MicOff className="w-5 h-5 animate-pulse" />
          </button>
        ) : (
          <button
            onClick={startListening}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 border ${
              !isSupported 
                ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-indigo-600/20 hover:bg-indigo-600/35 border-indigo-500/40 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
            }`}
            disabled={!isSupported}
          >
            <Mic className="w-5 h-5" />
          </button>
        )}

        {/* Status / Output Display */}
        <div className="flex-1 flex flex-col justify-center min-h-[48px]">
          {!isSupported ? (
            <p className="text-xs text-rose-400 font-medium">Voice control is not supported in this browser.</p>
          ) : state === 'IDLE' ? (
            <p className="text-xs text-slate-500">Tap the microphone and speak.</p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {spokenText && (
                <p className="text-xs text-slate-300 font-medium">
                  You said: <span className="text-indigo-300 italic">"{spokenText}"</span>
                </p>
              )}
              {state === 'LISTENING' && (
                <p className="text-[11px] text-slate-400">Speak now...</p>
              )}
              {state === 'PROCESSING' && (
                <p className="text-[11px] text-indigo-400 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Processing command...
                </p>
              )}
              {state === 'SUCCESS' && (
                <p className="text-xs text-green-400 flex items-center gap-1 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  {statusMessage}
                </p>
              )}
              {state === 'ERROR' && (
                <p className="text-xs text-rose-400 flex items-center gap-1 font-medium leading-tight">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {statusMessage}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VoiceControl;
