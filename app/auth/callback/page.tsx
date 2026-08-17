'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function AuthCallbackPage() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Lytter direkte på når Supabase opfanger hash-tokens eller sessionskift
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        window.location.replace('/dashboard');
      }
    });

    const checkCode = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        if (data.session) {
          window.location.replace('/dashboard');
          return;
        }
      }

      // Tjek eksisterende session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.location.replace('/dashboard');
      }
    };

    checkCode();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
        {errorMsg ? (
          <>
            <div className="text-red-400 text-sm font-semibold">Authentication failed</div>
            <p className="text-xs text-slate-400">{errorMsg}</p>
            <a href="/login" className="inline-block mt-4 text-xs text-blue-400 hover:underline">
              &larr; Try logging in again
            </a>
          </>
        ) : (
          <>
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 className="text-lg font-bold text-white">Authenticating...</h2>
            <p className="text-xs text-slate-400">Entering your dashboard...</p>
          </>
        )}
      </div>
    </div>
  );
}
