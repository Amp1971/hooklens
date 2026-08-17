// v1.0.4 - portal integration
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

const ADMIN_EMAILS = ['allan.m.pedersen@gmail.com'];

interface WebhookEvent {
  id: string;
  created_at: string;
  service: string;
  severity: string;
  status: string;
  affected_user: string;
  summary: string;
  root_cause: string;
  suggested_fix: string;
  raw_payload: any;
  project_id?: string;
  projects?: {
    id: string;
    name: string;
    api_key: string;
    user_id: string | null;
  };
}

interface Project {
  id: string;
  name: string;
  api_key: string;
  slack_webhook_url: string | null;
  discord_webhook_url: string | null;
  created_at: string;
  user_id: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [selectedService, setSelectedService] = useState<string>('ALL');
  const [showResolved, setShowResolved] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'stream' | 'analytics'>('stream');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [slackUrl, setSlackUrl] = useState('');
  const [discordUrl, setDiscordUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdProject, setCreatedProject] = useState<Project | null>(null);

  const checkAuthAndFetch = async (forcedUser?: any) => {
    let user = forcedUser || currentUser;

    if (!user) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      user = session.user;
      setCurrentUser(user);
    }

    const adminCheck = !!user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
    setIsAdmin(adminCheck);

    let projectQuery = supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (!adminCheck) {
      projectQuery = projectQuery.eq('user_id', user.id);
    }

    const { data: projectData } = await projectQuery;
    const currentProjects = projectData || [];
    setProjects(currentProjects);

    const projectKeys = currentProjects.map((p) => p.api_key);

    const { data: eventData } = await supabase
      .from('webhook_events')
      .select('*, projects(id, name, api_key, user_id)')
      .order('created_at', { ascending: false });

