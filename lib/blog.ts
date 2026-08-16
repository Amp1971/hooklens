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
    content: `
## The Problem: Why Stripe Webhook Signatures Fail

When integrating Stripe billing into modern full-stack frameworks like Next.js (App Router) or Express, one of the most common production issues is the infamous error:

\`\`\`
StripeSignatureVerificationError: No signatures found matching the expected signature for payload
\`\`\`

Stripe signs every outbound webhook event using HMAC-SHA256 and attaches the cryptographic hash in the \`Stripe-Signature\` header. To verify this signature on your server, Stripe requires the **exact, unmodified raw byte buffer** of the incoming HTTP request.

---

## The 3 Most Common Causes

### 1. JSON Auto-Parsing Altering the Payload
If your API route or middleware parses the request body as JSON before passing it to Stripe's SDK, formatting details (such as whitespaces, line breaks, or key order) are modified. Even a single changed byte invalidates the HMAC signature.

### 2. Mismatched Webhook Secret (\`whsec_...\`)
Using the test webhook secret in production (or vice versa) will guarantee immediate verification failure. Make sure \`STRIPE_WEBHOOK_SECRET\` is correctly loaded from your environment variables.

### 3. Middleware Consuming the Stream
If a global middleware in Next.js reads the request body stream before it reaches your webhook route handler, the route receives an empty or incomplete body.

---

## The Solution for Next.js App Router (\`app/api/webhooks/route.ts\`)

In Next.js App Router, request handlers receive a standard Web API \`Request\` object. To verify the signature properly without body distortion, use \`req.text()\`:

\`\`\`typescript
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: Request) {
  const body = await req.text(); // Get raw text payload unmodified
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
      // Handle customer activation
      break;
    default:
      console.log(\`Unhandled event type \${event.type}\`);
  }

  return NextResponse.json({ received: true });
}
\`\`\`

---

## Stop Missing Webhook Outages with HookLens

Fixing the code is only step one. When third-party APIs update their schemas or downstream servers timeout, webhook failures happen silently in the background.

**HookLens** intercepts incoming payloads, diagnoses signature and schema issues with AI in seconds, and alerts your team in Slack before users report missing access.
    `,
  },
  {
    slug: 'top-reasons-shopify-webhooks-fail-and-how-to-triage',
    title: 'Top 4 Reasons Shopify Webhooks Fail in Production (and How to Triage Them)',
    description: 'A deep-dive into Shopify webhook failures: HMAC validation issues, 5-second timeout thresholds, and rate limits.',
    publishedAt: '2026-08-16',
    readTime: '5 min read',
    author: 'HookLens Engineering',
    category: 'E-Commerce & APIs',
    keywords: ['shopify webhook failed', 'shopify hmac validation', 'shopify webhook 5 second timeout', 'webhook retry policy'],
    content: `
## Why Shopify Webhooks Fail Silently

Shopify webhooks are critical for inventory synchronization, order fulfillment, and third-party SaaS integrations. However, Shopify has strict reliability constraints: if your endpoint fails to respond with a \`200 OK\` within **5 seconds**, Shopify records a failure and retries up to 19 times over 48 hours before completely unsubscribing your webhook endpoint.

---

## 1. The 5-Second Execution Timeout
If your webhook handler synchronously executes database writes, sends customer emails, or triggers external APIs before returning an HTTP response, latency spikes will cause Shopify to timeout.

**The Fix:** Always return an immediate \`200 OK\` response as soon as the payload is received and verified, then process the payload asynchronously using background jobs or queues.

---

## 2. Invalid HMAC-SHA256 Validation
Shopify includes an \`X-Shopify-Hmac-Sha256\` header generated using your app's Client Secret. 

Just like Stripe, reading a pre-parsed JSON body will break verification. Always compute the base64-encoded HMAC using the raw string:

\`\`\`typescript
import crypto from 'crypto';

export function verifyShopifyWebhook(rawBody: string, hmacHeader: string, secret: string): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader));
}
\`\`\`

---

## 3. Duplicate Deliveries (Idempotency Issues)
Shopify guarantees *at-least-once* delivery. Network retries mean your server may receive the exact same \`orders/create\` webhook twice.

**The Fix:** Always store the \`X-Shopify-Webhook-Id\` or order ID in an idempotent cache (such as Redis or Supabase) to prevent duplicate order processing.

---

## 4. Automatic Webhook Deletion
If your server returns consecutive 4xx or 5xx status codes, Shopify's automated system will flag the endpoint as broken and remove the webhook subscription without alerting your customers.

---

## Proactive Webhook Triage with HookLens

With **HookLens**, every failed Shopify webhook is captured, analyzed with AI, and reported directly to your engineering team with the exact root cause and suggested payload fix.
    `,
  },
];

export function getAllPosts(): BlogPost[] {
  return BLOG_POSTS;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
