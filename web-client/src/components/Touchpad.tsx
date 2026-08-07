import { useRef } from 'react';

interface TouchpadProps {
  onMouseMove: (dx: number, dy: number) => void;
}

export function Touchpad({ onMouseMove }: TouchpadProps) {
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Capture pointer events even if dragging outside the boundary
    e.currentTarget.setPointerCapture(e.pointerId);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!lastPos.current) return;

    // Calculate delta relative to previous pointer position
    const dx = Math.round(e.clientX - lastPos.current.x);
    const dy = Math.round(e.clientY - lastPos.current.y);

    if (dx !== 0 || dy !== 0) {
      onMouseMove(dx, dy);
      // Update last position to the current cursor position
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    lastPos.current = null;
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="w-full h-full min-h-[320px] rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-center relative touch-none cursor-crosshair select-none overflow-hidden active:border-indigo-500/30 transition-colors"
    >
      <div className="flex flex-col items-center gap-2 pointer-events-none text-slate-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 animate-pulse opacity-40"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M12 3v18" /></svg>
        <span className="text-xs font-medium tracking-wide">Drag finger here to move cursor</span>
      </div>
      <div className="absolute inset-3 rounded-xl border border-dashed border-indigo-500/5 pointer-events-none" />
    </div>
  );
}

export default Touchpad;
