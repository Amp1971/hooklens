'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your inbox! We sent you a secure magic login link.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-white">
              Hook<span className="text-blue-500">Lens</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Log in to your dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Enter your email to receive a passwordless magic login link.
          </p>
        </div>

        {/* Status Messages */}
        {message && (
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs leading-relaxed text-center">
            {message}
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs leading-relaxed text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label htmlFor="email" className="text-xs font-semibold text-slate-300">
              Work Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none text-white text-sm placeholder:text-slate-600 transition shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Sending Magic Link...</span>
            ) : (
              <>
                <span>Send Magic Link</span>
                <span>🪄</span>
              </>
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="pt-2 text-center">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-300 transition"
          >
            &larr; Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
