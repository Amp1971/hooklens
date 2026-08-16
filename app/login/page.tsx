'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setMessage('Tjek din indbakke! Vi har sendt et sikkert login-link til din e-mail.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block text-2xl font-bold tracking-tight text-white">
            Hook<span className="text-blue-500">Lens</span>
          </Link>
          <h1 className="text-lg font-semibold text-slate-200">Log ind på dit dashboard</h1>
          <p className="text-xs text-slate-400">
            Indtast din e-mail for at modtage et engangs-loginlink (Passwordless).
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs text-center">
            {error}
          </div>
        )}

        {message ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs text-center leading-relaxed">
            {message}
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">E-mailadresse</label>
              <input
                type="email"
                required
                placeholder="dig@virksomhed.dk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {loading ? 'Sender link...' : 'Send Magic Link 🪄'}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-400">
            ← Tilbage til forsiden
          </Link>
        </div>

      </div>
    </div>
  );
}
