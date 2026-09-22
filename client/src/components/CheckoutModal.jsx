import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Receipt,
  Ticket
} from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import { useAuthStore } from '../store/useAuthStore';
import { useCountdown } from '../hooks/useCountdown';
import axios from 'axios';

export function CheckoutModal({ showId, movieTitle }) {
  const {
    isCheckoutModalOpen,
    setCheckoutModalOpen,
    holdToken,
    expiresAt,
    pricingBreakdown,
    selectedSeats,
    clearHoldSession,
    setConfirmedBooking,
    addActivityLog
  } = useBookingStore();

  const user = useAuthStore((s) => s.user);

  const [customerName, setCustomerName] = useState(user?.name || 'Rahul Sharma');
  const [customerEmail, setCustomerEmail] = useState(user?.email || 'rahul@example.com');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '+91 98765 43210');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentActionType, setPaymentActionType] = useState(null); // 'SUCCESS' | 'FAILURE'
  const [errorMsg, setErrorMsg] = useState(null);

  // Sync with user if changed
  React.useEffect(() => {
    if (user) {
      if (user.name) setCustomerName(user.name);
      if (user.email) setCustomerEmail(user.email);
      if (user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);

  // Timer hook
  const { formatted, isExpired } = useCountdown(expiresAt, async () => {
    // When timer expires
    addActivityLog({
      message: 'Hold timer reached 00:00! Hold expired and released.',
      type: 'RELEASE'
    });
  });

  if (!isCheckoutModalOpen || !holdToken) {
    return null;
  }

  const handleCloseOrRelease = async () => {
    try {
      if (holdToken) {
        await axios.post('/api/bookings/release', { holdToken });
        addActivityLog({
          message: 'User released hold manually.',
          type: 'RELEASE'
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      clearHoldSession();
    }
  };

  const handleSimulatePayment = async (status) => {
    try {
      setIsProcessingPayment(true);
      setPaymentActionType(status);
      setErrorMsg(null);

      const response = await axios.post('/api/bookings/confirm', {
        holdToken,
        mockPaymentStatus: status,
        customerDetails: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone
        }
      });

      if (status === 'SUCCESS' && response.data.success) {
        addActivityLog({
          message: `Payment SUCCESS! Confirmed Booking Ref: ${response.data.bookingId}`,
          type: 'BOOK'
        });
        setConfirmedBooking({
          ...response.data.booking,
          movieTitle: movieTitle || 'Oppenheimer',
          ticketQr: response.data.ticketQr,
          bookingReference: response.data.bookingId
        });
      } else {
        // Payment Failure Simulation
        addActivityLog({
          message: 'Payment Simulated as FAILED. Locks released back to availability.',
          type: 'RELEASE'
        });
        clearHoldSession();
      }
    } catch (err) {
      console.error('Payment confirmation error:', err);
      const errText = err.response?.data?.message || 'Transaction could not be processed.';
      setErrorMsg(errText);
      if (err.response?.status === 410) {
        // Expired
        setTimeout(() => {
          clearHoldSession();
        }, 2500);
      }
    } finally {
      setIsProcessingPayment(false);
      setPaymentActionType(null);
    }
  };

  const baseAmount = pricingBreakdown?.baseAmount || selectedSeats.reduce((a, b) => a + b.price, 0);
  const convenienceFee = pricingBreakdown?.convenienceFee || 30;
  const taxAmount = pricingBreakdown?.taxAmount || Math.round(baseAmount * 0.18);
  const grandTotal = pricingBreakdown?.grandTotal || (baseAmount + convenienceFee + taxAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-900/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-xl glass-modal rounded-3xl p-6 sm:p-8 shadow-2xl border border-charcoalBorder-light relative my-8">
        {/* Close button */}
        <button
          onClick={handleCloseOrRelease}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slateCard transition-colors"
        >
          <XCircle className="w-6 h-6" />
        </button>

        {/* 1. Header with 5-Minute Hold Timer */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-amberHold/10 border border-amberHold/40 shadow-neon-amber mb-3">
            <Clock className="w-5 h-5 text-amberHold animate-spin duration-1000" />
            <span className="font-mono text-2xl font-black text-amberHold tracking-widest">
              {isExpired ? '00:00' : formatted}
            </span>
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            Checkout & Temporary Seat Hold
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {isExpired ? (
              <span className="text-roseDanger font-medium">
                Hold expired! Seats have been automatically returned to the inventory.
              </span>
            ) : (
              'Seats temporarily locked in Redis. Complete payment before the timer reaches zero.'
            )}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-roseDanger/10 border border-roseDanger/30 flex items-center gap-2.5 text-xs text-roseDanger">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 2. Customer Details */}
        <div className="mb-5 p-4 rounded-2xl bg-slateCard/60 border border-charcoalBorder/60 space-y-3">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Guest Details
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-obsidian/80 border border-charcoalBorder">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full Name"
                className="bg-transparent text-white focus:outline-none w-full"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-obsidian/80 border border-charcoalBorder">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Email Address"
                className="bg-transparent text-white focus:outline-none w-full"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-obsidian/80 border border-charcoalBorder">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Mobile Number"
                className="bg-transparent text-white focus:outline-none w-full"
              />
            </div>
          </div>
        </div>

        {/* 3. Itemized Price Breakdown */}
        <div className="mb-6 p-4 rounded-2xl bg-slateCard/60 border border-charcoalBorder/60 text-xs">
          <div className="flex items-center justify-between border-b border-charcoalBorder/60 pb-2 mb-3">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Receipt className="w-4 h-4 text-electricIndigo-light" />
              <span>Order Summary</span>
            </div>
            <span className="text-neonCyan font-bold">
              {selectedSeats.map((s) => s.seatId).join(', ')} ({selectedSeats.length} seats)
            </span>
          </div>

          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Seat Base Fare</span>
              <span className="font-medium text-white">₹{baseAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Convenience Fee (Flat)</span>
              <span className="font-medium text-white">₹{convenienceFee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Integrated GST (18%)</span>
              <span className="font-medium text-white">₹{taxAmount}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-charcoalBorder/60 text-sm font-bold text-white">
              <span>Grand Total</span>
              <span className="text-neonCyan text-base font-extrabold">₹{grandTotal}</span>
            </div>
          </div>
        </div>

        {/* 4. Mock Payment Engine Playground */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slateCard to-obsidian border border-electricIndigo/30 shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emeraldSuccess" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Mock Payment Engine
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold text-amberHold bg-amberHold/10 px-2 py-0.5 rounded border border-amberHold/30">
              Prototype Mode
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-4">
            Test atomic lock commitment and rollback lifecycle without real payment gateways.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Instant Success Button */}
            <button
              onClick={() => handleSimulatePayment('SUCCESS')}
              disabled={isProcessingPayment || isExpired}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emeraldSuccess hover:bg-emeraldSuccess-hover text-obsidian font-bold text-xs shadow-neon-emerald hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isProcessingPayment && paymentActionType === 'SUCCESS' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-obsidian" />
                  <span>Committing Txn...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simulate Instant Success</span>
                </>
              )}
            </button>

            {/* Failure Simulation Button */}
            <button
              onClick={() => handleSimulatePayment('FAILURE')}
              disabled={isProcessingPayment || isExpired}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-transparent hover:bg-roseDanger/10 border border-roseDanger/60 text-roseDanger font-bold text-xs hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isProcessingPayment && paymentActionType === 'FAILURE' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-roseDanger" />
                  <span>Aborting Hold...</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  <span>Simulate Failure / Abort</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
