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
    const body = await req.json().catch(() => ({}));
    const email = body?.email || 'allan@alssund-massage.dk';

    const supabaseAdmin = getSupabaseAdmin();
    const stripe = getStripe();

    let customerId: string | null = null;

    // 1. Tjek i Supabase profiles via e-mail
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('email', email)
      .limit(1);

    if (profiles && profiles.length > 0 && profiles[0].stripe_customer_id) {
      customerId = profiles[0].stripe_customer_id;
    }

    // 2. Hvis ikke fundet i databasen, slå direkte op i Stripe via e-mail
    if (!customerId && email) {
      const stripeCustomers = await stripe.customers.list({
        email: email.toLowerCase().trim(),
        limit: 1,
      });
      if (stripeCustomers.data.length > 0) {
        customerId = stripeCustomers.data[0].id;
        
        // Gem fundet ID i Supabase profiles så det er synkroniseret
        await supabaseAdmin
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('email', email);
      }
    }

    // 3. Fallback: Hent enhver profil der har et stripe_customer_id
    if (!customerId) {
      const { data: anyProfile } = await supabaseAdmin
        .from('profiles')
        .select('stripe_customer_id')
        .not('stripe_customer_id', 'is', null)
        .limit(1);

      if (anyProfile && anyProfile.length > 0) {
        customerId = anyProfile[0].stripe_customer_id;
      }
    }

    if (!customerId) {
      return NextResponse.json({ error: 'Ingen Stripe kunde fundet for denne konto.' }, { status: 404 });
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
