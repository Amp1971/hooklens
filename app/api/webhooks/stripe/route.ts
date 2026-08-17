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
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_details?.email?.toLowerCase()?.trim();
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const tier = session.metadata?.plan_tier || 'starter';

        if (customerEmail) {
          // 1. Tjek om brugeren findes i Supabase Auth
          const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
          let user = userData?.users?.find(u => u.email?.toLowerCase() === customerEmail);

          // Hvis brugeren IKKE findes endnu (købte direkte fra landing page):
          if (!user) {
            const { data: newUser } = await supabaseAdmin.auth.admin.createUser({
              email: customerEmail,
              email_confirm: true,
            });
            user = newUser?.user || undefined;
          }

          if (user) {
            // Upsert profilen med det korrekte plan_tier og Stripe IDs
            await supabaseAdmin
              .from('profiles')
              .upsert({
                id: user.id,
                email: customerEmail,
                plan_tier: tier,
                subscription_status: 'active',
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                updated_at: new Date().toISOString(),
              });
          }
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;

        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: status === 'trialing' ? 'active' : status,
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabaseAdmin
          .from('profiles')
          .update({
            plan_tier: 'trial',
            subscription_status: 'canceled',
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook event:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
