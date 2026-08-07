import { useRef } from 'react';

interface TouchpadProps {
  onMouseMove: (dx: number, dy: number) => void;
  onLeftClick: () => void;
  onRightClick: () => void;
  onDoubleClick: () => void;
  onScroll: (dy: number) => void;
}

export function Touchpad({
  onMouseMove,
  onLeftClick,
  onRightClick,
  onDoubleClick,
  onScroll
}: TouchpadProps) {
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const lastScrollY = useRef<number | null>(null);
  
  // Tap detection
  const pointerDownTime = useRef<number>(0);
  const pointerDownPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTapTime = useRef<number>(0);

  const handleTouchpadDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const clientX = e.clientX;
    const clientY = e.clientY;

    lastPos.current = { x: clientX, y: clientY };
    pointerDownTime.current = Date.now();
    pointerDownPos.current = { x: clientX, y: clientY };
  };

  const handleTouchpadMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!lastPos.current) return;

    const dx = Math.round(e.clientX - lastPos.current.x);
    const dy = Math.round(e.clientY - lastPos.current.y);

    if (dx !== 0 || dy !== 0) {
      onMouseMove(dx, dy);
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleTouchpadUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    lastPos.current = null;

    // Check if it was a tap
    const duration = Date.now() - pointerDownTime.current;
    const dist = Math.hypot(
      e.clientX - pointerDownPos.current.x,
      e.clientY - pointerDownPos.current.y
    );

    if (duration < 250 && dist < 10) {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTime.current;

      if (timeSinceLastTap < 300) {
        // Double tap
        onDoubleClick();
        lastTapTime.current = 0; // reset
      } else {
        // Single tap
        onLeftClick();
        lastTapTime.current = now;
      }
    }
  };

  // Scroll logic
  const handleScrollDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    lastScrollY.current = e.clientY;
  };

  const handleScrollMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (lastScrollY.current === null) return;

    const deltaY = e.clientY - lastScrollY.current;
    // Accumulate scroll thresholds to feel natural
    if (Math.abs(deltaY) >= 4) {
      // Send scroll event (we scale it so it moves smoothly on desktop)
      // Positive deltaY = drag down = scroll down (negative wheel delta in Windows)
      // Negative deltaY = drag up = scroll up (positive wheel delta in Windows)
      // We pass the raw value inverted to match standard wheel delta direction
      const scrollAmount = -Math.round(deltaY * 3);
      onScroll(scrollAmount);
      lastScrollY.current = e.clientY;
    }
  };

  const handleScrollUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    lastScrollY.current = null;
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Top Touchpad + Scroll Area */}
      <div className="w-full flex gap-3 h-[280px]">
        {/* Pointer Control Area */}
        <div
          onPointerDown={handleTouchpadDown}
          onPointerMove={handleTouchpadMove}
          onPointerUp={handleTouchpadUp}
          className="flex-1 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex flex-col items-center justify-center relative touch-none cursor-crosshair select-none active:border-indigo-500/30 transition-colors"
        >
          <div className="flex flex-col items-center gap-2 pointer-events-none text-slate-500 text-center p-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 animate-pulse opacity-40"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M12 3v18" /></svg>
            <span className="text-xs font-semibold tracking-wide">Touchpad</span>
            <span className="text-[10px] text-slate-600">Tap to Left Click • Double-tap to Double Click</span>
          </div>
          <div className="absolute inset-3 rounded-xl border border-dashed border-indigo-500/5 pointer-events-none" />
        </div>

        {/* Dedicated Scroll Strip */}
        <div
          onPointerDown={handleScrollDown}
          onPointerMove={handleScrollMove}
          onPointerUp={handleScrollUp}
          className="w-14 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col items-center justify-between py-6 touch-none select-none cursor-ns-resize active:border-indigo-500/30 transition-colors relative"
        >
          {/* Scroll arrows indicators */}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 pointer-events-none"><path d="m18 15-6-6-6 6"/></svg>
          <span className="text-[9px] font-bold text-slate-500 rotate-90 tracking-widest pointer-events-none select-none uppercase">Scroll</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 pointer-events-none"><path d="m6 9 6 6 6-6"/></svg>
          <div className="absolute inset-1 rounded-xl border border-dashed border-indigo-500/5 pointer-events-none" />
        </div>
      </div>

      {/* Clicks Control Board */}
      <div className="w-full flex gap-3">
        <button
          onClick={onLeftClick}
          className="flex-1 py-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all active:bg-indigo-600 active:text-white active:scale-[0.97]"
        >
          LEFT CLICK
        </button>
        <button
          onClick={onDoubleClick}
          className="py-4 px-5 rounded-xl text-[10px] font-bold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 transition-all active:bg-indigo-600 active:text-white active:scale-[0.97]"
        >
          DBL CLICK
        </button>
        <button
          onClick={onRightClick}
          className="flex-1 py-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all active:bg-indigo-600 active:text-white active:scale-[0.97]"
        >
          RIGHT CLICK
        </button>
      </div>
    </div>
  );
}

export default Touchpad;
