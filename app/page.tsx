import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Navigation */}
      <nav className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-lg tracking-tight text-white">HookLens</span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <a href="#features" className="text-slate-400 hover:text-white transition">Features</a>
            <a href="#how-it-works" className="text-slate-400 hover:text-white transition">How it works</a>
            <a href="#pricing" className="text-slate-400 hover:text-white transition">Pricing</a>
            <Link
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-xs transition shadow-lg shadow-blue-500/20"
            >
              Open Dashboard →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-5xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-mono text-blue-400">
          <span>⚡ Gemini 3.5 Flash Powered</span>
          <span className="text-slate-500">•</span>
          <span>Zero Configuration Triage</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
          Stop debugging blind webhook failures. <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Get instant AI root-cause alerts.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed">
          HookLens intercepts failed webhooks from Stripe, Shopify, GitHub, and more. Gemini analyzes the payload, identifies the affected customer, and delivers actionable fixes straight into Slack.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 text-sm"
          >
            Start 14-Day Free Trial
            <span>→</span>
          </Link>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold px-6 py-3 rounded-xl transition text-sm"
          >
            See how it works
          </a>
        </div>

        {/* Live Preview Card */}
        <div className="mt-12 text-left bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                CRITICAL
              </span>
              <span className="font-semibold text-sm text-white">Stripe Webhook Failure</span>
              <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                👤 jane.doe@example.com
              </span>
            </div>
            <span className="text-xs text-slate-500 font-mono">Delivered to #dev-alerts</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider">Summary</span>
              <p className="text-slate-200 text-sm mt-0.5">Recurring invoice payment failed due to insufficient customer funds on the card.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
                <span className="font-bold text-rose-400 uppercase">Root Cause</span>
                <p className="text-slate-300 mt-1">Stripe returned `card_declined` with decline code `insufficient_funds` on 3rd attempt.</p>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
                <span className="font-bold text-emerald-400 uppercase">Suggested Fix</span>
                <p className="text-slate-300 mt-1">Trigger customer billing update email or pause active subscription until a new card is provided.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 border-t border-slate-900 bg-slate-950/40">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Up and running in 3 steps</h2>
            <p className="text-sm text-slate-400">No complex SDKs or backend architecture rewrites required.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 space-y-3">
              <div className="h-9 w-9 bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold rounded-lg flex items-center justify-center text-sm">
                1
              </div>
              <h3 className="text-base font-semibold text-white">Get your endpoint</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Create a project to receive your secure ingest URL with a unique project API key.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 space-y-3">
              <div className="h-9 w-9 bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold rounded-lg flex items-center justify-center text-sm">
                2
              </div>
              <h3 className="text-base font-semibold text-white">Paste webhook URL</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add HookLens to Stripe, Shopify, or GitHub dead-letter queues as your failover receiver.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 space-y-3">
              <div className="h-9 w-9 bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold rounded-lg flex items-center justify-center text-sm">
                3
              </div>
              <h3 className="text-base font-semibold text-white">Receive Actionable Fixes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gemini triages failures instantly and posts clear root causes and solutions right into Slack.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 border-t border-slate-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center space-y-3 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-mono text-emerald-400">
              14-Day Free Trial • Up to 500 Events Included
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white">Simple, predictable pricing</h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Start with a 14-day free trial on any plan. No credit card required upfront.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Starter Plan */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Starter</h3>
                <p className="text-xs text-slate-400">Perfect for indie hackers and small side-projects.</p>
                <div className="text-3xl font-extrabold text-white">$19 <span className="text-xs font-normal text-slate-400">/ month</span></div>
                <ul className="space-y-2 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <li className="flex items-center gap-2">✓ Up to 500 events / mo</li>
                  <li className="flex items-center gap-2">✓ Gemini 3.5 Flash triage</li>
                  <li className="flex items-center gap-2">✓ Slack webhook alerts</li>
                  <li className="flex items-center gap-2">✓ 14 days log retention</li>
                </ul>
              </div>
              <Link href="/dashboard" className="block text-center w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition">
                Start 14-day trial
              </Link>
            </div>

            {/* Growth Plan (Most Popular) */}
            <div className="bg-gradient-to-b from-blue-950/40 to-slate-900 border border-blue-500/30 rounded-2xl p-6 space-y-6 flex flex-col justify-between relative shadow-xl shadow-blue-500/5">
              <span className="absolute -top-3 right-6 bg-blue-600 text-white font-semibold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">
                Most Popular
              </span>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Growth</h3>
                <p className="text-xs text-slate-400">For fast-growing SaaS apps with steady webhook volume.</p>
                <div className="text-3xl font-extrabold text-white">$29 <span className="text-xs font-normal text-slate-400">/ month</span></div>
                <ul className="space-y-2 text-xs text-slate-300 pt-4 border-t border-slate-800/80">
                  <li className="flex items-center gap-2">✓ Up to 10,000 events / mo</li>
                  <li className="flex items-center gap-2">✓ Gemini 3.5 Flash triage</li>
                  <li className="flex items-center gap-2">✓ Multi-channel Slack alerts</li>
                  <li className="flex items-center gap-2">✓ 60 days log retention & export</li>
                </ul>
              </div>
              <Link href="/dashboard" className="block text-center w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition shadow-lg shadow-blue-500/20">
                Start 14-day trial
              </Link>
            </div>

            {/* Scale Plan */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Scale</h3>
                <p className="text-xs text-slate-400">For high-throughput systems and larger developer teams.</p>
                <div className="text-3xl font-extrabold text-white">$49 <span className="text-xs font-normal text-slate-400">/ month</span></div>
                <ul className="space-y-2 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <li className="flex items-center gap-2">✓ Unlimited events</li>
                  <li className="flex items-center gap-2">✓ Priority Gemini triage pipeline</li>
                  <li className="flex items-center gap-2">✓ Unlimited log retention</li>
                  <li className="flex items-center gap-2">✓ Multi-project API keys</li>
                  <li className="flex items-center gap-2">✓ Priority email & chat support</li>
                </ul>
              </div>
              <Link href="/dashboard" className="block text-center w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition">
                Start 14-day trial
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-10 text-center text-xs text-slate-500">
        <p>© 2026 HookLens. Built for developers monitoring webhooks.</p>
      </footer>

    </div>
  );
}