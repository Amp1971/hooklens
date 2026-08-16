import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(req: Request) {
  try {
    const { plan } = await req.json();

    let priceId = '';
    if (plan === 'starter') priceId = process.env.STRIPE_PRICE_STARTER || '';
    if (plan === 'growth') priceId = process.env.STRIPE_PRICE_GROWTH || '';
    if (plan === 'scale') priceId = process.env.STRIPE_PRICE_SCALE || '';

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'STRIPE_SECRET_KEY is not configured.' },
        { status: 500 }
      );
    }

    if (!priceId) {
      return NextResponse.json(
        { error: `Missing Price ID for plan: ${plan}` },
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
      success_url: `${origin}/login?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/#pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Checkout Error:', err);
    return NextResponse.json(
      { error: err.message || 'Payment session creation failed.' },
      { status: 500 }
    );
  }
}
