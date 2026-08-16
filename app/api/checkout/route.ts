import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16' as any,
});

const PRICE_MAP: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || 'price_1U52Cb6FT6LEV4HsxiN1JcyD',
  growth: process.env.STRIPE_PRICE_GROWTH || 'price_1U52DQ6FT6LEV4HsjrvLtaVR',
  scale: process.env.STRIPE_PRICE_SCALE || 'price_1U52EB6FT6LEV4HsCZ7SfNOH',
};

export async function POST(req: Request) {
  try {
    const { plan } = await req.json();
    const priceId = PRICE_MAP[plan];

    if (!stripeSecret) {
      return NextResponse.json(
        { error: 'STRIPE_SECRET_KEY is missing on server.' },
        { status: 500 }
      );
    }

    if (!priceId) {
      return NextResponse.json(
        { error: `Invalid plan selected: ${plan}` },
        { status: 400 }
      );
    }

    const host = req.headers.get('host') || 'usehooklens.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const origin = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 14, // 14 dages gratis prøveperiode aktiveret her
      },
      success_url: `${origin}/login?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/#pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Checkout Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create checkout session.' },
      { status: 500 }
    );
  }
}
