import React from 'react';
import { Lock, Clock, Check } from 'lucide-react';
import { useBookingStore } from '../../store/useBookingStore';

export function SeatButton({ seat, tierName, price }) {
  const { selectedSeats, toggleSeatSelection, holdToken } = useBookingStore();

  const isSelectedBySelf = selectedSeats.some((s) => s.seatId === seat.seatId);
  const isHeldBySelf = seat.status === 'LOCKED' && seat.holdToken && seat.holdToken === holdToken;
  const isHeldByOther = seat.status === 'LOCKED' && (!holdToken || seat.holdToken !== holdToken);
  const isBooked = seat.status === 'BOOKED';

  const handleClick = () => {
    if (isBooked || isHeldByOther) return;
    toggleSeatSelection(seat.seatId, tierName, price);
  };

  // Shape and sizing based on Tier
  const isRecliner = tierName === 'RECLINER';
  const isPrime = tierName === 'PRIME';

  let seatStyleClasses = '';
  let icon = null;

  if (isBooked) {
    seatStyleClasses = 'bg-slate-800/80 border-slate-700/50 text-slate-600 cursor-not-allowed opacity-60';
    icon = <Lock className="w-2.5 h-2.5" />;
  } else if (isHeldBySelf) {
    seatStyleClasses = 'bg-amberHold text-obsidian border-amberHold font-bold shadow-neon-amber cursor-pointer animate-pulse';
    icon = <Clock className="w-3 h-3" />;
  } else if (isHeldByOther) {
    seatStyleClasses = 'seat-held-striped text-amberHold/80 border-amberHold/60 cursor-not-allowed';
    icon = <Clock className="w-2.5 h-2.5 animate-pulse" />;
  } else if (isSelectedBySelf) {
    seatStyleClasses = 'bg-neonCyan text-obsidian border-neonCyan font-bold shadow-neon-cyan scale-105 z-10';
    icon = <Check className="w-3 h-3 stroke-[3]" />;
  } else {
    // Available
    seatStyleClasses = 'bg-slateCard/90 hover:bg-slateCard-light border-charcoalBorder hover:border-neonCyan/70 text-slate-300 hover:text-white cursor-pointer hover:shadow-neon-cyan hover:scale-105 transition-all';
  }

  // Size styling
  const sizeClasses = isRecliner
    ? 'w-10 h-10 rounded-xl text-xs font-semibold'
    : isPrime
    ? 'w-8 h-8 rounded-lg text-[11px] font-medium'
    : 'w-7 h-7 rounded-md text-[10px] font-medium';

  return (
    <div className="relative group inline-block">
      <button
        onClick={handleClick}
        disabled={isBooked || isHeldByOther}
        aria-label={`Seat ${seat.seatId} ${tierName} ₹${price}`}
        className={`relative flex flex-col items-center justify-center border transition-all duration-150 select-none ${sizeClasses} ${seatStyleClasses}`}
      >
        {/* Armrest accents for Recliner */}
        {isRecliner && (
          <>
            <span className="absolute -left-1 inset-y-1.5 w-1 rounded-l bg-slate-600/40 group-hover:bg-neonCyan/50 pointer-events-none"></span>
            <span className="absolute -right-1 inset-y-1.5 w-1 rounded-r bg-slate-600/40 group-hover:bg-neonCyan/50 pointer-events-none"></span>
          </>
        )}

        {icon ? icon : <span>{seat.seatNumber}</span>}
      </button>

      {/* Hover Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
        <div className="px-2.5 py-1 rounded-md bg-obsidian-900/95 border border-charcoalBorder-light text-[10px] text-white whitespace-nowrap shadow-xl">
          <div className="font-bold text-neonCyan">{seat.seatId}</div>
          <div className="text-slate-400">{tierName} • ₹{price}</div>
          <div className="text-[9px] text-slate-500 capitalize">
            {isBooked ? 'Sold' : isHeldByOther ? 'Locked by another user' : isSelectedBySelf ? 'Selected' : 'Available'}
          </div>
        </div>
        <div className="w-1.5 h-1.5 bg-obsidian-900 border-r border-b border-charcoalBorder-light rotate-45 -mt-1"></div>
      </div>
    </div>
  );
}
