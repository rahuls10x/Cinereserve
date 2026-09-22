import React, { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  Download,
  Film,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Sparkles,
  ArrowRight,
  Share2
} from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import { useNavigate } from 'react-router-dom';

export function ConfirmationModal() {
  const { isConfirmationModalOpen, confirmedBooking, setConfirmationModalOpen } = useBookingStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isConfirmationModalOpen) {
      // Trigger festive confetti burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06B6D4', '#6366F1', '#10B981', '#F59E0B']
      });
    }
  }, [isConfirmationModalOpen]);

  if (!isConfirmationModalOpen || !confirmedBooking) {
    return null;
  }

  const bookingRef = confirmedBooking.bookingReference || confirmedBooking.bookingId || '#CR-982410';
  const qrData = confirmedBooking.qrCodeToken || confirmedBooking.ticketQr || `CR-SECURE-${bookingRef}`;
  const seatIds = Array.isArray(confirmedBooking.seats)
    ? confirmedBooking.seats.map((s) => (typeof s === 'string' ? s : s.seatId))
    : [];

  const handleDownloadMock = () => {
    alert(`Mock ticket pass downloaded for Booking ${bookingRef}!`);
  };

  const handleBookAnother = () => {
    setConfirmationModalOpen(false);
    navigate('/');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-900/85 backdrop-blur-lg overflow-y-auto animate-in fade-in duration-300">
      <div className="w-full max-w-lg glass-modal rounded-3xl p-6 sm:p-8 shadow-2xl border border-charcoalBorder-light relative my-6">
        {/* Success Header Pill */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emeraldSuccess/20 border border-emeraldSuccess/40 flex items-center justify-center text-emeraldSuccess shadow-neon-emerald mb-3 animate-bounce">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Booking Confirmed!
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Your seats are permanently reserved in the database.
          </p>
        </div>

        {/* Boarding Pass Ticket Container */}
        <div className="rounded-2xl bg-slateCard/90 border border-charcoalBorder overflow-hidden shadow-2xl relative">
          {/* Top Banner strip */}
          <div className="h-2 bg-gradient-to-r from-neonCyan via-electricIndigo to-emeraldSuccess"></div>

          <div className="p-5 sm:p-6 space-y-4">
            {/* Movie Title & Booking Reference */}
            <div className="flex items-start justify-between gap-4 border-b border-charcoalBorder/60 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-neonCyan block">
                  CineReserve Digital Pass
                </span>
                <h3 className="text-lg font-bold text-white leading-snug">
                  {confirmedBooking.movieTitle || 'Oppenheimer'}
                </h3>
                <span className="text-xs text-slate-400">
                  IMAX 2D • Screen 3 • PVR Superplex
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-slate-400 block font-mono">
                  Ref Code
                </span>
                <span className="font-mono text-xs font-bold text-slate-200 bg-obsidian/80 px-2 py-1 rounded border border-charcoalBorder">
                  {bookingRef}
                </span>
              </div>
            </div>

            {/* Seat & Schedule Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-obsidian/60 border border-charcoalBorder/40">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Seats
                </span>
                <span className="text-base font-black text-neonCyan tracking-tight">
                  {seatIds.join(', ')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-obsidian/60 border border-charcoalBorder/40">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Showtime
                </span>
                <span className="font-bold text-slate-200">
                  Today, 07:30 PM
                </span>
              </div>

              <div className="p-3 rounded-xl bg-obsidian/60 border border-charcoalBorder/40 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Amount Paid
                </span>
                <span className="font-bold text-emeraldSuccess">
                  ₹{confirmedBooking.pricingBreakdown?.grandTotal || confirmedBooking.amountPaid || 930}
                </span>
              </div>
            </div>

            {/* Turnstile QR Code */}
            <div className="pt-2 flex flex-col items-center justify-center">
              <div className="p-3 bg-white rounded-2xl shadow-xl">
                <QRCodeSVG
                  value={qrData}
                  size={120}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider mt-2">
                Scan at Theater Turnstile #{bookingRef}
              </p>
            </div>
          </div>

          {/* Ticket Tear Perforations (Decorative Cutouts) */}
          <div className="absolute top-[168px] -left-3 w-6 h-6 rounded-full bg-obsidian border border-charcoalBorder"></div>
          <div className="absolute top-[168px] -right-3 w-6 h-6 rounded-full bg-obsidian border border-charcoalBorder"></div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleDownloadMock}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slateCard hover:bg-slateCard-light border border-charcoalBorder text-xs font-bold text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Pass</span>
          </button>

          <button
            onClick={handleBookAnother}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-electricIndigo hover:bg-electricIndigo-hover text-xs font-bold text-white shadow-neon-indigo transition-all"
          >
            <span>Book Another Movie</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
