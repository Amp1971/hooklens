'use client';

import Link from 'next/link';
import { PlanTier, SubscriptionStatus } from '@/lib/tier-limits';

interface TrialBannerProps {
  tier: PlanTier;
  status: SubscriptionStatus;
  daysRemaining: number;
  isExpired: boolean;
  eventsCount: number;
  maxEvents: number;
  graceEvents: number;
}

export default function TrialBanner({
  tier,
  status,
  daysRemaining,
  isExpired,
  eventsCount,
  maxEvents,
  graceEvents,
}: TrialBannerProps) {
  const isWarning80 = eventsCount >= Math.floor(maxEvents * 0.8) && eventsCount < maxEvents;
  const isInGrace = eventsCount >= maxEvents && eventsCount < graceEvents;
  const isHardBlocked = eventsCount >= graceEvents;

  if (isExpired) {
    return (
      <div className="bg-red-950/40 border border-red-500/40 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <p className="text-sm font-bold text-red-300">
            ⚠️ Your 14-day free trial has ended
          </p>
          <p className="text-xs text-red-200/70">
            Upgrade your account to resume webhook ingestion and AI diagnostics.
          </p>
        </div>
        <Link
          href="/#pricing"
          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition shrink-0 shadow-lg shadow-red-600/30"
        >
          Upgrade Now &rarr;
        </Link>
      </div>
    );
  }

  if (isHardBlocked) {
    return (
      <div className="bg-red-950/40 border border-red-500/40 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="space-y-1">
          <p className="text-sm font-bold text-red-300">
            ⛔ Monthly Event Limit & Grace Buffer Reached
          </p>
          <p className="text-xs text-red-200/70">
            You have logged {eventsCount.toLocaleString()} events. Ingestion is paused. Upgrade your plan to instantly restore ingestion.
          </p>
        </div>
        <Link
          href="/#pricing"
          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition shrink-0"
        >
          Upgrade Plan &rarr;
        </Link>
      </div>
    );
  }

  if (isInGrace) {
    return (
      <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
          <p className="text-xs text-amber-200">
            <span className="font-bold text-white">Grace Margin Active:</span> You reached {eventsCount.toLocaleString()} / {maxEvents.toLocaleString()} events. We are temporarily buffering events up to {graceEvents.toLocaleString()}.
          </p>
        </div>
        <Link
          href="/#pricing"
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold uppercase tracking-wider transition shrink-0"
        >
          Upgrade to Growth &rarr;
        </Link>
      </div>
    );
  }

  if (isWarning80) {
    return (
      <div className="bg-yellow-950/30 border border-yellow-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
          <p className="text-xs text-yellow-200">
            You have used 80% of your monthly event quota ({eventsCount.toLocaleString()} / {maxEvents.toLocaleString()}).
          </p>
        </div>
        <Link
          href="/#pricing"
          className="text-xs text-yellow-400 hover:underline font-semibold"
        >
          View Plans &rarr;
        </Link>
      </div>
    );
  }

  if (status === 'active') {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs text-slate-400 mb-6">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <p>
            Plan: <span className="font-bold text-white uppercase">{tier}</span> • Events this month: <span className="font-semibold text-slate-200">{eventsCount.toLocaleString()} / {maxEvents.toLocaleString()}</span>
          </p>
        </div>
        <Link href="/#pricing" className="text-blue-400 hover:text-blue-300 font-semibold transition">
          Manage Plan &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-blue-950/30 border border-blue-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
        <p className="text-xs text-blue-200">
          <span className="font-bold text-white">{daysRemaining} days left</span> in your 14-Day Free Trial ({eventsCount} / {maxEvents} events logged).
        </p>
      </div>
      <Link
        href="/#pricing"
        className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold uppercase tracking-wider transition shrink-0"
      >
        Select a Plan &rarr;
      </Link>
    </div>
  );
}