    if (eventData) {
      if (adminCheck) {
        setEvents(eventData as any[]);
      } else {
        const userEvents = (eventData as any[]).filter(
          (e) => e.projects && projectKeys.includes(e.projects.api_key)
        );
        setEvents(userEvents);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && mounted) {
        await checkAuthAndFetch(session.user);
      } else {
        // Giv et kort øjeblik før redirect, så magic link / token når at blive sat
        setTimeout(async () => {
          if (!mounted) return;
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (!retrySession) {
            router.push('/login');
          } else {
            await checkAuthAndFetch(retrySession.user);
          }
        }, 1200);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && mounted) {
        await checkAuthAndFetch(session.user);
      } else if (event === 'SIGNED_OUT' && mounted) {
        router.push('/login');
      }
    });

    init();

    
  const handleManageSubscription = async () => {
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to open customer portal');
      }
    } catch (err) {
      console.error('Portal error:', err);
      alert('Could not connect to billing portal.');
    }
  };

  return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const copyToClipboard = (apiKey: string) => {
    const url = `https://usehooklens.com/api/ingest/${apiKey}`;
    navigator.clipboard.writeText(url);
    setCopiedKey(apiKey);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const toggleIncidentStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'resolved' ? 'open' : 'resolved';

    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
    );

    try {
      await fetch(`/api/incidents/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Error toggling status', err);
      checkAuthAndFetch();
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          slackWebhookUrl: slackUrl,
          discordWebhookUrl: discordUrl,
          userId: currentUser?.id,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setCreatedProject(json.project);
        setProjectName('');
        setSlackUrl('');
        setDiscordUrl('');
        checkAuthAndFetch();
      } else {
        alert(json.error || 'Something went wrong.');
      }
    } catch (err) {
      alert('Error occurred while creating project.');
    } finally {
      setIsCreating(false);
    }
  };

  const uniqueServices = useMemo(() => {
    return Array.from(new Set(events.map((e) => e.service).filter(Boolean)));
  }, [events]);

  const projectStats = useMemo(() => {
    return projects.map((proj) => {
      const projEvents = events.filter(
        (e) => e.project_id === proj.id || e.projects?.api_key === proj.api_key
      );
      const total = projEvents.length;
      const critical = projEvents.filter(
        (e) => e.severity === 'CRITICAL' || e.severity === 'HIGH'
      ).length;
      const resolved = projEvents.filter((e) => e.status === 'resolved').length;
      const open = total - resolved;
      const lastEvent = projEvents[0]?.created_at || null;
      const hoursSaved = (total * 0.5).toFixed(1);

      return {
        project: proj,
        total,
        critical,
        resolved,
        open,
        lastEvent,
        hoursSaved,
      };
    });
  }, [projects, events]);

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const status = evt.status || 'open';
      if (!showResolved && status === 'resolved') {
        return false;
      }

      if (selectedSeverity !== 'ALL' && evt.severity !== selectedSeverity) {
        return false;
      }

      if (selectedProject !== 'ALL' && evt.projects?.api_key !== selectedProject) {
        return false;
      }

      if (
        selectedService !== 'ALL' &&
        evt.service?.toLowerCase() !== selectedService.toLowerCase()
      ) {
        return false;
      }

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesUser = evt.affected_user?.toLowerCase().includes(query);
        const matchesSummary = evt.summary?.toLowerCase().includes(query);
        const matchesRootCause = evt.root_cause?.toLowerCase().includes(query);
        const matchesFix = evt.suggested_fix?.toLowerCase().includes(query);
        const matchesService = evt.service?.toLowerCase().includes(query);
        const matchesProject = evt.projects?.name?.toLowerCase().includes(query);

        return (
          matchesUser ||
          matchesSummary ||
          matchesRootCause ||
          matchesFix ||
          matchesService ||
          matchesProject
        );
      }

      return true;
    });
  }, [
    events,
    showResolved,
    selectedSeverity,
    selectedProject,
    selectedService,
    searchQuery,
  ]);

  const totalAllEvents = events.length;
  const totalCriticalEvents = events.filter(
    (e) => e.severity === 'CRITICAL' || e.severity === 'HIGH'
  ).length;
  const totalHoursSaved = (totalAllEvents * 0.5).toFixed(0);

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Verifying session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                HookLens{' '}
                <span className="text-xs font-mono px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                  Operations Hub
                </span>
                {isAdmin && (
                  <span className="text-xs font-mono px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded-full border border-purple-500/30">
                    👑 Admin (Global Access)
                  </span>
                )}
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Logged in as <span className="text-slate-200 font-mono">{currentUser?.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setCreatedProject(null);
                setIsModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-lg shadow-blue-500/20 flex items-center gap-2"
            >
              <span>+</span> Create New Project
            </button>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Value & Impact Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {isAdmin ? 'Global Incidents Triaged' : 'Total Incidents Triaged'}
            </p>
            <p className="text-3xl font-extrabold text-white mt-2">{totalAllEvents}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              {isAdmin ? 'Across all customers' : 'For your active endpoints'}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Critical Alerts Caught
            </p>
            <p className="text-3xl font-extrabold text-rose-500 mt-2">{totalCriticalEvents}</p>
            <p className="text-[11px] text-slate-500 mt-1">High priority revenue blockers</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Estimated Time Saved
            </p>
            <p className="text-3xl font-extrabold text-emerald-400 mt-2">{totalHoursSaved} hrs</p>
            <p className="text-[11px] text-slate-500 mt-1">~30 mins saved per incident</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {isAdmin ? 'Total Customer Projects' : 'Active Endpoints'}
            </p>
            <p className="text-3xl font-extrabold text-blue-400 mt-2">{projects.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              {isAdmin ? 'Connected tenants' : 'Configured webhook channels'}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('stream')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 ${
              activeTab === 'stream'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚡ Live Incident Stream ({filteredEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📊 {isAdmin ? 'Per-Customer Value Breakdown' : 'Delivered Value Breakdown'} ({projects.length})
          </button>
        </div>

        {/* TAB 1: Live Stream */}
        {activeTab === 'stream' && (
          <section className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                {isAdmin ? 'All Active Customer Webhook Endpoints' : 'Your Webhook Ingest Endpoints'}
              </h2>
              {projects.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No projects created yet. Click "+ Create New Project" above.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {projects.map((proj) => {
                    const isCopied = copiedKey === proj.api_key;
                    return (
                      <div
                        key={proj.id}
                        className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-xs">{proj.name}</span>
                            <div className="flex items-center gap-1 text-[10px]">
                              {proj.slack_webhook_url && (
                                <span className="bg-purple-500/10 text-purple-400 px-1.5 py-0.2 rounded border border-purple-500/20">
                                  Slack
                                </span>
                              )}
                              {proj.discord_webhook_url && (
                                <span className="bg-indigo-500/10 text-indigo-400 px-1.5 py-0.2 rounded border border-indigo-500/20">
                                  Discord
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                            {proj.api_key}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1 text-[11px] font-mono text-slate-400 bg-slate-900/90 p-2 rounded border border-slate-800/80 truncate">
                            https://usehooklens.com/api/ingest/{proj.api_key}
                          </div>
                          <button
                            onClick={() => copyToClipboard(proj.api_key)}
                            className={`text-xs font-medium px-3 py-2 rounded transition flex items-center gap-1.5 shrink-0 ${
                              isCopied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                            }`}
                          >
                            {isCopied ? '✓ Copied!' : '📋 Copy URL'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Incident Stream</h2>
                  <p className="text-xs text-slate-400">
                    Showing {filteredEvents.length} {showResolved ? 'total' : 'open'} incidents
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={showResolved}
                      onChange={(e) => setShowResolved(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Show Resolved</span>
                  </label>

                  <button
                    onClick={checkAuthAndFetch}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    ↻ Refresh
                  </button>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="🔍 Search user, error, root cause..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <select
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">All Severities</option>
                    <option value="CRITICAL">🔴 Critical</option>
                    <option value="HIGH">🟠 High</option>
                    <option value="MEDIUM">🟡 Medium</option>
                    <option value="LOW">🟢 Low</option>
                  </select>
                </div>

                <div>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">All Projects</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.api_key}>
                        📁 {proj.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">All Services</option>
                    {uniqueServices.map((srv) => (
                      <option key={srv} value={srv}>
                        ⚡ {srv}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stream List */}
              {loading ? (
                <div className="text-center py-12 text-slate-500 text-sm">Fetching incidents...</div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-xl border-dashed">
                  <p className="text-slate-400 font-medium">All caught up! No incidents found.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Check "Show Resolved" to inspect historical items.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEvents.map((evt) => {
                    const isResolved = evt.status === 'resolved';
                    const isCritical = evt.severity === 'CRITICAL' || evt.severity === 'HIGH';

                    return (
                      <div
                        key={evt.id}
                        className={`bg-slate-900 border rounded-xl p-5 transition space-y-4 shadow-sm ${
                          isResolved
                            ? 'border-slate-800/40 opacity-60 bg-slate-950/40'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                                isCritical
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}
                            >
                              {evt.severity}
                            </span>
                            <span className="font-semibold text-white text-sm">
                              {evt.service}
                            </span>
                            {evt.projects && (
                              <span className="text-xs font-mono bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20">
                                📁 {evt.projects.name}
                              </span>
                            )}
                            {evt.affected_user && evt.affected_user !== 'N/A' && (
                              <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                                👤 {evt.affected_user}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <time className="text-xs text-slate-400">
                              {new Date(evt.created_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </time>

                            <button
                              onClick={() => toggleIncidentStatus(evt.id, evt.status || 'open')}
                              className={`text-xs font-medium px-2.5 py-1 rounded-md border transition flex items-center gap-1.5 ${
                                isResolved
                                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                              }`}
                            >
                              {isResolved ? '↩ Reopen' : '✓ Resolve'}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-semibold uppercase text-slate-400">
                              Summary
                            </span>
                            <p className="text-sm font-medium text-slate-200 mt-0.5">
                              {evt.summary}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/60">
                              <span className="text-xs font-semibold text-rose-400 uppercase">
                                Root Cause
                              </span>
                              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                {evt.root_cause}
                              </p>
                            </div>
                            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/60">
                              <span className="text-xs font-semibold text-emerald-400 uppercase">
                                Suggested Fix
                              </span>
                              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                {evt.suggested_fix}
                              </p>
                            </div>
                          </div>
                        </div>

                        <details className="text-xs text-slate-400 pt-1 cursor-pointer">
                          <summary className="hover:text-slate-200">View raw payload</summary>
                          <pre className="mt-2 p-3 bg-slate-950 rounded-lg overflow-x-auto text-[11px] font-mono text-slate-300 border border-slate-800">
                            {JSON.stringify(evt.raw_payload, null, 2)}
                          </pre>
                        </details>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 2: Value Breakdown */}
        {activeTab === 'analytics' && (
          <section className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {isAdmin ? 'Per-Customer Delivered Value Breakdown' : 'Delivered Value Breakdown'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isAdmin
                    ? 'Global breakdown of incidents caught, volume, and developer hours saved per tenant.'
                    : 'Summary of incidents caught and developer hours saved for your monitored endpoints.'}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Channels</th>
                      <th className="py-3 px-4 text-center">Total Incidents</th>
                      <th className="py-3 px-4 text-center">Critical Alerts</th>
                      <th className="py-3 px-4 text-center">Resolved</th>
                      <th className="py-3 px-4 text-center">Time Saved (Est.)</th>
                      <th className="py-3 px-4">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {projectStats.map((stat) => (
                      <tr key={stat.project.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-sans font-semibold text-white">
                          {stat.project.name}
                          <div className="text-[10px] text-slate-500 font-mono">
                            {stat.project.api_key}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <div className="flex items-center gap-1">
                            {stat.project.slack_webhook_url && (
                              <span className="bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20 text-[10px]">
                                Slack
                              </span>
                            )}
                            {stat.project.discord_webhook_url && (
                              <span className="bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20 text-[10px]">
                                Discord
                              </span>
                            )}
                            {!stat.project.slack_webhook_url &&
                              !stat.project.discord_webhook_url && (
                                <span className="text-slate-600 text-[10px]">None</span>
                              )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-100">
                          {stat.total}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-rose-400">
                          {stat.critical}
                        </td>
                        <td className="py-3 px-4 text-center text-emerald-400">
                          {stat.resolved} / {stat.total}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-emerald-500/10 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                            {stat.hoursSaved} hrs
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-400 text-[11px]">
                          {stat.lastEvent
                            ? new Date(stat.lastEvent).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'No events yet'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Modal: Create Project */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Create New Project</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {createdProject ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs space-y-2">
                  <p className="font-bold text-sm">🎉 Project created successfully!</p>
                  <p>Use the following ingest URL in your webhook provider settings:</p>
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1 bg-slate-950 p-2.5 rounded font-mono text-[11px] text-white truncate border border-emerald-500/30">
                      https://usehooklens.com/api/ingest/{createdProject.api_key}
                    </div>
                    <button
                      onClick={() => copyToClipboard(createdProject.api_key)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shrink-0 transition"
                    >
                      {copiedKey === createdProject.api_key ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
                >
                  Close & View Dashboard
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Project Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shopify Production, Stripe EU, Auth Webhooks"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Slack Webhook URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://hooks.slack.com/services/..."
                    value={slackUrl}
                    onChange={(e) => setSlackUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Discord Webhook URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={discordUrl}
                    onChange={(e) => setDiscordUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Generate Endpoint'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}