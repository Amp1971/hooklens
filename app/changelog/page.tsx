'use client';

import Link from 'next/link';
import { changelogData } from '@/lib/changelog-data';

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Simple Header */}
      <nav className="border-b border-slate-900 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tighter hover:opacity-80 transition">
            Hook<span className="text-blue-500">Lens</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/changelog" className="text-sm font-medium text-blue-400">Changelog</Link>
            <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition">Login</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-20">
        <header className="mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-4">Changelog</h1>
          <p className="text-lg text-slate-400">
            The latest updates, features, and improvements from the HookLens team.
          </p>
        </header>

        <div className="space-y-12 border-l border-slate-900 ml-4 pl-8 relative">
          {changelogData.map((entry, index) => (
            <div key={index} className="relative">
              {/* Dot on the timeline */}
              <div className="absolute -left-[41px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-4 border-slate-950 shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
              
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">{entry.date}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    entry.type === 'Feature' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                    entry.type === 'Integration' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                    entry.type === 'Fix' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {entry.type}
                  </span>
                </div>
          <div className="border-l-2 border-emerald-500 pl-4 py-2 my-4 bg-slate-900/40 rounded-r-lg">
            <span className="inline-block px-2 py-0.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 rounded">New Integration</span>
            <h3 className="text-lg font-medium text-white mt-1">PayPal Webhook Monitoring & Triage</h3>
            <p className="text-sm text-slate-400 mt-1">Full support for PayPal webhooks. Intercept payment denials, capture failures, subscription cancellations, and chargeback disputes with instant AI diagnostics.</p>
          </div>
                <h3 className="text-xl font-bold text-white tracking-tight">{entry.title}</h3>
                <p className="text-slate-400 leading-relaxed">
                  {entry.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-20 border-t border-slate-900 text-center">
        <p className="text-sm text-slate-500">© 2026 HookLens. Built for developers by developers.</p>
      </footer>
    </div>
  );
}
