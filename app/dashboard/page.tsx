import { supabase } from '@/app/lib/supabase';

// Tving Next.js til altid at hente nyeste data ved genindlæsning
export const dynamic = 'force-dynamic';

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
}

export default async function DashboardPage() {
  // Hent alle fejl-hændelser fra Supabase sorteret efter nyeste først
  const { data: events, error } = await supabase
    .from('webhook_events')
    .select('*')
    .order('created_at', { ascending: false });

  const totalEvents = events?.length || 0;
  const criticalEvents = events?.filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH').length || 0;

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
            <div className="text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-300">
              Endpoint: <span className="text-emerald-400">/api/triage</span>
            </div>
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
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">AI Engine</p>
            <p className="text-xl font-bold text-blue-400 mt-2">Gemini 3.5 Flash</p>
          </div>
        </div>

        {/* Incidents Feed */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Incident Stream</h2>
            <span className="text-xs text-slate-400">Auto-synced with Supabase</span>
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-sm">
              Fejl ved indlæsning fra database: {error.message}
            </div>
          )}

          {(!events || events.length === 0) ? (
            <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-xl border-dashed">
              <p className="text-slate-400 font-medium">Ingen registrerede hændelser endnu.</p>
              <p className="text-xs text-slate-500 mt-1">Send en test-fejl via terminalen for at se den her.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((evt: WebhookEvent) => {
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
                        {evt.affected_user && evt.affected_user !== 'N/A' && (
                          <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                            👤 {evt.affected_user}
                          </span>
                        )}
                      </div>
                      <time className="text-xs text-slate-400">
                        {new Date(evt.created_at).toLocaleString('da-DK')}
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
                      <summary className="hover:text-slate-200">Vis rå payload</summary>
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
    </div>
  );
}