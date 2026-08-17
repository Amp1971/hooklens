'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, anonKey);
}

interface Incident {
  id: string;
  created_at: string;
  service: string;
  severity: string;
  affected_user: string;
  summary: string;
  root_cause: string;
  suggested_fix: string;
  raw_payload?: any;
}

interface Project {
  id: string;
  name: string;
  api_key: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Modal State for New Project
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = getSupabase();
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (!user) {
          router.push('/login');
          return;
        }

        setUserEmail(user.email || '');
        setUserId(user.id);

        // 1. Hent projekter
        const { data: projs } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id);
        if (projs) setProjects(projs);

        // 2. Hent incidents (webhook_events)
        const { data: events, error: evErr } = await supabase
          .from('webhook_events')
          .select('*')
          .order('created_at', { ascending: false });

        if (events) {
          setIncidents(events);
        }
      } catch (e) {
        console.error('Error loading dashboard data:', e);
      } finally {
        setFetching(false);
      }
    }
    loadData();
  }, [router]);

  const handleSignOut = async () => {
    try {
      const supabase = getSupabase();
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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !userId) return;

    try {
      setCreating(true);
      const res = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName }),
      });

      const data = await res.json();
      if (res.ok && data.apiKey) {
        setCreatedKey(data.apiKey);
        setProjects(prev => [...prev, { id: data.id || 'new', name: projectName, api_key: data.apiKey }]);
      } else {
        // Fallback hvis API-ruten ikke er oprettet
        const randomKey = 'hl_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const supabase = getSupabase();
        const { data: newProj } = await supabase.from('projects').insert({
          user_id: userId,
          name: projectName,
          api_key: randomKey
        }).select().single();

        setCreatedKey(randomKey);
        if (newProj) setProjects(prev => [...prev, newProj]);
      }
    } catch (err) {
      console.error(err);
      alert('Fejl ved oprettelse af projekt.');
    } finally {
      setCreating(false);
    }
  };

  // Beregn nøgletal
  const totalIncidents = incidents.length;
  const criticalAlerts = incidents.filter(i => i.severity?.toUpperCase() === 'CRITICAL').length;
  const timeSavedHours = (totalIncidents * 0.5).toFixed(1);
  const activeEndpoints = projects.length > 0 ? projects.length : 1;

  const getSeverityBadge = (sev: string) => {
    const s = sev?.toUpperCase();
    if (s === 'CRITICAL') return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    if (s === 'HIGH') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (s === 'MEDIUM') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  const getServiceBadge = (srv: string) => {
    const s = srv?.toLowerCase();
    if (s === 'stripe') return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    if (s === 'woocommerce') return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (s === 'paypal') return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    if (s === 'shopify') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
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
              Logged in as: <span className="text-slate-200 font-medium">{userEmail || 'Indlæser...'}</span>
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
              onClick={() => { setShowCreateModal(true); setCreatedKey(null); setProjectName(''); }}
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
            <p className="text-3xl font-bold text-white mt-2">{fetching ? '-' : totalIncidents}</p>
            <p className="text-xs text-slate-500 mt-1">For your active endpoints</p>
          </div>
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Critical Alerts Caught</p>
            <p className="text-3xl font-bold text-rose-500 mt-2">{fetching ? '-' : criticalAlerts}</p>
            <p className="text-xs text-slate-500 mt-1">High priority revenue blockers</p>
          </div>
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Estimated Time Saved</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2">{fetching ? '-' : `${timeSavedHours} hrs`}</p>
            <p className="text-xs text-slate-500 mt-1">~30 mins saved per incident</p>
          </div>
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Endpoints</p>
            <p className="text-3xl font-bold text-white mt-2">{fetching ? '-' : activeEndpoints}</p>
            <p className="text-xs text-slate-500 mt-1">Configured webhook channels</p>
          </div>
        </div>

        {/* Live Incident Stream */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <h2 className="text-sm font-semibold text-white">Live Incident Stream & Diagnostics</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">{incidents.length} events logged</span>
          </div>

          {fetching ? (
            <div className="p-12 text-center text-xs text-slate-400">Indlæser hændelser...</div>
          ) : incidents.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="inline-flex p-3 rounded-full bg-blue-500/10 text-blue-400">⚡</div>
              <h3 className="text-base font-semibold text-white">Ingen aktive incidents endnu</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Dine webhooks vil blive analyseret i realtid med root-cause analyse, så snart data sendes til dine endpoints.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {incidents.map((inc) => (
                <div 
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className="p-4 md:p-5 hover:bg-slate-800/30 transition-colors cursor-pointer space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getSeverityBadge(inc.severity)}`}>
                        {inc.severity}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getServiceBadge(inc.service)}`}>
                        {inc.service}
                      </span>
                      <span className="text-xs font-semibold text-white">{inc.summary}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(inc.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-950/40 p-3 rounded-lg border border-slate-800/40">
                    <div>
                      <span className="text-slate-500 font-medium">Root Cause: </span>
                      <span className="text-slate-300">{inc.root_cause}</span>
                    </div>
                    <div>
                      <span className="text-emerald-400/90 font-medium">Suggested Action: </span>
                      <span className="text-slate-300">{inc.suggested_fix}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Target: <span className="font-mono text-slate-300">{inc.affected_user || 'N/A'}</span></span>
                    <span className="text-blue-400 hover:underline">View Raw JSON &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modal: Opret nyt Projekt */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create New Ingestion Endpoint</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            {!createdKey ? (
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Project / Channel Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Production Stripe, Woo Checkout"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  {creating ? 'Opretter...' : 'Generate Endpoint & API Key'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400">
                  🎉 Endpoint er oprettet! Brug denne URL til dine webhooks:
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Ingestion Webhook URL
                  </label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-slate-200 break-all">
                    https://www.usehooklens.com/api/ingest/{createdKey}
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2 rounded-lg"
                >
                  Færdig
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Vis Raw Payload */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getSeverityBadge(selectedIncident.severity)}`}>
                  {selectedIncident.severity}
                </span>
                <h3 className="text-sm font-bold text-white">{selectedIncident.summary}</h3>
              </div>
              <button onClick={() => setSelectedIncident(null)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Raw Payload Data:</p>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-80">
                {JSON.stringify(selectedIncident.raw_payload || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg"
              >
                Luk
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
