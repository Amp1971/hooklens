import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
  try {
    const { customerId, email } = await req.json();

    if (!stripeSecret) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY missing.' }, { status: 500 });
    }

    let targetCustomerId = customerId;

    // Hvis vi ikke har et customerId direkte, søger vi efter kunden via e-mail i Stripe
    if (!targetCustomerId && email) {
      const customers = await stripe.customers.list({ email: email, limit: 1 });
      if (customers.data.length > 0) {
        targetCustomerId = customers.data[0].id;
      }
    }

    if (!targetCustomerId) {
      return NextResponse.json(
        { error: 'No active Stripe customer found for this account.' },
        { status: 404 }
      );
    }

    const host = req.headers.get('host') || 'usehooklens.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const returnUrl = `${protocol}://${host}/dashboard`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: targetCustomerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: any) {
    console.error('Stripe Portal Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to open customer portal.' },
      { status: 500 }
    );
  }
}
