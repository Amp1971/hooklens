import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16' as any,
  });
}

// Pris-definitioner svarende til landing page ($19, $29, $49)
const PLANS: Record<string, { name: string; amount: number; description: string }> = {
  starter: {
    name: 'HookLens Starter',
    amount: 1900, // $19.00 USD
    description: 'Up to 10,000 events/mo, 3 active endpoints, Instant Slack alerts, 7 days log retention'
  },
  growth: {
    name: 'HookLens Growth',
    amount: 2400, // $29.00 USD
    description: 'Up to 100,000 events/mo, Unlimited endpoints, Slack & Discord alerts, AI Root-Cause Analysis, 30 days log retention'
  },
  scale: {
    name: 'HookLens Scale',
    amount: 4900, // $49.00 USD
    description: 'Unlimited events, Dedicated ingest latency, Webhook dispatch, 90 days log retention, Priority SLA support'
  }
};

export async function POST(req: Request) {
  try {
    const { plan, email } = await req.json();
    const selectedPlan = PLANS[plan?.toLowerCase()] || PLANS.growth;

    const stripe = getStripe();
    const origin = req.headers.get('origin') || 'https://www.usehooklens.com';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPlan.name,
              description: selectedPlan.description,
            },
            unit_amount: selectedPlan.amount,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          plan_tier: plan?.toLowerCase() || 'growth',
        },
      },
      metadata: {
        plan_tier: plan?.toLowerCase() || 'growth',
      },
      success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create checkout session' }, { status: 500 });
  }
}
