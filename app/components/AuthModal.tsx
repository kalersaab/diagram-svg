'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { X, Mail, Lock, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import type { UseAuthReturn } from '@/app/hooks/useAuth';

type ModalMode = 'login' | 'signup';

interface AuthModalProps {
  onClose?: () => void;
  auth: UseAuthReturn;
  /** If true the modal cannot be closed (initial auth wall) */
  required?: boolean;
}

export function AuthModal({ onClose, auth, required = false }: AuthModalProps) {
  const [mode, setMode] = useState<ModalMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear api error when switching modes or editing fields
  useEffect(() => { auth.clearError(); }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (loading) return;
      setLoading(true);
      try {
        if (mode === 'login') {
          await auth.login(email, password);
        } else {
          await auth.signup(email, password);
        }
        onClose?.();
      } catch {
        // error is already set in useAuth
      } finally {
        setLoading(false);
      }
    },
    [loading, mode, email, password, auth, onClose],
  );

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60"
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'login' ? 'Sign in' : 'Create account'}
      >
        {/* Close button – only when not required */}
        {!required && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="p-7 space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {mode === 'login'
                  ? 'Sign in to access your diagrams'
                  : 'Sign up to save your diagrams to the cloud'}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="auth-email" className="text-xs font-medium text-zinc-400">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => { setEmail(e.target.value); auth.clearError(); }}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="auth-password" className="text-xs font-medium text-zinc-400">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={e => { setPassword(e.target.value); auth.clearError(); }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
              </div>
            </div>

            {/* API Error */}
            {auth.error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{auth.error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md shadow-indigo-600/20 transition-all mt-1"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="text-center text-xs text-zinc-500">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
