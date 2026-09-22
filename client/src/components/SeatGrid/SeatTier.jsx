import React from 'react';
import { SeatButton } from './SeatButton';
import { Crown, Sparkles, Armchair } from 'lucide-react';

export function SeatTier({ tier }) {
  const isRecliner = tier.name === 'RECLINER';
  const isPrime = tier.name === 'PRIME';

  return (
    <div className="w-full max-w-4xl mx-auto my-7 p-4 sm:p-6 rounded-3xl glass-panel bg-slateCard/40 border border-charcoalBorder/60">
      {/* Tier Header Bar */}
      <div className="flex items-center justify-between border-b border-charcoalBorder/50 pb-3 mb-5">
        <div className="flex items-center gap-2.5">
          {isRecliner ? (
            <div className="p-1.5 rounded-lg bg-amberHold/10 border border-amberHold/30 text-amberHold">
              <Crown className="w-4 h-4" />
            </div>
          ) : isPrime ? (
            <div className="p-1.5 rounded-lg bg-electricIndigo/10 border border-electricIndigo/30 text-electricIndigo-light">
              <Sparkles className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-1.5 rounded-lg bg-slate-700/30 border border-slate-600/30 text-slate-400">
              <Armchair className="w-4 h-4" />
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold tracking-wide text-white uppercase font-sans">
              {tier.name} SECTION
            </h3>
            {isRecliner && (
              <span className="text-[10px] text-amberHold-light font-medium tracking-wider uppercase">
                Luxury Lounger • Extra Legroom
              </span>
            )}
          </div>
        </div>

        {/* Price Tag Pill */}
        <div className="px-3.5 py-1 rounded-full bg-slateCard border border-charcoalBorder text-xs font-bold text-slate-200">
          ₹{tier.price} <span className="text-[10px] font-normal text-slate-400">/ seat</span>
        </div>
      </div>

      {/* Row Grid */}
      <div className="flex flex-col gap-3.5 items-center">
        {tier.rows.map((row) => {
          // Split row into two clusters for central walking aisle if seats count >= 6
          const halfIndex = Math.ceil(row.seats.length / 2);
          const leftSeats = row.seats.slice(0, halfIndex);
          const rightSeats = row.seats.slice(halfIndex);

          return (
            <div key={row.rowId} className="flex items-center gap-3 sm:gap-4 w-full justify-center">
              {/* Row Label (Left) */}
              <span className="w-5 text-xs font-bold text-slate-400 text-center select-none">
                {row.rowId}
              </span>

              {/* Left Cluster */}
              <div className="flex items-center gap-2 sm:gap-2.5">
                {leftSeats.map((seat) => (
                  <SeatButton
                    key={seat.seatId}
                    seat={seat}
                    tierName={tier.name}
                    price={tier.price}
                  />
                ))}
              </div>

              {/* Central Aisle Gap */}
              <div className="w-6 sm:w-10 flex items-center justify-center text-[10px] text-slate-600 select-none">
                •
              </div>

              {/* Right Cluster */}
              <div className="flex items-center gap-2 sm:gap-2.5">
                {rightSeats.map((seat) => (
                  <SeatButton
                    key={seat.seatId}
                    seat={seat}
                    tierName={tier.name}
                    price={tier.price}
                  />
                ))}
              </div>

              {/* Row Label (Right) */}
              <span className="w-5 text-xs font-bold text-slate-400 text-center select-none">
                {row.rowId}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
