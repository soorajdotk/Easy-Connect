import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let active = true;

    async function startCamera() {
      setIsInitializing(true);
      setError(null);

      // 1. Check if mediaDevices API is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError(
          'Camera access is blocked or not supported on this browser context. Note: Camera scanning requires a secure connection (HTTPS) or localhost.'
        );
        setIsInitializing(false);
        return;
      }

      try {
        // 2. Request camera stream directly
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Crucial for iOS Safari support
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
        }

        setIsInitializing(false);
        requestAnimationFrame(tick);
      } catch (err: any) {
        console.error('Camera startup error:', err);
        setIsInitializing(false);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Camera permission was denied. Please reset permissions in your browser address bar.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No rear camera was found on this device.');
        } else {
          setError(`Could not open camera: ${err.message || err.name || 'Unknown error'}`);
        }
      }
    }

    function tick() {
      if (!active) return;

      const video = videoRef.current;
      if (!video) return;

      // Check if video has loaded frames
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const width = video.videoWidth;
        const height = video.videoHeight;

        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
        }

        const canvas = canvasRef.current;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          
          // Decode QR code frame
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (code && code.data && active) {
            onScan(code.data);
            return; // stop loop
          }
        }
      }

      // Continue frame extraction
      if (streamRef.current && streamRef.current.active && active) {
        requestAnimationFrame(tick);
      }
    }

    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [onScan]);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
      <div className="relative w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl flex items-center justify-center">
        {/* HTML Video tag showing the stream */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${error ? 'hidden' : ''}`}
          playsInline
          muted
        />

        {/* State Indicators overlay */}
        {isInitializing && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0a0e17] text-slate-400">
            <Camera className="w-8 h-8 animate-pulse text-indigo-400" />
            <span className="text-xs font-medium">Starting camera...</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0a0e17] text-slate-300">
            <div className="p-3 rounded-full bg-rose-500/10 text-rose-400 mb-3 border border-rose-500/20">
              <CameraOff className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold flex items-center gap-1.5 justify-center text-rose-400">
              <AlertCircle className="w-4 h-4" /> Camera Blocked
            </h3>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed max-w-[240px]">
              {error}
            </p>
          </div>
        )}

        {/* Overlay Scanner Target UI */}
        {!error && !isInitializing && (
          <>
            <div className="absolute inset-0 border-2 border-dashed border-indigo-500/30 rounded-2xl pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border border-indigo-500/50 rounded-2xl bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.15)] relative">
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-500 rounded-tl-md" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-500 rounded-tr-md" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-500 rounded-bl-md" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-500 rounded-br-md" />
                
                {/* Scanning line animation */}
                <div className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent top-0 animate-[scan_2s_ease-in-out_infinite]" />
              </div>
            </div>
          </>
        )}
      </div>

      <button
        onClick={onClose}
        className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50 transition-all active:scale-[0.98]"
      >
        Cancel Scan
      </button>
      
      {/* Scanning keyframes styling */}
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
