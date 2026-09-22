import React, { useEffect, useState, useCallback } from 'react';
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
  Layers,
  PlusCircle,
  Calendar,
  Film,
  Building,
  Sparkles,
  Info,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import { useAuthStore } from '../store/useAuthStore';
import axios from 'axios';

export function AdminDrawer({ showId: initialShowId, onResetShow }) {
  const {
    isAdminDrawerOpen,
    setAdminDrawerOpen,
    liveActivityLogs,
    addActivityLog
  } = useBookingStore();

  const { isAdmin } = useAuthStore();

  const [activeTab, setActiveTab] = useState('monitor'); // 'monitor' | 'create-show'
  const [selectedShowId, setSelectedShowId] = useState(initialShowId || '');
  const [allShows, setAllShows] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [layoutData, setLayoutData] = useState(null);
  const [selectedSeatDetail, setSelectedSeatDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Form state for creating a new show
  const [metadata, setMetadata] = useState({ movies: [], theaters: [] });
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [selectedTheaterId, setSelectedTheaterId] = useState('');
  const [selectedScreenNumber, setSelectedScreenNumber] = useState(1);
  const [showStartTime, setShowStartTime] = useState('');
  const [tierPricing, setTierPricing] = useState({
    RECLINER: 450,
    PRIME: 280,
    CLASSIC: 180
  });
  const [isSubmittingShow, setIsSubmittingShow] = useState(false);
  const [formFeedback, setFormFeedback] = useState(null);

  // Sync initialShowId
  useEffect(() => {
    if (initialShowId && !selectedShowId) {
      setSelectedShowId(initialShowId);
    }
  }, [initialShowId, selectedShowId]);

  // Fetch all shows for the show selector
  const fetchAllShows = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await axios.get('/api/admin/shows');
      if (res.data?.data) {
        setAllShows(res.data.data);
        if (!selectedShowId && res.data.data.length > 0) {
          setSelectedShowId(res.data.data[0]._id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch admin shows list:', e);
    }
  }, [isAdmin, selectedShowId]);

  // Fetch admin metadata (movies & theaters)
  const fetchMetadata = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await axios.get('/api/admin/metadata');
      if (res.data?.data) {
        setMetadata(res.data.data);
        if (res.data.data.movies?.length > 0 && !selectedMovieId) {
          setSelectedMovieId(res.data.data.movies[0]._id);
        }
        if (res.data.data.theaters?.length > 0 && !selectedTheaterId) {
          setSelectedTheaterId(res.data.data.theaters[0]._id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch admin metadata:', e);
    }
  }, [isAdmin, selectedMovieId, selectedTheaterId]);

  // Fetch telemetry metrics & layout for currently selected show
  const fetchShowDetails = useCallback(async () => {
    const currentId = selectedShowId || initialShowId;
    if (!currentId || !isAdmin) return;
    try {
      setIsLoading(true);
      const [metricsRes, layoutRes] = await Promise.all([
        axios.get(`/api/admin/shows/${currentId}/occupancy`),
        axios.get(`/api/shows/${currentId}/layout`)
      ]);
      setMetrics(metricsRes.data);
      setLayoutData(layoutRes.data);
    } catch (e) {
      console.error('Failed to fetch admin show metrics & layout:', e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedShowId, initialShowId, isAdmin]);

  useEffect(() => {
    if (isAdminDrawerOpen && isAdmin) {
      fetchAllShows();
      fetchMetadata();
      fetchShowDetails();

      const interval = setInterval(() => {
        fetchShowDetails();
        fetchAllShows();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isAdminDrawerOpen, isAdmin, fetchAllShows, fetchMetadata, fetchShowDetails]);

  if (!isAdminDrawerOpen || !isAdmin) return null;

  const totalCapacity = metrics?.screenTotalCapacity || 72;
  const bookedCount = metrics?.confirmedBookingsCount || 0;
  const heldCount = metrics?.activeHoldsCount || 0;
  const availableCount = metrics?.availableSeatsCount || Math.max(0, totalCapacity - bookedCount - heldCount);
  const grossRevenue = metrics?.grossRevenue || 0;

  const bookedPercent = Number(((bookedCount / totalCapacity) * 100).toFixed(1));
  const heldPercent = Number(((heldCount / totalCapacity) * 100).toFixed(1));
  const freePercent = Math.max(0, Number((100 - bookedPercent - heldPercent).toFixed(1)));

  const handleResetData = async () => {
    const currentId = selectedShowId || initialShowId;
    if (!currentId) return;
    if (!confirm('Are you sure you want to reset all seat reservations and locks for this show?')) return;

    try {
      setIsResetting(true);
      await axios.post(`/api/admin/shows/${currentId}/reset`);
      addActivityLog({
        message: 'Admin: Show inventory and locks successfully reset to clean state.',
        type: 'INFO'
      });
      await fetchShowDetails();
      if (onResetShow) onResetShow();
    } catch (e) {
      console.error('Reset error:', e);
    } finally {
      setIsResetting(false);
    }
  };

  const handleCreateShow = async (e) => {
    e.preventDefault();
    if (!selectedMovieId || !selectedTheaterId || !showStartTime) {
      setFormFeedback({ type: 'error', message: 'Please select a movie, theater, screen, and start time.' });
      return;
    }

    try {
      setIsSubmittingShow(true);
      setFormFeedback(null);

      const res = await axios.post('/api/admin/shows', {
        movieId: selectedMovieId,
        theaterId: selectedTheaterId,
        screenNumber: parseInt(selectedScreenNumber, 10),
        startTime: new Date(showStartTime).toISOString(),
        customTierPricing: tierPricing
      });

      setFormFeedback({ type: 'success', message: 'New movie show scheduled successfully!' });
      addActivityLog({
        message: `Admin: Scheduled new show for ${res.data?.data?.movie?.title || 'movie'}.`,
        type: 'INFO'
      });

      // Refresh shows
      await fetchAllShows();
      if (res.data?.data?._id) {
        setSelectedShowId(res.data.data._id);
      }

      // Reset form
      setShowStartTime('');
      setTimeout(() => {
        setActiveTab('monitor');
        setFormFeedback(null);
      }, 1500);
    } catch (err) {
      setFormFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to create show. Please check inputs.'
      });
    } finally {
      setIsSubmittingShow(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex bg-obsidian-950/80 animate-in fade-in duration-200">
      <div className="w-full h-full flex flex-col bg-obsidian border-l border-charcoalBorder shadow-2xl overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-charcoalBorder px-6 py-4 bg-slateCard-dark">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-electricIndigo to-neonCyan text-white shadow-neon-indigo">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Admin Command Center & Auditorium Monitor
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emeraldSuccess/20 text-emeraldSuccess border border-emeraldSuccess/30">
                  REAL-TIME SYNC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direct Redis lock telemetry & live Mongo inventory monitoring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Show Selector Dropdown */}
            <div className="flex items-center gap-2 bg-obsidian px-3 py-1.5 rounded-xl border border-charcoalBorder text-xs">
              <Film className="w-3.5 h-3.5 text-neonCyan" />
              <select
                value={selectedShowId}
                onChange={(e) => {
                  setSelectedShowId(e.target.value);
                  setSelectedSeatDetail(null);
                }}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                {allShows.map((s) => (
                  <option key={s._id} value={s._id} className="bg-slateCard text-white">
                    {s.movie?.title} ({s.screenName}) - {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </option>
                ))}
              </select>
            </div>

            {/* Tab Switches */}
            <div className="flex bg-obsidian p-1 rounded-xl border border-charcoalBorder text-xs font-semibold">
              <button
                onClick={() => setActiveTab('monitor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'monitor'
                    ? 'bg-electricIndigo text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Auditorium Map & Stats</span>
              </button>
              <button
                onClick={() => setActiveTab('create-show')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'create-show'
                    ? 'bg-electricIndigo text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add New Show</span>
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchShowDetails}
              disabled={isLoading}
              title="Refresh telemetry"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slateCard border border-charcoalBorder transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Close */}
            <button
              onClick={() => setAdminDrawerOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slateCard border border-charcoalBorder transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body Split */}
        <div className="flex-1 flex overflow-hidden">
          
          {activeTab === 'monitor' ? (
            <>
              {/* LEFT: Live Interactive Auditorium Seat Map (NO BLUR, High Visibility) */}
              <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-obsidian-900/50 border-r border-charcoalBorder">
                
                {/* Cinema Screen Curved Arch Banner */}
                <div className="w-full max-w-2xl mx-auto mb-8 text-center">
                  <div className="relative">
                    <div className="h-2 w-full bg-gradient-to-r from-electricIndigo/20 via-neonCyan to-electricIndigo/20 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)]" />
                    <p className="text-[10px] tracking-[0.25em] uppercase font-bold text-slate-400 mt-2">
                      {layoutData?.screen?.name || 'Audi 1'} • 4K Laser Projection Screen
                    </p>
                  </div>
                </div>

                {/* Seat Status Legend Bar */}
                <div className="flex items-center justify-center gap-5 text-xs mb-6 p-2.5 rounded-xl bg-slateCard/80 border border-charcoalBorder max-w-xl mx-auto">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded border border-slate-600 bg-slate-800" />
                    <span className="text-slate-300 font-medium">Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded bg-amberHold animate-pulse" />
                    <span className="text-amberHold font-bold">On Hold (Redis Lock)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded bg-roseDanger" />
                    <span className="text-rose-400 font-bold">Booked (Confirmed)</span>
                  </div>
                </div>

                {/* Live Auditorium Grid */}
                <div className="flex-1 flex flex-col items-center justify-center gap-6 max-w-3xl mx-auto w-full">
                  {layoutData?.tiers?.map((tier) => (
                    <div key={tier.name} className="w-full bg-slateCard-dark/60 p-4 rounded-2xl border border-charcoalBorder/70">
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-charcoalBorder/50">
                        <span className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-electricIndigo-light" />
                          {tier.name}
                        </span>
                        <span className="text-xs font-mono font-semibold text-neonCyan">
                          ₹{tier.price}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {tier.rows.map((row) => (
                          <div key={row.rowId} className="flex items-center justify-center gap-2">
                            <span className="w-5 text-center text-xs font-mono font-bold text-slate-400">
                              {row.rowId}
                            </span>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              {row.seats.map((seat) => {
                                const isBooked = seat.status === 'BOOKED';
                                const isLocked = seat.status === 'LOCKED';
                                const isSelected = selectedSeatDetail?.seatId === seat.seatId;

                                return (
                                  <button
                                    key={seat.seatId}
                                    onClick={() => setSelectedSeatDetail({ ...seat, tier: tier.name, price: tier.price })}
                                    className={`relative w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                                      isBooked
                                        ? 'bg-roseDanger text-white shadow-sm'
                                        : isLocked
                                        ? 'bg-amberHold text-black font-extrabold animate-pulse shadow-neon-amber ring-2 ring-amberHold/60'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-charcoalBorder hover:border-slate-400'
                                    } ${isSelected ? 'ring-2 ring-neonCyan scale-110' : ''}`}
                                    title={`Seat ${seat.seatId} - ${seat.status}`}
                                  >
                                    {seat.seatNumber}
                                  </button>
                                );
                              })}
                            </div>
                            <span className="w-5 text-center text-xs font-mono font-bold text-slate-400">
                              {row.rowId}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Seat Inspector Pill */}
                {selectedSeatDetail && (
                  <div className="mt-6 p-4 rounded-2xl bg-slateCard border border-neonCyan/40 shadow-lg max-w-md mx-auto w-full animate-in slide-in-from-bottom duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-charcoalBorder">
                      <div className="flex items-center gap-2">
                        <Armchair className="w-4 h-4 text-neonCyan" />
                        <span className="text-sm font-bold text-white">
                          Seat {selectedSeatDetail.seatId} Inspector
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedSeatDetail(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div>
                        <span className="text-slate-400">Tier:</span> <span className="text-white font-semibold">{selectedSeatDetail.tier}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Price:</span> <span className="text-neonCyan font-semibold">₹{selectedSeatDetail.price}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Status:</span>{' '}
                        <span
                          className={`font-bold ${
                            selectedSeatDetail.status === 'BOOKED'
                              ? 'text-roseDanger'
                              : selectedSeatDetail.status === 'LOCKED'
                              ? 'text-amberHold'
                              : 'text-emeraldSuccess'
                          }`}
                        >
                          {selectedSeatDetail.status}
                        </span>
                      </div>
                      {selectedSeatDetail.holdToken && (
                        <div className="col-span-2 truncate">
                          <span className="text-slate-400">Hold Token:</span>{' '}
                          <code className="text-[10px] text-amberHold bg-obsidian px-1 py-0.5 rounded">
                            {selectedSeatDetail.holdToken}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: Live Telemetry, Tier Distribution, Socket Logs & Actions */}
              <div className="w-96 bg-slateCard-dark flex flex-col p-5 overflow-y-auto">
                
                {/* 1. Key Metrics Cards */}
                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  <div className="p-3 rounded-xl bg-slateCard border border-charcoalBorder">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      <span>Capacity</span>
                      <Armchair className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="text-xl font-extrabold text-white mt-1">
                      {totalCapacity}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slateCard border border-charcoalBorder">
                    <div className="flex items-center justify-between text-emeraldSuccess text-[10px] uppercase font-bold tracking-wider">
                      <span>Booked</span>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xl font-extrabold text-emeraldSuccess mt-1">
                      {bookedCount}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slateCard border border-charcoalBorder">
                    <div className="flex items-center justify-between text-amberHold text-[10px] uppercase font-bold tracking-wider">
                      <span>On Hold</span>
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xl font-extrabold text-amberHold mt-1">
                      {heldCount}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slateCard border border-charcoalBorder">
                    <div className="flex items-center justify-between text-neonCyan text-[10px] uppercase font-bold tracking-wider">
                      <span>Gross Rev</span>
                      <DollarSign className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xl font-extrabold text-neonCyan mt-1">
                      ₹{grossRevenue.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* 2. Visual Segmented Progress Bar */}
                <div className="mb-5 p-4 rounded-2xl bg-slateCard border border-charcoalBorder">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                    <span>Occupancy Ratio</span>
                    <span className="text-white">{bookedPercent}% Sold</span>
                  </div>

                  <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden flex">
                    <div
                      style={{ width: `${bookedPercent}%` }}
                      className="bg-emeraldSuccess transition-all duration-500"
                    />
                    <div
                      style={{ width: `${heldPercent}%` }}
                      className="bg-amberHold transition-all duration-500 animate-pulse"
                    />
                    <div
                      style={{ width: `${freePercent}%` }}
                      className="bg-slate-700 transition-all duration-500"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                    <span className="text-emeraldSuccess font-medium">{bookedCount} Sold</span>
                    <span className="text-amberHold font-medium">{heldCount} Held</span>
                    <span className="text-slate-400">{availableCount} Free</span>
                  </div>
                </div>

                {/* 3. Tier Distribution */}
                {metrics?.tierStats && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-slateCard border border-charcoalBorder text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-300 mb-2.5">
                      <Layers className="w-3.5 h-3.5 text-electricIndigo-light" />
                      <span>Tier Breakdown</span>
                    </div>
                    <div className="space-y-1.5">
                      {Object.entries(metrics.tierStats).map(([tierKey, stat]) => (
                        <div key={tierKey} className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-obsidian/60 border border-charcoalBorder/50">
                          <span className="font-bold text-slate-200">{tierKey}</span>
                          <div className="flex items-center gap-2.5 text-slate-400">
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
                <div className="flex-1 flex flex-col p-3.5 rounded-2xl bg-obsidian border border-charcoalBorder font-mono text-[11px] min-h-[140px] mb-4">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-charcoalBorder/70 text-slate-400">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-neonCyan" />
                      <span className="font-bold text-slate-300">Live Socket Activity</span>
                    </div>
                    <span className="text-[9px] text-emeraldSuccess font-bold uppercase tracking-wider">
                      Streaming
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-44">
                    {liveActivityLogs.slice(0, 15).map((log, index) => (
                      <div key={index} className="leading-tight text-[10px]">
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

                {/* 5. Show Reset Action */}
                <button
                  onClick={handleResetData}
                  disabled={isResetting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-roseDanger/10 hover:bg-roseDanger/20 text-rose-400 border border-roseDanger/30 text-xs font-bold transition-all"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                  <span>Reset Show Inventory (0 Bookings)</span>
                </button>
              </div>
            </>
          ) : (
            /* TAB 2: Add New Show Form */
            <div className="flex-1 p-8 overflow-y-auto max-w-2xl mx-auto w-full">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-neonCyan" />
                  Create & Schedule New Movie Show
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Configure movie, theater auditorium, start time, and custom tier pricing.
                </p>
              </div>

              {formFeedback && (
                <div
                  className={`mb-5 p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
                    formFeedback.type === 'success'
                      ? 'bg-emeraldSuccess/15 border border-emeraldSuccess/30 text-emerald-300'
                      : 'bg-roseDanger/15 border border-roseDanger/30 text-rose-300'
                  }`}
                >
                  {formFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emeraldSuccess" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-roseDanger" />
                  )}
                  <span>{formFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handleCreateShow} className="space-y-4">
                {/* Movie Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Select Movie
                  </label>
                  <select
                    value={selectedMovieId}
                    onChange={(e) => setSelectedMovieId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slateCard border border-charcoalBorder text-white text-xs focus:outline-none focus:border-neonCyan transition-all cursor-pointer"
                  >
                    {metadata.movies.map((m) => (
                      <option key={m._id} value={m._id} className="bg-slateCard text-white">
                        {m.title} ({m.durationMins} mins, {m.censorRating})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Theater Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Theater
                    </label>
                    <select
                      value={selectedTheaterId}
                      onChange={(e) => setSelectedTheaterId(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slateCard border border-charcoalBorder text-white text-xs focus:outline-none focus:border-neonCyan transition-all cursor-pointer"
                    >
                      {metadata.theaters.map((t) => (
                        <option key={t._id} value={t._id} className="bg-slateCard text-white">
                          {t.name} ({t.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Screen Number
                    </label>
                    <select
                      value={selectedScreenNumber}
                      onChange={(e) => setSelectedScreenNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slateCard border border-charcoalBorder text-white text-xs focus:outline-none focus:border-neonCyan transition-all cursor-pointer"
                    >
                      <option value="1">Screen 1 (Audi 1 - IMAX 2D)</option>
                      <option value="2">Screen 2 (Audi 2 - 4DX)</option>
                      <option value="3">Screen 3 (Audi 3 - Standard)</option>
                    </select>
                  </div>
                </div>

                {/* Show Start Time */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Show Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={showStartTime}
                    onChange={(e) => setShowStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slateCard border border-charcoalBorder text-white text-xs focus:outline-none focus:border-neonCyan transition-all"
                  />
                </div>

                {/* Custom Tier Pricing */}
                <div className="p-4 rounded-2xl bg-slateCard/60 border border-charcoalBorder space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-neonCyan" />
                    Tier Seat Pricing (₹ INR)
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Recliner</label>
                      <input
                        type="number"
                        min="50"
                        value={tierPricing.RECLINER}
                        onChange={(e) => setTierPricing({ ...tierPricing, RECLINER: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-obsidian border border-charcoalBorder text-white text-xs focus:outline-none focus:border-neonCyan"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Prime</label>
                      <input
                        type="number"
                        min="50"
                        value={tierPricing.PRIME}
                        onChange={(e) => setTierPricing({ ...tierPricing, PRIME: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-obsidian border border-charcoalBorder text-white text-xs focus:outline-none focus:border-neonCyan"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Classic</label>
                      <input
                        type="number"
                        min="50"
                        value={tierPricing.CLASSIC}
                        onChange={(e) => setTierPricing({ ...tierPricing, CLASSIC: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-obsidian border border-charcoalBorder text-white text-xs focus:outline-none focus:border-neonCyan"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmittingShow}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-electricIndigo to-neonCyan text-white text-xs font-bold uppercase tracking-wider shadow-neon-indigo hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4" />
                  {isSubmittingShow ? 'Scheduling Show...' : 'Create & Publish Show'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
