export interface ChangelogEntry {
  date: string;
  title: string;
  description: string;
  type: 'Feature' | 'Improvement' | 'Fix' | 'Integration';
}

export const changelogData: ChangelogEntry[] = [
  {
    date: 'August 16, 2026',
    title: 'Robust Magic Link Authentication',
    description: 'Completely overhauled the login flow to ensure stable session handling and automatic redirects to the dashboard across all browsers.',
    type: 'Improvement',
  },
  {
    date: 'August 15, 2026',
    title: 'Global English Translation',
    description: 'Translated the entire core platform and login experience to English to support our global expansion and developer community.',
    type: 'Improvement',
  },
  {
    date: 'August 12, 2026',
    title: 'AI-Powered Triage for Stripe & Shopify',
    description: 'Launched real-time error diagnosis for Stripe and Shopify webhooks using Gemini AI to provide instant root-cause analysis.',
    type: 'Integration',
  },
  {
    date: 'August 10, 2026',
    title: 'HookLens Initial Launch',
    description: 'The first version of HookLens is live! Developers can now ingest webhooks and monitor their payload flows in real-time.',
    type: 'Feature',
  },
];
