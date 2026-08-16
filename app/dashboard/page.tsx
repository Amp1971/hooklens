'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';

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
    name: string;
    api_key: string;
  };
}

interface Project {
  id: string;
  name: string;
  api_key: string;
  slack_webhook_url: string | null;
  discord_webhook_url: string | null;
  created_at: string;
}

export default function DashboardPage() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Copy URL state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [selectedService, setSelectedService] = useState<string>('ALL');
  const [showResolved, setShowResolved] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [slackUrl, setSlackUrl] = useState('');
  const [discordUrl, setDiscordUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdProject, setCreatedProject] = useState<Project | null>(null);

  const fetchData = async () => {
    setLoading(true);

    const { data: projectData } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: eventData } = await supabase
      .from('webhook_events')
      .select('*, projects(name, api_key)')
      .order('created_at', { ascending: false });

    if (projectData) setProjects(projectData);
    if (eventData) setEvents(eventData as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    
    // Optimistisk UI-opdatering
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
      fetchData(); // Rollback ved fejl
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
          discordWebhookUrl: discordUrl
        })
      });

      const json = await res.json();
      if (json.success) {
        setCreatedProject(json.project);
        setProjectName('');
        setSlackUrl('');
        setDiscordUrl('');
        fetchData();
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

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // 1. Skjul løste hændelser, medmindre togglen er aktiv
      const status = evt.status || 'open';
      if (!showResolved && status === 'resolved') {
        return false;
      }

      // 2. Severity filter
      if (selectedSeverity !== 'ALL' && evt.severity !== selectedSeverity) {
        return false;
      }

      // 3. Project filter
      if (selectedProject !== 'ALL' && evt.projects?.api_key !== selectedProject) {
        return false;
      }

      // 4. Service filter
      if (selectedService !== 'ALL' && evt.service?.toLowerCase() !== selectedService.toLowerCase()) {
        return false;
      }

      // 5. Fritekst søgning
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesUser = evt.affected_user?.toLowerCase().includes(query);
        const matchesSummary = evt.summary?.toLowerCase().includes(query);
        const matchesRootCause = evt.root_cause?.toLowerCase().includes(query);
        const matchesFix = evt.suggested_fix?.toLowerCase().includes(query);
        const matchesService = evt.service?.toLowerCase().includes(query);
        const matchesProject = evt.projects?.name?.toLowerCase().includes(query);

        return matchesUser || matchesSummary || matchesRootCause || matchesFix || matchesService || matchesProject;
      }

      return true;
    });
  }, [events, showResolved, selectedSeverity, selectedProject, selectedService, searchQuery]);

  const openIncidentsCount = events.filter((e) => (e.status || 'open') === 'open').length;
  const criticalEvents = events.filter((e) => (e.status || 'open') === 'open' && (e.severity === 'CRITICAL' || e.severity === 'HIGH')).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                HookLens <span className="text-xs font-mono px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">Live Triage</span>
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              AI-driven webhook monitoring & automated multi-channel root-cause analysis.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-semibold px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            >
              ← Back to Home
            </Link>
            <button
              onClick={() => {
                setCreatedProject(null);
                setIsModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-lg shadow-blue-500/20 flex items-center gap-2"
            >
              <span>+</span> Create New Project
            </button>
          </div>
        </header>

        {/* Stats Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Open Incidents</p>
            <p className="text-3xl font-extrabold text-white mt-2">{openIncidentsCount}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Critical / High (Open)</p>
            <p className="text-3xl font-extrabold text-rose-500 mt-2">{criticalEvents}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Active Projects</p>
            <p className="text-3xl font-extrabold text-blue-400 mt-2">{projects.length}</p>
          </div>
        </div>

        {/* Active Projects Quick-List */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Your Webhook Ingest Endpoints</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {projects.map((proj) => {
              const isCopied = copiedKey === proj.api_key;
              return (
                <div key={proj.id} className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs">{proj.name}</span>
                      <div className="flex items-center gap-1 text-[10px]">
                        {proj.slack_webhook_url && <span className="bg-purple-500/10 text-purple-400 px-1.5 py-0.2 rounded border border-purple-500/20">Slack</span>}
                        {proj.discord_webhook_url && <span className="bg-indigo-500/10 text-indigo-400 px-1.5 py-0.2 rounded border border-indigo-500/20">Discord</span>}
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
        </section>

        {/* Incidents Feed */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Incident Stream</h2>
              <p className="text-xs text-slate-400">
                Showing {filteredEvents.length} {showResolved ? 'total' : 'open'} incidents
              </p>
            </div>

            {/* Toggle: Show / Hide Resolved */}
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
                onClick={fetchData}
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
              <p className="text-slate-400 font-medium">All caught up! No open incidents found.</p>
              <p className="text-xs text-slate-500 mt-1">Check "Show Resolved" if you want to inspect earlier resolved items.</p>
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
                      isResolved ? 'border-slate-800/40 opacity-60 bg-slate-950/40' : 'border-slate-800 hover:border-slate-700'
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
                            minute: '2-digit'
                          })}
                        </time>

                        {/* Resolve / Reopen Button */}
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
                        <span className="text-xs font-semibold uppercase text-slate-400">Summary</span>
                        <p className="text-sm font-medium text-slate-200 mt-0.5">{evt.summary}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/60">
                          <span className="text-xs font-semibold text-rose-400 uppercase">Root Cause</span>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{evt.root_cause}</p>
                        </div>
                        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/60">
                          <span className="text-xs font-semibold text-emerald-400 uppercase">Suggested Fix</span>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{evt.suggested_fix}</p>
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
        </section>

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
                  <label className="text-xs font-semibold text-slate-300">Slack Webhook URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://hooks.slack.com/services/..."
                    value={slackUrl}
                    onChange={(e) => setSlackUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Discord Webhook URL (Optional)</label>
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