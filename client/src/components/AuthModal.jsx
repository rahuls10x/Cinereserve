import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, ShieldCheck, ArrowRight, Sparkles, KeyRound } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    setAuthModalMode,
    login,
    register,
    isLoading,
    error
  } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (authModalMode === 'admin-login') {
      setEmail('admin@example.com');
      setPassword('Admin@123');
    } else {
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
    }
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (authModalMode === 'user-register') {
      await register({ name, email, password, phone });
    } else {
      await login(email, password);
    }
  };

  const handleFillAdmin = () => {
    setEmail('admin@example.com');
    setPassword('Admin@123');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-obsidian-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-slateCard-dark border border-charcoalBorder rounded-2xl shadow-2xl p-6 sm:p-7 relative overflow-hidden"
      >
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-electricIndigo to-neonCyan" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slateCard transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-electricIndigo to-neonCyan text-white shadow-neon-indigo mb-3">
            {authModalMode === 'admin-login' ? (
              <ShieldCheck className="w-6 h-6" />
            ) : authModalMode === 'user-register' ? (
              <Sparkles className="w-6 h-6" />
            ) : (
              <Lock className="w-6 h-6" />
            )}
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {authModalMode === 'admin-login'
              ? 'Admin Portal Login'
              : authModalMode === 'user-register'
              ? 'Create CineReserve Account'
              : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {authModalMode === 'admin-login'
              ? 'Access real-time auditorium telemetry and show management'
              : authModalMode === 'user-register'
              ? 'Join to book tickets with real-time seat locks'
              : 'Sign in to access your bookings and rapid checkout'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 bg-obsidian/80 p-1 rounded-xl border border-charcoalBorder mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setAuthModalMode('user-login')}
            className={`py-2 rounded-lg transition-all ${
              authModalMode === 'user-login'
                ? 'bg-electricIndigo text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            User Login
          </button>
          <button
            type="button"
            onClick={() => setAuthModalMode('user-register')}
            className={`py-2 rounded-lg transition-all ${
              authModalMode === 'user-register'
                ? 'bg-electricIndigo text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => setAuthModalMode('admin-login')}
            className={`py-2 rounded-lg transition-all ${
              authModalMode === 'admin-login'
                ? 'bg-electricIndigo text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin
          </button>
        </div>

        {/* Admin Credential Helper Banner */}
        {authModalMode === 'admin-login' && (
          <div className="mb-4 p-3 rounded-xl bg-electricIndigo/10 border border-electricIndigo/30 flex items-center justify-between text-xs text-slate-300">
            <div>
              <p className="font-semibold text-white flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-neonCyan" />
                Default Admin Credentials
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                <code className="text-neonCyan font-mono">admin@example.com</code> • <code className="text-neonCyan font-mono">Admin@123</code>
              </p>
            </div>
            <button
              type="button"
              onClick={handleFillAdmin}
              className="px-2.5 py-1 rounded-lg bg-electricIndigo/30 hover:bg-electricIndigo/50 text-white font-medium text-[11px] transition-colors"
            >
              Fill
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-roseDanger/15 border border-roseDanger/30 text-rose-300 text-xs font-medium animate-in fade-in">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authModalMode === 'user-register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-obsidian/70 border border-charcoalBorder text-white text-xs placeholder-slate-500 focus:outline-none focus:border-neonCyan focus:ring-1 focus:ring-neonCyan transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder={authModalMode === 'admin-login' ? 'admin@example.com' : 'you@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-obsidian/70 border border-charcoalBorder text-white text-xs placeholder-slate-500 focus:outline-none focus:border-neonCyan focus:ring-1 focus:ring-neonCyan transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-obsidian/70 border border-charcoalBorder text-white text-xs placeholder-slate-500 focus:outline-none focus:border-neonCyan focus:ring-1 focus:ring-neonCyan transition-all"
              />
            </div>
          </div>

          {authModalMode === 'user-register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-obsidian/70 border border-charcoalBorder text-white text-xs placeholder-slate-500 focus:outline-none focus:border-neonCyan focus:ring-1 focus:ring-neonCyan transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-electricIndigo to-neonCyan text-white text-xs font-bold uppercase tracking-wider shadow-neon-indigo hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block animate-spin mr-2">⏳</span>
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            {authModalMode === 'admin-login'
              ? 'Sign In as Admin'
              : authModalMode === 'user-register'
              ? 'Create Account'
              : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
