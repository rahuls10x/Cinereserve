import React, { useState } from 'react';
import { ArrowRight, Lock, Loader2, Sparkles, X } from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import axios from 'axios';

export function CheckoutDock({ showId }) {
  const {
    selectedSeats,
    clearSelection,
    setHoldSession,
    setConflictAlert,
    addActivityLog
  } = useBookingStore();

  const [isLocking, setIsLocking] = useState(false);

  if (!selectedSeats || selectedSeats.length === 0) {
    return null;
  }

  const subtotal = selectedSeats.reduce((acc, curr) => acc + curr.price, 0);

  const handleProceedToLock = async () => {
    try {
      setIsLocking(true);
      const seatIds = selectedSeats.map((s) => s.seatId);

      const response = await axios.post('/api/bookings/hold', {
        showId,
        seats: seatIds,
        userId: `usr_${Math.floor(100000 + Math.random() * 900000)}`
      });

      if (response.data.success) {
        setHoldSession({
          holdToken: response.data.holdToken,
          expiresAt: response.data.expiresAt,
          ttlSeconds: response.data.ttlSeconds,
          pricingBreakdown: response.data.pricingBreakdown
        });
        addActivityLog({
          message: `Hold acquired for [${seatIds.join(', ')}]. Starting 300s lock countdown.`,
          type: 'LOCK'
        });
      }
    } catch (err) {
      console.error('Hold acquisition error:', err);
      const conflictedSeats = err.response?.data?.conflictedSeats || [];
      const errorMsg = err.response?.data?.message || 'Selected seats are no longer available.';

      setConflictAlert({
        message: errorMsg,
        conflictedSeats
      });

      addActivityLog({
        message: `Conflict Error: ${errorMsg}`,
        type: 'ERROR'
      });
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 p-4 sm:p-6 flex justify-center pointer-events-none">
      <div className="w-full max-w-4xl glass-dock rounded-3xl p-4 sm:p-5 shadow-2xl border border-charcoalBorder/90 flex flex-col sm:flex-row items-center justify-between gap-4 pointer-events-auto animate-in fade-in slide-in-from-bottom-6 duration-300">
        {/* Left: Selected seat chips & subtotal */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Selected ({selectedSeats.length}/6):
            </span>
            <button
              onClick={clearSelection}
              className="text-[11px] text-slate-400 hover:text-roseDanger flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 max-h-16 overflow-y-auto">
            {selectedSeats.map((seat) => (
              <span
                key={seat.seatId}
                className="px-2.5 py-1 rounded-lg bg-neonCyan/10 border border-neonCyan/40 text-neonCyan text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <span>{seat.seatId}</span>
                <span className="text-[10px] text-slate-400 font-normal">({seat.tier})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Right: Subtotal & Glowing CTA */}
        <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-charcoalBorder/60">
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">
              Subtotal
            </span>
            <span className="text-xl font-extrabold text-white tracking-tight">
              ₹{subtotal}
            </span>
          </div>

          <button
            onClick={handleProceedToLock}
            disabled={isLocking}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-electricIndigo to-electricIndigo-hover hover:from-electricIndigo-hover hover:to-indigo-600 text-white font-bold text-sm shadow-neon-indigo hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 cursor-pointer"
          >
            {isLocking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Locking Seats in Redis...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Lock Seats & Pay ({selectedSeats.length})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
