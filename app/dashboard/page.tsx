'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';

interface WebhookEvent {
  id: string;
  created_at: string;
  service: string;
  severity: string;
  affected_user: string;
  summary: string;
  root_cause: string;
  suggested_fix: string;
  raw_payload: any;
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
  created_at: string;
}

export default function DashboardPage() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [slackUrl, setSlackUrl] = useState('');
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
          slackWebhookUrl: slackUrl
        })
      });

      const json = await res.json();
      if (json.success) {
        setCreatedProject(json.project);
        setProjectName('');
        setSlackUrl('');
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

  const totalEvents = events.length;
  const criticalEvents = events.filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH').length;

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
              AI-driven webhook monitoring & automated root-cause analysis.
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
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Analyzed Events</p>
            <p className="text-3xl font-extrabold text-white mt-2">{totalEvents}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">High / Critical Alerts</p>
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
            {projects.map((proj) => (
              <div key={proj.id} className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs">{proj.name}</span>
                  <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                    {proj.api_key}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 bg-slate-900/90 p-2 rounded border border-slate-800/80 break-all select-all">
                  https://usehooklens.com/api/ingest/{proj.api_key}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Incidents Feed */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Incident Stream</h2>
            <button
              onClick={fetchData}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500 text-sm">Fetching incidents...</div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-xl border-dashed">
              <p className="text-slate-400 font-medium">No recorded incidents yet.</p>
              <p className="text-xs text-slate-500 mt-1">Send webhooks to any of your ingest endpoints to see them here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((evt) => {
                const isCritical = evt.severity === 'CRITICAL' || evt.severity === 'HIGH';
                return (
                  <div
                    key={evt.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition space-y-4 shadow-sm"
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
                      <time className="text-xs text-slate-400">
                        {new Date(evt.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </time>
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
                  <div className="bg-slate-950 p-2.5 rounded font-mono text-[11px] text-white select-all break-all border border-emerald-500/30">
                    https://usehooklens.com/api/ingest/{createdProject.api_key}
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
                  <p className="text-[11px] text-slate-500">
                    If left blank, system default Slack alerts channel is used.
                  </p>
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