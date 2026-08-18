import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Changelog — HookLens',
  description: 'Recent updates, improvements, and newly supported integrations.',
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-xs font-semibold text-emerald-400 hover:underline">
            &larr; Back to HookLens
          </Link>
          <h1 className="text-3xl font-extrabold text-white mt-4">Changelog & Product Updates</h1>
          <p className="text-sm text-slate-400 mt-1">Latest integrations, features, and platform enhancements.</p>
        </div>

        <div className="space-y-8 border-t border-slate-800 pt-8">
          {/* AI Engine & Real-Time Ingestion */}
          <div className="border-l-2 border-purple-500 pl-4 py-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-semibold text-purple-400 bg-purple-500/10 rounded">AI & Performance</span>
              <span className="text-xs text-slate-500">August 2026</span>
            </div>
            <h3 className="text-lg font-semibold text-white mt-2">Upgraded AI Triage to Gemini 3.6 Flash & Header-Based Auth</h3>
            <p className="text-sm text-slate-400 mt-1">
              Migrated the core webhook diagnostics engine to Google Gemini 3.6 Flash with secure header-level authentication. Delivers sub-second root-cause analyses, robust JSON schema enforcement, and granular remediation advice for live incidents.
            </p>
          </div>

          {/* Verification & Live Monitoring */}
          <div className="border-l-2 border-emerald-500 pl-4 py-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 rounded">Verified Integrations</span>
              <span className="text-xs text-slate-500">August 2026</span>
            </div>
            <h3 className="text-lg font-semibold text-white mt-2">End-to-End Incident Verification for Stripe & PayPal</h3>
            <p className="text-sm text-slate-400 mt-1">
              Completed end-to-end integration verifications across Stripe and PayPal ingestion pipelines. HookLens now accurately detects payment capture denials (<code className="text-xs text-slate-300 font-mono">PAYMENT.CAPTURE.DENIED</code>), checkout expirations (<code className="text-xs text-slate-300 font-mono">checkout.session.expired</code>), and subscriber cancellations with target user extraction.
            </p>
          </div>

          {/* WooCommerce */}
          <div className="border-l-2 border-emerald-500 pl-4 py-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 rounded">New Integration</span>
              <span className="text-xs text-slate-500">Earlier</span>
            </div>
            <h3 className="text-lg font-semibold text-white mt-2">WooCommerce Webhook Monitoring & Order Triage</h3>
            <p className="text-sm text-slate-400 mt-1">
              Native ingestion and real-time failure interception for WooCommerce. Track failed orders, cancelled transactions, inventory webhooks, and WordPress delivery timeouts automatically.
            </p>
          </div>

          {/* PayPal */}
          <div className="border-l-2 border-emerald-500 pl-4 py-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 rounded">New Integration</span>
              <span className="text-xs text-slate-500">Earlier</span>
            </div>
            <h3 className="text-lg font-semibold text-white mt-2">PayPal Webhook Monitoring & Error Triage</h3>
            <p className="text-sm text-slate-400 mt-1">
              Full native payload parsing and automated error classification for PayPal. Capture denials, payment failures, subscription cancellations, and chargeback disputes are now triaged in real-time.
            </p>
          </div>

          {/* Core Engine */}
          <div className="border-l-2 border-blue-500 pl-4 py-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-semibold text-blue-400 bg-blue-500/10 rounded">Core Engine</span>
            </div>
            <h3 className="text-lg font-semibold text-white mt-2">Multi-Provider AI Incident Root-Cause Analysis</h3>
            <p className="text-sm text-slate-400 mt-1">
              Automated diagnostic reports for Stripe, Shopify, GitHub, PayPal, WooCommerce, and custom webhook failures with actionable remediation steps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}