import React from 'react';

export function ScreenArch() {
  return (
    <div className="relative w-full max-w-3xl mx-auto mb-10 pt-4 flex flex-col items-center">
      {/* Ambient Spotlight Beam */}
      <div className="absolute top-8 w-4/5 h-28 screen-spotlight pointer-events-none -z-10 blur-xl opacity-70 animate-beam"></div>

      {/* Curved Screen Arch */}
      <div className="relative w-full">
        {/* Glow behind arch */}
        <div className="absolute -top-1 inset-x-8 h-4 bg-neonCyan/20 blur-md rounded-full"></div>

        {/* Arch line */}
        <div className="w-full h-4 border-t-2 border-slate-300/80 rounded-t-[100px] shadow-[0_-4px_16px_rgba(6,182,212,0.4)]"></div>

        {/* Screen Label */}
        <div className="text-center -mt-1">
          <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-slate-400 bg-obsidian px-4 py-1 rounded-full border border-charcoalBorder/60 shadow-sm">
            SCREEN THIS WAY
          </span>
        </div>
      </div>
    </div>
  );
}
