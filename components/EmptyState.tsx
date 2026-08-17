'use client';

import { useState } from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  apiKey: string;
  projectId: string;
  onMockSent?: () => void;
}

export default function EmptyState({ apiKey, projectId, onMockSent }: EmptyStateProps) {
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const ingestUrl = `https://usehooklens.com/api/ingest/${apiKey}`;
  const curlCommand = `curl -X POST ${ingestUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"event": "invoice.payment_failed", "customer": "cus_test123", "amount": 2900}'`;

  const copyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendMockEvent = async () => {
    setSending(true);
    try {
      await fetch(`/api/ingest/${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'invoice.payment_failed',
          data: {
            object: {
              id: 'in_mock_' + Math.random().toString(36).substring(2, 9),
              amount_due: 2900,
              currency: 'usd',
              customer: 'cus_mock_user',
              attempt_count: 3,
              last_payment_error: {
                message: 'Your card was declined. The card has expired.',
                code: 'card_declined',
                decline_code: 'expired_card'
              }
            }
          }
        }),
      });
      if (onMockSent) onMockSent();
      window.location.reload();
    } catch (e) {
      console.error('Failed to send mock event', e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 text-center max-w-3xl mx-auto my-8 space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
        <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white tracking-tight">
          Waiting for your first webhook
        </h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Send a test event from your terminal, trigger a Stripe test webhook, or send an instant mock event to see HookLens AI in action.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={sendMockEvent}
          disabled={sending}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-blue-600/30 flex items-center gap-2"
        >
          {sending ? 'Sending...' : '⚡ Send Instant Mock Webhook'}
        </button>
        <Link
          href="/docs"
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider transition border border-slate-700"
        >
          View Setup Manuals &rarr;
        </Link>
      </div>

      {/* Quick Terminal Test */}
      <div className="text-left bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Test via cURL</span>
          <button
            onClick={copyCurl}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
          >
            {copied ? 'Copied to clipboard!' : 'Copy cURL'}
          </button>
        </div>
        <pre className="text-xs font-mono text-blue-300 overflow-x-auto p-2 bg-slate-900/50 rounded-lg">
          <code>{curlCommand}</code>
        </pre>
      </div>
    </div>
  );
}
