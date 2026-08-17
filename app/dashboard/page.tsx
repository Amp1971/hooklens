'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>('allan@alssund-massage.dk');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data?.user?.email) {
          setUserEmail(data.user.email);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadUser();
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Kunne ikke åbne kundeportalen.');
      }
    } catch (err) {
      console.error('Portal error:', err);
      alert('Der opstod en fejl ved forbindelse til Stripe portalen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
              <h1 className="text-2xl font-bold tracking-tight text-white">HookLens</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">Operations Hub</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Logged in as: <span className="text-slate-200 font-medium">{userEmail}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-semibold text-white uppercase tracking-wider">Plan: Starter</span>
              <span className="text-slate-500">•</span>
              <span>10,000 events/mo</span>
            </div>

            <button
              onClick={handleManageSubscription}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              {loading ? 'Åbner...' : 'Manage Subscription ⚙️'}
            </button>

            <button
              onClick={() => alert('Opret nyt endpoint/projekt')}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
            >
              + Create New Project
            </button>

            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Incidents Triaged</p>
            <p className="text-3xl font-bold text-white mt-2">0</p>
            <p className="text-xs text-slate-500 mt-1">For your active endpoints</p>
          </div>
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Critical Alerts Caught</p>
            <p className="text-3xl font-bold text-rose-500 mt-2">0</p>
            <p className="text-xs text-slate-500 mt-1">High priority revenue blockers</p>
          </div>
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Estimated Time Saved</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2">0 hrs</p>
            <p className="text-xs text-slate-500 mt-1">~30 mins saved per incident</p>
          </div>
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Endpoints</p>
            <p className="text-3xl font-bold text-white mt-2">0</p>
            <p className="text-xs text-slate-500 mt-1">Configured webhook channels</p>
          </div>
        </div>

        {/* Stream & Details Section */}
        <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-blue-500/10 text-blue-400 mb-2">
            ⚡
          </div>
          <h3 className="text-base font-semibold text-white">Ingen aktive incidents endnu</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Dine webhooks vil blive analyseret i realtid med root-cause analyse, så snart data sendes til dine endpoints.
          </p>
        </div>

      </div>
    </div>
  );
}
