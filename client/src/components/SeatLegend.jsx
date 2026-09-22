import React from 'react';
import { Clock, Lock, Check } from 'lucide-react';

export function SeatLegend() {
  return (
    <div className="w-full max-w-2xl mx-auto my-6 px-4 py-3 rounded-2xl glass-panel bg-slateCard/50 flex flex-wrap items-center justify-around gap-4 text-xs">
      {/* Available */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-slateCard border border-charcoalBorder/90 flex items-center justify-center shadow-sm"></div>
        <span className="text-slate-300 font-medium">Available</span>
      </div>

      {/* Selected by You */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-neonCyan text-obsidian font-bold flex items-center justify-center shadow-neon-cyan scale-105">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </div>
        <span className="text-neonCyan font-medium">Selected by You</span>
      </div>

      {/* On Hold by Others */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md seat-held-striped text-amberHold flex items-center justify-center border border-amberHold/60">
          <Clock className="w-3 h-3 animate-pulse" />
        </div>
        <span className="text-amberHold font-medium">On Hold (5m lock)</span>
      </div>

      {/* Sold / Booked */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-500 flex items-center justify-center">
          <Lock className="w-2.5 h-2.5" />
        </div>
        <span className="text-slate-500 font-medium">Sold / Booked</span>
      </div>
    </div>
  );
}
