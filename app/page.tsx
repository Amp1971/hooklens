'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (plan: 'starter' | 'growth' | 'scale') => {
    setLoadingPlan(plan);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Checkout error: ' + (data.error || 'Unknown error occurred.'));
      }
    } catch (err: any) {
      alert('Network/Client error: ' + (err.message || 'Please try again.'));
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            H
          </div>
          <span className="text-xl font-bold tracking-tight text-white">HookLens</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="#pricing" className="text-sm font-medium text-slate-400 hover:text-white transition">
            Pricing
          </Link>
          <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition">
            Log in
          </Link>
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-lg shadow-blue-500/20"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          AI-Powered Webhook Triage for Modern Engineering Teams
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Never let a silent webhook failure <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            cost you customers again.
          </span>
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          HookLens intercepts failed webhooks across Stripe, Shopify, GitHub and custom APIs, diagnoses the root cause in seconds with AI, and notifies your team directly in Slack & Discord.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a
            href="#pricing"
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 text-sm"
          >
            Start Monitoring Now &rarr;
          </a>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold rounded-xl transition text-sm"
          >
            Log in to Existing Account
          </Link>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-900">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold text-white">Simple, transparent pricing</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Choose the plan that fits your webhook volume and infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter Plan */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Starter</h3>
              <p className="text-xs text-slate-400">For side projects and small webhooks.</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$19</span>
                <span className="text-slate-400 text-xs">/month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2">✓ Up to 10,000 events/mo</li>
                <li className="flex items-center gap-2">✓ 3 active endpoints</li>
                <li className="flex items-center gap-2">✓ Instant Slack alerts</li>
                <li className="flex items-center gap-2">✓ 7 days log retention</li>
              </ul>
            </div>
            <button
              onClick={() => handleCheckout('starter')}
              disabled={loadingPlan === 'starter'}
              className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold text-center transition block disabled:opacity-50"
            >
              {loadingPlan === 'starter' ? 'Redirecting to Stripe...' : 'Choose Starter'}
            </button>
          </div>

          {/* Growth Plan */}
          <div className="bg-slate-900 border-2 border-blue-500/50 rounded-2xl p-8 space-y-6 flex flex-col justify-between relative shadow-2xl shadow-blue-500/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">
              Most Popular
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Growth</h3>
              <p className="text-xs text-slate-400">For growing startups & high-volume webhooks.</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$29</span>
                <span className="text-slate-400 text-xs">/month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2">✓ Up to 100,000 events/mo</li>
                <li className="flex items-center gap-2">✓ Unlimited endpoints</li>
                <li className="flex items-center gap-2">✓ Slack & Discord alerts</li>
                <li className="flex items-center gap-2">✓ AI Root-Cause Analysis</li>
                <li className="flex items-center gap-2">✓ 30 days log retention</li>
              </ul>
            </div>
            <button
              onClick={() => handleCheckout('growth')}
              disabled={loadingPlan === 'growth'}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold text-center transition block shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {loadingPlan === 'growth' ? 'Redirecting to Stripe...' : 'Choose Growth'}
            </button>
          </div>

          {/* Scale Plan */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Scale</h3>
              <p className="text-xs text-slate-400">For enterprise scale & critical operations.</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$49</span>
                <span className="text-slate-400 text-xs">/month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2">✓ Unlimited events</li>
                <li className="flex items-center gap-2">✓ Dedicated webhook ingest latency</li>
                <li className="flex items-center gap-2">✓ Slack, Discord & Webhook dispatch</li>
                <li className="flex items-center gap-2">✓ 90 days log retention</li>
                <li className="flex items-center gap-2">✓ Priority SLA support</li>
              </ul>
            </div>
            <button
              onClick={() => handleCheckout('scale')}
              disabled={loadingPlan === 'scale'}
              className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold text-center transition block disabled:opacity-50"
            >
              {loadingPlan === 'scale' ? 'Redirecting to Stripe...' : 'Choose Scale'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-10 border-t border-slate-900 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} HookLens. All rights reserved.
      </footer>
    </div>
  );
}
