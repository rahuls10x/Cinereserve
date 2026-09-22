import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Film,
  Clock,
  Calendar,
  Sparkles,
  Ticket,
  ChevronRight,
  ShieldCheck,
  Zap,
  RotateCcw
} from 'lucide-react';
import { Navbar } from '../components/Navbar';

export function HomePage() {
  const [shows, setShows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchShows();
  }, []);

  const fetchShows = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get('/api/shows');
      setShows(res.data.data || []);
    } catch (err) {
      console.error('Failed to load shows:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-slate-100 flex flex-col selection:bg-neonCyan/30">
      <Navbar isConnected={true} />

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-electricIndigo/10 border border-electricIndigo/30 text-electricIndigo-light text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5 text-neonCyan" />
            <span>Zero Double-Booking Guarantee • Sub-50ms Distributed Holds</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Next-Gen Cinema Ticketing <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neonCyan via-electricIndigo-light to-electricIndigo">
              With Distributed In-Memory Locks
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Experience high-concurrency atomic seat reservation powered by Redis Lua scripts, WebSocket state broadcasting, and deterministic 5-minute lock expiration.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="p-5 rounded-2xl glass-panel bg-slateCard/60 border border-charcoalBorder/80">
            <div className="w-10 h-10 rounded-xl bg-neonCyan/10 border border-neonCyan/30 text-neonCyan flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-white mb-1">Atomic Lua Locking</h2>
            <p className="text-xs text-slate-400">
              Zero double bookings. Redis processes multi-seat hold requests atomically in a single thread execution step.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-panel bg-slateCard/60 border border-charcoalBorder/80">
            <div className="w-10 h-10 rounded-xl bg-amberHold/10 border border-amberHold/30 text-amberHold flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-white mb-1">Deterministic 300s TTL</h2>
            <p className="text-xs text-slate-400">
              5-minute auto-release window powered by Redis keyspace expiration events and backend background sweepers.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-panel bg-slateCard/60 border border-charcoalBorder/80">
            <div className="w-10 h-10 rounded-xl bg-emeraldSuccess/10 border border-emeraldSuccess/30 text-emeraldSuccess flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-white mb-1">Live WebSocket Sync</h2>
            <p className="text-xs text-slate-400">
              Open multiple browser tabs side-by-side to witness real-time seat locks and state updates without page refreshes.
            </p>
          </div>
        </div>

        {/* Available Movies & Shows Section */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Film className="w-5 h-5 text-neonCyan" />
              <span>Available Showtimes Today</span>
            </h2>
            <p className="text-xs text-slate-400">
              Select a movie and hall to view the real-time tiered seat map
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-3xl bg-slateCard/50 border border-charcoalBorder animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shows.map((show) => {
              const movie = show.movie;
              const theater = show.theater;
              const showTimeStr = new Date(show.startTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={show._id}
                  className="rounded-3xl glass-panel bg-slateCard/70 border border-charcoalBorder/80 overflow-hidden flex flex-col group hover:border-neonCyan/50 transition-all duration-300 shadow-xl"
                >
                  {/* Movie Poster Banner */}
                  <div className="relative h-52 w-full overflow-hidden bg-obsidian-900">
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slateCard via-slateCard/40 to-transparent"></div>

                    {/* Censor Rating Pill */}
                    <div className="absolute top-4 left-4 px-2.5 py-1 rounded-lg bg-obsidian/80 backdrop-blur-md border border-charcoalBorder text-[11px] font-bold text-slate-200">
                      {movie.censorRating} • {movie.language}
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-obsidian/80 backdrop-blur-md border border-charcoalBorder text-[11px] text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-neonCyan" />
                      <span>{movie.durationMins}m</span>
                    </div>

                    {/* Title Overlay */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-black text-white tracking-tight leading-tight">
                        {movie.title}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {movie.genre.slice(0, 3).map((g) => (
                          <span
                            key={g}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-electricIndigo/20 border border-electricIndigo/30 text-electricIndigo-light font-medium"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {movie.description}
                    </p>

                    <div className="pt-3 border-t border-charcoalBorder/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Cinema & Hall</span>
                        <span className="font-semibold text-slate-200">
                          {theater.name} • Screen {show.screenNumber}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-slate-400 block text-[11px]">Pricing From</span>
                        <span className="font-bold text-neonCyan">₹180 - ₹450</span>
                      </div>
                    </div>

                    {/* Select Showtime CTA */}
                    <button
                      onClick={() => navigate(`/show/${show._id}`)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-electricIndigo hover:bg-electricIndigo-hover text-white text-xs font-bold shadow-neon-indigo hover:scale-[1.02] active:scale-98 transition-all"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>Select Seats ({showTimeStr} Slot)</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
