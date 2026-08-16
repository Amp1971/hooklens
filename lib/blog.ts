export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  readTime: string;
  author: string;
  category: string;
  keywords: string[];
  content: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'how-to-fix-stripe-webhook-signature-verification-failed',
    title: 'How to Fix "Stripe Webhook Signature Verification Failed" in Next.js & Node.js',
    description: 'Learn why Stripe throws signature verification errors, why raw body parsing matters in Next.js App Router, and how to fix it permanently.',
    publishedAt: '2026-08-16',
    readTime: '4 min read',
    author: 'HookLens Engineering',
    category: 'Stripe & Billing',
    keywords: ['stripe webhook signature verification failed', 'stripe nextjs raw body', 'stripe signature error', 'webhook debugging'],
    content: `When integrating Stripe billing into Next.js App Router, one of the most common production errors is signature verification failure.

Stripe signs every outbound webhook using HMAC-SHA256 and attaches the cryptographic hash in the Stripe-Signature header. To verify this signature on your server, Stripe requires the exact raw byte buffer of the incoming HTTP request.

If your API route or middleware parses the body as JSON beforehand, formatting changes will invalidate the HMAC signature.

Fix it in Next.js App Router by reading req.text():
const body = await req.text();
const signature = req.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);

HookLens intercepts incoming payloads, diagnoses signature and schema issues with AI in seconds, and alerts your team in Slack before users report missing access.`
  },
  {
    slug: 'top-reasons-shopify-webhooks-fail-and-how-to-triage',
    title: 'Top 4 Reasons Shopify Webhooks Fail in Production (and How to Triage Them)',
    description: 'A deep-dive into Shopify webhook failures: HMAC validation issues, 5-second timeout thresholds, and rate limits.',
    publishedAt: '2026-08-16',
    readTime: '5 min read',
    author: 'HookLens Engineering',
    category: 'E-Commerce & APIs',
    keywords: ['shopify webhook failed', 'shopify hmac validation', 'shopify webhook 5 second timeout'],
    content: `Shopify webhooks are critical for inventory and order fulfillment. However, Shopify expects a 200 OK response within 5 seconds.

If your endpoint executes slow database queries or synchronous external API calls, latency spikes will cause Shopify to timeout and eventually unsubscribe your endpoint.

Always acknowledge webhooks immediately and offload processing to asynchronous background workers.`
  }
];

export function getAllPosts(): BlogPost[] {
  return BLOG_POSTS;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
