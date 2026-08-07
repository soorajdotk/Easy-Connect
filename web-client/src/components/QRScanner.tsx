import { useEffect, useRef } from 'react';
import QrScanner from 'qr-scanner';

QrScanner.WORKER_PATH = '/qr-scanner-worker.min.js';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const qrScanner = new QrScanner(
      video,
      (result) => {
        const rawData = typeof result === 'object' ? (result as any).data : result;
        onScan(rawData);
      },
      {
        preferredCamera: 'environment',
        highlightScanRegion: true,
        highlightCodeOutline: true,
        returnDetailedScanResult: true,
      }
    );

    scannerRef.current = qrScanner;

    qrScanner.start().catch((err) => {
      console.error('Failed to start camera:', err);
    });

    return () => {
      qrScanner.destroy();
    };
  }, [onScan]);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
      <div className="relative w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        {/* Overlay Scanner Target */}
        <div className="absolute inset-0 border-2 border-dashed border-indigo-500/30 rounded-2xl pointer-events-none" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 border border-indigo-500/50 rounded-2xl bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.15)] relative">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-500 rounded-tl-md" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-500 rounded-tr-md" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-500 rounded-bl-md" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-500 rounded-br-md" />
            
            {/* Scanning line */}
            <div className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent top-0 animate-[scan_2s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
      <button
        onClick={onClose}
        className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50 transition-all active:scale-[0.98]"
      >
        Cancel Scan
      </button>
      
      {/* Dynamic Keyframes inject */}
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; }
          50% { top: 100%; }
        }
      `}</style>
    </div>
  );
}
export default QRScanner;
