import React from 'react';
import { Film, Activity, SlidersHorizontal, Ticket, ChevronRight, RefreshCw } from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import { Link, useNavigate } from 'react-router-dom';

export function Navbar({ isConnected, movieTitle, theaterInfo, showTime, onRefreshLayout }) {
  const { toggleAdminDrawer, isAdminDrawerOpen } = useBookingStore();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-charcoalBorder/80 bg-obsidian/90 backdrop-blur-md px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group focus:outline-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electricIndigo to-neonCyan flex items-center justify-center shadow-neon-indigo group-hover:scale-105 transition-transform">
            <Film className="w-5 h-5 text-white stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-white font-sans">
                Cine<span className="text-neonCyan">Reserve</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-electricIndigo/20 text-electricIndigo-light border border-electricIndigo/30">
                PROTOTYPE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5 tracking-wide hidden sm:block">
              Distributed In-Memory Concurrency
            </p>
          </div>
        </Link>

        {/* Center: Movie & Show Context Pill */}
        {movieTitle && (
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-slateCard/90 border border-charcoalBorder shadow-inner text-xs text-slate-300">
            <span className="font-semibold text-white truncate max-w-[140px] lg:max-w-[200px]">
              {movieTitle}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 truncate max-w-[150px]">
              {theaterInfo || 'PVR Superplex'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-neonCyan font-medium">
              {showTime || 'Today, 07:30 PM'}
            </span>
          </div>
        )}

        {/* Right: Live Sync Indicator + Admin Drawer Toggle */}
        <div className="flex items-center gap-3">
          {/* Refresh layout button */}
          {onRefreshLayout && (
            <button
              onClick={onRefreshLayout}
              title="Refresh seat availability"
              className="p-2 rounded-lg bg-slateCard hover:bg-slateCard-light border border-charcoalBorder text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* Live Sync Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slateCard/90 border border-charcoalBorder text-xs font-medium">
            <span className="relative flex h-2.5 w-2.5">
              {isConnected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emeraldSuccess opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emeraldSuccess"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-roseDanger"></span>
              )}
            </span>
            <span className={isConnected ? 'text-slate-300' : 'text-roseDanger'}>
              {isConnected ? 'Live Sync Active' : 'Connecting...'}
            </span>
          </div>

          {/* Admin Dashboard Toggle */}
          <button
            onClick={toggleAdminDrawer}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              isAdminDrawerOpen
                ? 'bg-electricIndigo text-white border-electricIndigo shadow-neon-indigo'
                : 'bg-slateCard hover:bg-slateCard-light text-slate-300 border-charcoalBorder hover:border-slate-500'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin Monitor</span>
          </button>
        </div>
      </div>
    </header>
  );
}
