'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Tjek om der er en kode i URL query params (?code=...)
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setErrorMsg(error.message);
          return;
        }
      }

      // Tjek om sessionen nu er aktiv i browseren
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        window.location.href = '/dashboard';
      } else {
        // Hvis auth tager et kort øjeblik via hash fragmenter
        const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
          if (newSession) {
            authListener.subscription.unsubscribe();
            window.location.href = '/dashboard';
          }
        });
      }
    };

    handleAuth();
  }, [router]);

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
            <h2 className="text-lg font-bold text-white">Logging you in...</h2>
            <p className="text-xs text-slate-400">Verifying your secure magic link and loading your dashboard.</p>
          </>
        )}
      </div>
    </div>
  );
}
