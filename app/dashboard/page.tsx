'use client';

import { useEffect, useState, useMemo } from 'react';
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

interface UserProfile {
  id: string;
  email: string;
  plan_tier?: string;
  subscription_status?: string;
  stripe_customer_id?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');

  // Modal State for New Project
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Modal State for Plan Picker
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

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

        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        setProfile(prof);

        const hasAccess = Boolean(prof?.stripe_customer_id) && 
          (prof?.subscription_status === 'active' || prof?.subscription_status === 'trialing');

        if (hasAccess) {
          const { data: projs } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id);
          
          if (projs && projs.length > 0) {
            setProjects(projs);
            const projectIds = projs.map(p => p.id);

            const { data: events } = await supabase
              .from('webhook_events')
              .select('*')
              .in('project_id', projectIds)
              .order('created_at', { ascending: false });

            if (events) setIncidents(events);
          } else {
            setProjects([]);
            setIncidents([]);
          }
        } else {
          setProjects([]);
          setIncidents([]);
        }
      } catch (e) {
        console.error('Error loading dashboard data:', e);
      } finally {
        setFetching(false);
      }
    }
    loadData();
  }, [router]);

  const hasActiveAccess = Boolean(profile?.stripe_customer_id) && 
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing');

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
        alert(data.error || 'Could not open billing portal.');
      }
    } catch (err) {
      console.error('Portal error:', err);
      alert('An error occurred while connecting to the Stripe portal.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (planTier: string) => {
    try {
      setCheckoutLoading(planTier);
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planTier,
          email: userEmail
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to initiate checkout.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Could not start checkout session.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !userId || !hasActiveAccess) return;

    try {
      setCreating(true);
      const randomKey = 'hl_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const supabase = getSupabase();
      const { data: newProj } = await supabase.from('projects').insert({
        user_id: userId,
        name: projectName,
        api_key: randomKey
      }).select().single();

      setCreatedKey(randomKey);
      if (newProj) setProjects(prev => [...prev, newProj]);
    } catch (err) {
      console.error(err);
      alert('Failed to create project.');
    } finally {
      setCreating(false);
    }
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const matchesSearch =
        searchQuery === '' ||
        inc.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.affected_user?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.root_cause?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.service?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesProvider =
        selectedProvider === 'ALL' ||
        inc.service?.toLowerCase() === selectedProvider.toLowerCase();

      const matchesSeverity =
        selectedSeverity === 'ALL' ||
        inc.severity?.toUpperCase() === selectedSeverity.toUpperCase();

      return matchesSearch && matchesProvider && matchesSeverity;
    });
  }, [incidents, searchQuery, selectedProvider, selectedSeverity]);

  const totalIncidents = incidents.length;
  const criticalAlerts = incidents.filter(i => i.severity?.toUpperCase() === 'CRITICAL').length;
  const timeSavedHours = (totalIncidents * 0.5).toFixed(1);
  const activeEndpoints = projects.length;

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

  const planDisplayName = (profile?.plan_tier || 'starter').toUpperCase();

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${hasActiveAccess ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <h1 className="text-2xl font-bold tracking-tight text-white">HookLens</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">Operations Hub</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Logged in as: <span className="text-slate-200 font-medium">{userEmail || 'Loading...'}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hasActiveAccess ? (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="font-semibold text-white uppercase tracking-wider">Plan: {planDisplayName}</span>
                </div>

                <button
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                >
                  {loading ? 'Opening...' : 'Manage Subscription ⚙️'}
                </button>

                <button
                  onClick={() => { setShowCreateModal(true); setCreatedKey(null); setProjectName(''); }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
                >
                  + Create New Project
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowPlanModal(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
              >
                ⚡ Start 14-Day Free Trial
              </button>
            )}

            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Paywall Banner for un-subscribed users */}
        {!fetching && !hasActiveAccess && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900/30 via-slate-900/50 to-indigo-900/30 border border-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  Subscription Required
                </span>
                <h3 className="text-sm font-semibold text-white">Activate your 14-day free trial</h3>
              </div>
              <p className="text-xs text-slate-400 max-w-xl">
                Select a plan via Stripe to unlock real-time webhook ingestion, AI root-cause analysis, and incident alerting. You won't be charged during the 14-day trial.
              </p>
            </div>
            <button
              onClick={() => setShowPlanModal(true)}
              className="whitespace-nowrap px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-500/20 transition-all"
            >
              Choose a Plan &rarr;
            </button>
          </div>
        )}

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
          <div className="p-4 border-b border-slate-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <h2 className="text-sm font-semibold text-white">Live Incident Stream & Diagnostics</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Showing {filteredIncidents.length} of {incidents.length} events
              </span>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 text-xs pointer-events-none">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search incidents, customer reference, root cause, or summary..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">All Providers</option>
                  <option value="stripe">Stripe</option>
                  <option value="woocommerce">WooCommerce</option>
                  <option value="paypal">PayPal</option>
                  <option value="shopify">Shopify</option>
                </select>

                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                </select>

                {(searchQuery || selectedProvider !== 'ALL' || selectedSeverity !== 'ALL') && (
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedProvider('ALL'); setSelectedSeverity('ALL'); }}
                    className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {fetching ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading incidents...</div>
          ) : filteredIncidents.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="inline-flex p-3 rounded-full bg-slate-800/50 text-slate-400">⚡</div>
              <h3 className="text-sm font-semibold text-white">
                {!hasActiveAccess ? 'No active subscription connected' : 'No incidents recorded yet'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {!hasActiveAccess 
                  ? 'Subscribe to a plan above to generate webhook endpoints and start monitoring.'
                  : 'Webhooks sent to your project endpoints will be analyzed in real-time.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {filteredIncidents.map((inc) => (
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
                      {new Date(inc.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
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

      {/* Modal: Choose a Plan */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Simple, transparent pricing</h3>
                <p className="text-xs text-slate-400 mt-1">Choose the plan that fits your webhook volume and infrastructure. All plans include a 14-day free trial.</p>
              </div>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Starter */}
              <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-5">
                <div>
                  <h4 className="text-base font-bold text-white">Starter</h4>
                  <p className="text-xs text-slate-400 mt-1">For side projects and small webhooks.</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">$19</span>
                    <span className="text-xs text-slate-400">/month</span>
                  </div>
                  <ul className="mt-5 space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2 text-slate-200">✓ 14-day free trial</li>
                    <li className="flex items-center gap-2">✓ Up to 10,000 events/mo</li>
                    <li className="flex items-center gap-2">✓ 3 active endpoints</li>
                    <li className="flex items-center gap-2">✓ Instant Slack alerts</li>
                    <li className="flex items-center gap-2">✓ 7 days log retention</li>
                  </ul>
                </div>
                <button
                  onClick={() => handleCheckout('starter')}
                  disabled={Boolean(checkoutLoading)}
                  className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  {checkoutLoading === 'starter' ? 'Redirecting...' : 'Start 14-Day Free Trial'}
                </button>
              </div>

              {/* Growth */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-blue-950/30 to-slate-950/60 border-2 border-blue-500 hover:border-blue-400 transition-all flex flex-col justify-between space-y-5 relative shadow-xl shadow-blue-500/10">
                <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white tracking-wider uppercase">MOST POPULAR</span>
                <div>
                  <h4 className="text-base font-bold text-white">Growth</h4>
                  <p className="text-xs text-slate-400 mt-1">For growing startups & high-volume webhooks.</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">$19</span>
                    <span className="text-xs text-slate-400">/month</span>
                  </div>
                  <ul className="mt-5 space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2 text-slate-200">✓ 14-day free trial</li>
                    <li className="flex items-center gap-2">✓ Up to 100,000 events/mo</li>
                    <li className="flex items-center gap-2">✓ Unlimited endpoints</li>
                    <li className="flex items-center gap-2">✓ Slack & Discord alerts</li>
                    <li className="flex items-center gap-2">✓ AI Root-Cause Analysis</li>
                    <li className="flex items-center gap-2">✓ 30 days log retention</li>
                  </ul>
                </div>
                <button
                  onClick={() => handleCheckout('growth')}
                  disabled={Boolean(checkoutLoading)}
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-blue-500/25"
                >
                  {checkoutLoading === 'growth' ? 'Redirecting...' : 'Start 14-Day Free Trial'}
                </button>
              </div>

              {/* Scale */}
              <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-5">
                <div>
                  <h4 className="text-base font-bold text-white">Scale</h4>
                  <p className="text-xs text-slate-400 mt-1">For enterprise scale & critical operations.</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">$49</span>
                    <span className="text-xs text-slate-400">/month</span>
                  </div>
                  <ul className="mt-5 space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2 text-slate-200">✓ 14-day free trial</li>
                    <li className="flex items-center gap-2">✓ Unlimited events</li>
                    <li className="flex items-center gap-2">✓ Dedicated webhook ingest latency</li>
                    <li className="flex items-center gap-2">✓ Slack, Discord & Webhook dispatch</li>
                    <li className="flex items-center gap-2">✓ 90 days log retention</li>
                    <li className="flex items-center gap-2">✓ Priority SLA support</li>
                  </ul>
                </div>
                <button
                  onClick={() => handleCheckout('scale')}
                  disabled={Boolean(checkoutLoading)}
                  className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  {checkoutLoading === 'scale' ? 'Redirecting...' : 'Start 14-Day Free Trial'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create New Project */}
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
                  {creating ? 'Creating...' : 'Generate Endpoint & API Key'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400">
                  🎉 Endpoint created! Use this URL to forward your webhooks:
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Ingestion Webhook URL
                  </label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-slate-200 break-all">
                    https://www.usehooklens.com/api/ingest/${createdKey}
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2 rounded-lg"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: View Raw Payload */}
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
