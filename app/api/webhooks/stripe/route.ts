import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

// Brug Service Role Key så webhooken har rettigheder til at opdatere profiles
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event: Stripe.Event;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body);
    }
  } catch (err: any) {
    console.error('⚠️ Stripe Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook Error: ' + err.message }, { status: 400 });
  }

  try {
    switch (event.type) {
      // 1. Når en kunde gennemfører checkout og køber et abonnement
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const clientReferenceId = session.client_reference_id; // Supabase user_id

        // Find ud af hvilken plan der blev købt ud fra beløb/metadata
        let planTier = 'starter';
        if (session.amount_total === 2900) planTier = 'growth';
        if (session.amount_total === 4900) planTier = 'scale';

        if (clientReferenceId) {
          await supabase
            .from('profiles')
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan_tier: planTier,
              subscription_status: 'active',
              monthly_events_count: 0,
              monthly_ai_diagnoses_count: 0,
              current_period_start: new Date().toISOString(),
            })
            .eq('id', clientReferenceId);
        } else if (customerId) {
          await supabase
            .from('profiles')
            .update({
              stripe_subscription_id: subscriptionId,
              plan_tier: planTier,
              subscription_status: 'active',
              monthly_events_count: 0,
              monthly_ai_diagnoses_count: 0,
              current_period_start: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      // 2. Månedlig fornyelse - nulstil tællere og sæt status til active
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer as string;

        if (customerId) {
          await supabase
            .from('profiles')
            .update({
              monthly_events_count: 0,
              monthly_ai_diagnoses_count: 0,
              subscription_status: 'active',
              current_period_start: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      // 3. Manglende betaling (kort afvist)
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer as string;

        if (customerId) {
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'past_due',
            })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      // 4. Opsagt abonnement
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        if (customerId) {
          await supabase
            .from('profiles')
            .update({
              plan_tier: 'trial',
              subscription_status: 'canceled',
            })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling Stripe webhook:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
