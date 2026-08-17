import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, serviceKey);
}

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16' as any,
  });
}

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const stripe = getStripe();

    // Hent den seneste profil med et registreret Stripe kunde-id
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .not('stripe_customer_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1);

    const customerId = profiles && profiles.length > 0 ? profiles[0].stripe_customer_id : null;

    if (!customerId) {
      return NextResponse.json({ error: 'Ingen aktiv Stripe-kunde fundet.' }, { status: 404 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.headers.get('origin') || 'https://www.usehooklens.com'}/dashboard`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: any) {
    console.error('Error creating portal session:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
