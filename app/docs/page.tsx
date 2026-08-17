'use client';

import { useState } from 'react';
import Link from 'next/link';
import { docGuides } from '@/lib/docs-data';

export default function DocsPage() {
  const [activeGuideId, setActiveGuideId] = useState(docGuides[0].id);
  const currentGuide = docGuides.find((g) => g.id === activeGuideId) || docGuides[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navigation */}
      <nav className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tighter hover:opacity-80 transition">
            Hook<span className="text-blue-500">Lens</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/docs" className="text-sm font-medium text-blue-400">Guides & Docs</Link>
            <Link href="/blog" className="text-sm font-medium text-slate-400 hover:text-white transition">Blog</Link>
            <Link href="/changelog" className="text-sm font-medium text-slate-400 hover:text-white transition">Changelog</Link>
            <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition">Dashboard</Link>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <header className="mb-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            Integration Guides & Manuals
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Connect Your Platforms to HookLens
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Step-by-step setup guides for Stripe, Shopify, and alerting channels. No complex coding required.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar / Left Menu */}
          <aside className="space-y-6 lg:border-r lg:border-slate-900 lg:pr-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Setup Guides
              </h3>
              <nav className="space-y-1.5">
                {docGuides.map((guide) => {
                  const isActive = guide.id === activeGuideId;
                  return (
                    <button
                      key={guide.id}
                      onClick={() => setActiveGuideId(guide.id)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                        isActive
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-white border border-transparent'
                      }`}
                    >
                      <span className="truncate">{guide.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono ml-2 shrink-0">
                        {guide.badge}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <p className="text-xs font-bold text-white">Need another provider?</p>
              <p className="text-xs text-slate-400">
                HookLens natively supports Stripe, Shopify, PayPal, WooCommerce, and GitHub. Reach out if you need a setup guide for another service.
              </p>
              <a
                href="mailto:allan@usehooklens.com"
                className="text-xs text-blue-400 hover:underline inline-block pt-1 font-semibold"
              >
                Request an integration &rarr;
              </a>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3 space-y-8">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-10 space-y-8 shadow-xl">
              {/* Header */}
              <div className="border-b border-slate-800/80 pb-6 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-mono uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                    {currentGuide.category}
                  </span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-400 font-medium">
                    {currentGuide.difficulty}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {currentGuide.title}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {currentGuide.description}
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-8">
                {currentGuide.steps.map((step, idx) => (
                  <div key={idx} className="space-y-3">
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                      {step.description}
                    </p>

                    {step.code && (
                      <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-blue-300 overflow-x-auto my-3">
                        <code>{step.code}</code>
                      </pre>
                    )}

                    {step.tip && (
                      <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs text-blue-300 leading-relaxed">
                        <span className="font-bold text-white">Pro Tip: </span>
                        {step.tip}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom Card */}
              <div className="mt-8 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-white">Ready to test your webhooks?</p>
                  <p className="text-xs text-slate-400">Head over to your dashboard and manage live events.</p>
                </div>
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-blue-500/20 shrink-0"
                >
                  Open Dashboard &rarr;
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-16 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>© 2026 UseHookLens. All rights reserved.</p>
      </footer>
    </div>
  );
}
