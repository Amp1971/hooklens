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
    content: `When integrating Stripe billing into modern full-stack frameworks like Next.js (App Router) or Node.js, one of the most common production errors is the signature verification failure.

Stripe signs every outbound webhook event using HMAC-SHA256 and attaches the cryptographic hash in the \`Stripe-Signature\` header. To verify this signature on your server, Stripe requires the **exact raw byte buffer** of the incoming HTTP request.

---

### The 3 Most Common Causes

1. **JSON Auto-Parsing Altering the Payload:** If your API route or middleware parses the request body as JSON before passing it to Stripe's SDK, subtle formatting details (like whitespace or key order) are modified. Even a single changed byte invalidates the HMAC signature.
2. **Mismatched Webhook Secret (\`whsec_...\`):** Using the test webhook secret in production (or vice versa) will guarantee immediate verification failure. Make sure \`STRIPE_WEBHOOK_SECRET\` matches your current environment.
3. **Middleware Consuming the Stream:** If global middleware reads the request body stream before it reaches your webhook route handler, the route receives an empty or incomplete body.

---

### The Permanent Fix for Next.js App Router

In Next.js App Router, request handlers receive a standard Web API \`Request\` object. To verify the signature properly without body distortion, use \`req.text()\`:

\`\`\`typescript
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: Request) {
  const body = await req.text(); // Get unmodified raw body
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err: any) {
    console.error(\`Webhook signature verification failed: \${err.message}\`);
    return NextResponse.json({ error: \`Webhook Error: \${err.message}\` }, { status: 400 });
  }

  // Handle the verified event
  switch (event.type) {
    case 'checkout.session.completed':
      // Activate customer account or subscription
      break;
    default:
      console.log(\`Unhandled event type: \${event.type}\`);
  }

  return NextResponse.json({ received: true });
}
\`\`\`

---

### Never Miss a Silent Webhook Outage

When third-party APIs change schemas or downstream servers experience latency, webhook failures happen silently. HookLens intercepts incoming payloads, diagnoses signature and schema issues with AI in seconds, and alerts your team in Slack before users report missing access.`
  },
  {
    slug: 'top-reasons-shopify-webhooks-fail-and-how-to-triage',
    title: 'Top 4 Reasons Shopify Webhooks Fail in Production (and How to Triage Them)',
    description: 'A deep-dive into Shopify webhook failures: HMAC validation issues, 5-second timeout thresholds, duplicate deliveries, and automatic unsubscriptions.',
    publishedAt: '2026-08-16',
    readTime: '5 min read',
    author: 'HookLens Engineering',
    category: 'E-Commerce & APIs',
    keywords: ['shopify webhook failed', 'shopify hmac validation', 'shopify webhook 5 second timeout', 'webhook retry policy'],
    content: `Shopify webhooks are critical for inventory synchronization, order fulfillment, and third-party SaaS integrations. However, Shopify enforces strict reliability rules: if your endpoint fails to respond with an HTTP \`200 OK\` within **5 seconds**, Shopify records a delivery failure and initiates an exponential retry policy.

If consecutive delivery attempts fail over a period of 48 hours, Shopify will **automatically delete your webhook subscription** without notifying your store admins.

Here are the top 4 reasons Shopify webhooks fail in production and how to prevent them:

---

### 1. The 5-Second Timeout Threshold

If your webhook handler synchronously executes heavy database writes, sends customer confirmation emails, or makes external third-party API calls before responding, latency spikes will quickly exceed Shopify's 5-second cutoff.

**The Solution: Asynchronous Processing**
Always return an immediate \`200 OK\` response as soon as the payload is received and authenticated, then offload the actual job to a background worker or queue (such as Redis, Inngest, or Supabase queues).

\`\`\`typescript
export async function POST(req: Request) {
  const rawBody = await req.text();
  const hmac = req.headers.get('X-Shopify-Hmac-Sha256');

  if (!verifyHmac(rawBody, hmac)) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 1. Enqueue job for background processing
  await queue.push({ event: JSON.parse(rawBody) });

  // 2. Respond immediately to satisfy Shopify's 5s threshold
  return new Response('OK', { status: 200 });
}
\`\`\`

---

### 2. Invalid HMAC-SHA256 Header Verification

Shopify signs every outgoing payload using HMAC-SHA256 based on your app's Client Secret and passes the result in the \`X-Shopify-Hmac-Sha256\` header.

Just like Stripe, attempting to compute the hash on a JSON-parsed object instead of the **raw string body** causes instant validation failure.

**The Solution: Timing-Safe Comparison on Raw String**

\`\`\`typescript
import crypto from 'crypto';

export function verifyShopifyHmac(rawBody: string, headerHmac: string, secret: string): boolean {
  const generatedHash = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(generatedHash),
    Buffer.from(headerHmac)
  );
}
\`\`\`

---

### 3. Duplicate Deliveries (Missing Idempotency)

Shopify operates on an *at-least-once* delivery guarantee. If a network hiccup occurs between your server and Shopify during the response phase, Shopify may retry the delivery, resulting in your server receiving the identical \`orders/create\` or \`orders/paid\` event multiple times.

**The Solution: Track Webhook IDs**
Every Shopify webhook includes a unique \`X-Shopify-Webhook-Id\` header. Store processed IDs in a cache or database with a 24-hour TTL:

* If the ID is already marked as processed, return \`200 OK\` immediately and skip execution.
* If it is new, process the event and store the ID.

---

### 4. Silent Endpoint Unsubscription

When Shopify's retry mechanism encounters consistent \`4xx\` or \`5xx\` responses across 19 attempts, the endpoint subscription is automatically deleted. The store will stop receiving updates entirely, and the issue often goes unnoticed until customers complain about delayed orders.

---

### Proactive Webhook Triage with HookLens

With **HookLens**, every incoming webhook is logged, analyzed by AI for signature mismatches or schema issues, and routed directly to Slack or Discord with the exact payload fix before timeouts turn into outages.`
  }
];

export function getAllPosts(): BlogPost[] {
  return BLOG_POSTS;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
