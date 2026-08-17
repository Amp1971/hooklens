export type PlanTier = 'trial' | 'starter' | 'growth' | 'scale';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled';

export interface PlanLimits {
  name: string;
  priceUSD: number;
  maxMonthlyEvents: number;
  maxProjects: number;
  retentionDays: number;
  allowDiscord: boolean;
  allowWebhookDispatch: boolean;
  allowAIAnalysis: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  trial: {
    name: '14-Day Free Trial',
    priceUSD: 0,
    maxMonthlyEvents: 10000,
    maxProjects: 3,
    retentionDays: 14,
    allowDiscord: true,
    allowWebhookDispatch: true,
    allowAIAnalysis: true,
  },
  starter: {
    name: 'Starter Plan',
    priceUSD: 19,
    maxMonthlyEvents: 10000,
    maxProjects: 3,
    retentionDays: 7,
    allowDiscord: false,
    allowWebhookDispatch: false,
    allowAIAnalysis: false,
  },
  growth: {
    name: 'Growth Plan',
    priceUSD: 29,
    maxMonthlyEvents: 100000,
    maxProjects: 999999, // Unlimited
    retentionDays: 30,
    allowDiscord: true,
    allowWebhookDispatch: false,
    allowAIAnalysis: true,
  },
  scale: {
    name: 'Scale Plan',
    priceUSD: 49,
    maxMonthlyEvents: 999999999, // Unlimited
    maxProjects: 999999, // Unlimited
    retentionDays: 90,
    allowDiscord: true,
    allowWebhookDispatch: true,
    allowAIAnalysis: true,
  },
};

export function checkUserAccess(profile: {
  plan_tier?: string | null;
  subscription_status?: string | null;
  trial_ends_at?: string | null;
  monthly_events_count?: number | null;
}) {
  const tier = (profile.plan_tier as PlanTier) || 'trial';
  const status = (profile.subscription_status as SubscriptionStatus) || 'trialing';
  const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.trial;

  const now = new Date();
  const trialEnd = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const isTrialExpired = status === 'trialing' && !!trialEnd && trialEnd < now;

  const isSubscriptionActive = status === 'active';
  const hasValidAccess = !isTrialExpired || isSubscriptionActive;

  const eventsCount = profile.monthly_events_count || 0;
  const isEventLimitReached = eventsCount >= limits.maxMonthlyEvents;

  let daysRemainingInTrial = 0;
  if (status === 'trialing' && trialEnd) {
    const diffTime = trialEnd.getTime() - now.getTime();
    daysRemainingInTrial = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  return {
    tier,
    status,
    limits,
    hasValidAccess,
    isTrialExpired,
    daysRemainingInTrial,
    isEventLimitReached,
    eventsCount,
  };
}
