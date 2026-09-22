import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  Loader2,
  RefreshCw,
  X
} from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import { useSocket } from '../hooks/useSocket';
import { Navbar } from '../components/Navbar';
import { ScreenArch } from '../components/ScreenArch';
import { SeatLegend } from '../components/SeatLegend';
import { SeatTier } from '../components/SeatGrid/SeatTier';
import { CheckoutDock } from '../components/CheckoutDock';
import { CheckoutModal } from '../components/CheckoutModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { AdminDrawer } from '../components/AdminDrawer';

export function SeatMapPage() {
  const { showId } = useParams();
  const navigate = useNavigate();

  const {
    showLayout,
    setLayout,
    isLoadingLayout,
    setLoadingLayout,
    conflictAlert,
    clearConflictAlert,
    clearSelection
  } = useBookingStore();

  // Socket connection hook
  const { isConnected } = useSocket(showId);

  const fetchLayout = useCallback(async () => {
    if (!showId) return;
    try {
      setLoadingLayout(true);
      const res = await axios.get(`/api/shows/${showId}/layout`);
      setLayout(res.data);
    } catch (err) {
      console.error('Failed to load layout:', err);
      setLoadingLayout(false);
    }
  }, [showId, setLayout, setLoadingLayout]);

  useEffect(() => {
    fetchLayout();
    clearSelection();
  }, [fetchLayout]);

  const movie = showLayout?.movie;
  const theater = showLayout?.theater;
  const screen = showLayout?.screen;
  const showTimeStr = showLayout?.startTime
    ? new Date(showLayout.startTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '07:30 PM';

  return (
    <div className="min-h-screen bg-obsidian text-slate-100 flex flex-col pb-36 selection:bg-neonCyan/30">
      {/* Global Navigation Header */}
      <Navbar
        isConnected={isConnected}
        movieTitle={movie?.title}
        theaterInfo={`${theater?.name || 'PVR Superplex'}, ${screen?.name || 'Screen 3'}`}
        showTime={`Today, ${showTimeStr} (${screen?.format || 'IMAX 2D'})`}
        onRefreshLayout={fetchLayout}
      />

      {/* Main Seating Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6">
        {/* Breadcrumb Back Button */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slateCard/80 hover:bg-slateCard border border-charcoalBorder transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Change Movie / Showtime</span>
          </button>

          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            Screen Room: <span className="text-neonCyan">show:{showId}</span>
          </div>
        </div>

        {/* Real-time Conflict Alert Toast / Banner */}
        {conflictAlert && (
          <div className="mb-6 p-4 rounded-2xl bg-roseDanger/15 border border-roseDanger/50 shadow-neon-indigo flex items-start justify-between gap-3 text-xs text-roseDanger animate-in slide-in-from-top duration-300">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-roseDanger" />
              <div>
                <h4 className="font-bold text-sm text-white">
                  Seat Lock Conflict
                </h4>
                <p className="mt-0.5 text-slate-300 leading-relaxed">
                  {conflictAlert.message}
                </p>
                {conflictAlert.conflictedSeats && conflictAlert.conflictedSeats.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-semibold">
                      Contended Seats:
                    </span>
                    {conflictAlert.conflictedSeats.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded bg-roseDanger/20 border border-roseDanger/40 text-white font-bold"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                clearConflictAlert();
                fetchLayout();
              }}
              className="p-1.5 rounded-lg hover:bg-roseDanger/20 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Cinema Screen Arch */}
        <ScreenArch />

        {/* Seat Legend Bar */}
        <SeatLegend />

        {/* Seating Layout Canvas */}
        {isLoadingLayout && !showLayout ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-neonCyan animate-spin" />
            <span className="text-xs text-slate-400 font-mono">
              Fetching physical geometry & live locks...
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {showLayout?.tiers?.map((tier) => (
              <SeatTier key={tier.name} tier={tier} />
            ))}
          </div>
        )}
      </main>

      {/* Sticky Floating Checkout Dock */}
      <CheckoutDock showId={showId} />

      {/* 5-Minute Hold Checkout Modal */}
      <CheckoutModal showId={showId} movieTitle={movie?.title} />

      {/* Success Confirmation Modal */}
      <ConfirmationModal />

      {/* Collapsible Admin Inspection Drawer */}
      <AdminDrawer showId={showId} onResetShow={fetchLayout} />
    </div>
  );
}
