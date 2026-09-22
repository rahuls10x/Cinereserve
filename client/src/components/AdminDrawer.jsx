import React, { useEffect, useState } from 'react';
import {
  X,
  SlidersHorizontal,
  TrendingUp,
  Armchair,
  Clock,
  CheckCircle2,
  DollarSign,
  Terminal,
  RotateCcw,
  RefreshCw,
  Layers
} from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import axios from 'axios';

export function AdminDrawer({ showId, onResetShow }) {
  const {
    isAdminDrawerOpen,
    setAdminDrawerOpen,
    liveActivityLogs,
    addActivityLog
  } = useBookingStore();

  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAdminMetrics = async () => {
    if (!showId) return;
    try {
      setIsLoading(true);
      const res = await axios.get(`/api/admin/shows/${showId}/occupancy`);
      setMetrics(res.data);
    } catch (e) {
      console.error('Failed to fetch admin occupancy:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminDrawerOpen && showId) {
      fetchAdminMetrics();
      const interval = setInterval(fetchAdminMetrics, 3000);
      return () => clearInterval(interval);
    }
  }, [isAdminDrawerOpen, showId]);

  if (!isAdminDrawerOpen) return null;

  const totalCapacity = metrics?.screenTotalCapacity || 72;
  const bookedCount = metrics?.confirmedBookingsCount || 0;
  const heldCount = metrics?.activeHoldsCount || 0;
  const availableCount = metrics?.availableSeatsCount || Math.max(0, totalCapacity - bookedCount - heldCount);
  const grossRevenue = metrics?.grossRevenue || 0;

  const bookedPercent = Number(((bookedCount / totalCapacity) * 100).toFixed(1));
  const heldPercent = Number(((heldCount / totalCapacity) * 100).toFixed(1));
  const freePercent = Math.max(0, Number((100 - bookedPercent - heldPercent).toFixed(1)));

  const handleResetData = async () => {
    if (!confirm('Are you sure you want to reset all seat reservations and locks for this show?')) return;
    try {
      await axios.post(`/api/admin/shows/${showId}/reset`);
      addActivityLog({
        message: 'Admin: Show inventory and locks successfully reset to default clean state.',
        type: 'INFO'
      });
      fetchAdminMetrics();
      if (onResetShow) onResetShow();
    } catch (e) {
      console.error('Reset error:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-obsidian-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slateCard-dark border-l border-charcoalBorder shadow-2xl h-full flex flex-col p-5 sm:p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-charcoalBorder pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-electricIndigo/20 border border-electricIndigo/30 text-electricIndigo-light">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Live Inventory Monitor
              </h2>
              <p className="text-[11px] text-slate-400">
                {metrics?.screenName || 'Audi 1'} • Real-Time Redis & DB State
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchAdminMetrics}
              disabled={isLoading}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slateCard transition-colors"
              title="Refresh metrics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setAdminDrawerOpen(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slateCard transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 1. Key Metrics Cards Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <div className="p-3 rounded-xl bg-slateCard border border-charcoalBorder">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <span>Total Capacity</span>
              <Armchair className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-xl font-extrabold text-white mt-1">
              {totalCapacity}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slateCard border border-charcoalBorder">
            <div className="flex items-center justify-between text-emeraldSuccess text-[10px] uppercase font-bold tracking-wider">
              <span>Booked (Sold)</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-extrabold text-emeraldSuccess mt-1">
              {bookedCount}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slateCard border border-charcoalBorder">
            <div className="flex items-center justify-between text-amberHold text-[10px] uppercase font-bold tracking-wider">
              <span>On Hold (Redis)</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-extrabold text-amberHold mt-1">
              {heldCount}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slateCard border border-charcoalBorder">
            <div className="flex items-center justify-between text-neonCyan text-[10px] uppercase font-bold tracking-wider">
              <span>Gross Revenue</span>
              <DollarSign className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-extrabold text-neonCyan mt-1">
              ₹{grossRevenue.toLocaleString()}
            </div>
          </div>
        </div>

        {/* 2. Visual Segmented Occupancy Progress Bar */}
        <div className="mb-6 p-4 rounded-2xl bg-slateCard border border-charcoalBorder">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
            <span>Occupancy Ratio</span>
            <span className="text-white">{bookedPercent}% Confirmed</span>
          </div>

          {/* Segmented Bar */}
          <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex">
            <div
              style={{ width: `${bookedPercent}%` }}
              className="bg-emeraldSuccess transition-all duration-500"
              title={`Booked: ${bookedPercent}%`}
            ></div>
            <div
              style={{ width: `${heldPercent}%` }}
              className="bg-amberHold transition-all duration-500 animate-pulse"
              title={`Held: ${heldPercent}%`}
            ></div>
            <div
              style={{ width: `${freePercent}%` }}
              className="bg-slate-700 transition-all duration-500"
              title={`Available: ${freePercent}%`}
            ></div>
          </div>

          {/* Bar Legend */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emeraldSuccess"></span> {bookedCount} Sold ({bookedPercent}%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amberHold"></span> {heldCount} Held ({heldPercent}%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-600"></span> {availableCount} Free
            </span>
          </div>
        </div>

        {/* 3. Tier-wise Inventory Breakdown */}
        {metrics?.tierStats && (
          <div className="mb-6 p-4 rounded-2xl bg-slateCard border border-charcoalBorder text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-300 mb-3">
              <Layers className="w-3.5 h-3.5 text-electricIndigo-light" />
              <span>Tier Occupancy Distribution</span>
            </div>
            <div className="space-y-2">
              {Object.entries(metrics.tierStats).map(([tierKey, stat]) => (
                <div key={tierKey} className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-obsidian/60 border border-charcoalBorder/50">
                  <span className="font-bold text-slate-200">{tierKey}</span>
                  <div className="flex items-center gap-3 text-slate-400">
                    <span className="text-emeraldSuccess font-semibold">{stat.booked} sold</span>
                    <span className="text-amberHold font-semibold">{stat.held} held</span>
                    <span>{stat.available} free</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Live Terminal Activity Feed */}
        <div className="flex-1 flex flex-col p-4 rounded-2xl bg-obsidian border border-charcoalBorder font-mono text-[11px] min-h-[180px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-charcoalBorder/70 text-slate-400">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-neonCyan" />
              <span className="font-bold text-slate-300">Live Activity Feed</span>
            </div>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">
              Streaming
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-56">
            {liveActivityLogs.map((log, index) => (
              <div key={index} className="leading-tight">
                <span className="text-slate-500">[{log.timestamp}] </span>
                <span
                  className={
                    log.type === 'LOCK'
                      ? 'text-amberHold'
                      : log.type === 'BOOK'
                      ? 'text-emeraldSuccess font-bold'
                      : log.type === 'RELEASE'
                      ? 'text-neonCyan'
                      : log.type === 'ERROR'
                      ? 'text-roseDanger font-bold'
                      : 'text-slate-300'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Demo Control Actions */}
        <div className="mt-5 pt-3 border-t border-charcoalBorder">
          <button
            onClick={handleResetData}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slateCard hover:bg-roseDanger/10 text-slate-400 hover:text-roseDanger border border-charcoalBorder hover:border-roseDanger/40 text-xs font-bold transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Show Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}
