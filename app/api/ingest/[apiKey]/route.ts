import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key);
}

// Intelligent regel-baseret triage til øjeblikkelig analyse
function parseStripeEvent(type: string, dataObj: any) {
  switch (type) {
    case 'checkout.session.expired':
      return {
        service: 'Stripe',
        severity: 'HIGH',
        affected_user: dataObj?.customer_details?.email || dataObj?.customer || dataObj?.id || 'N/A',
        summary: 'Checkout session expired without payment completion',
        root_cause: 'Customer abandoned the checkout flow before completing payment within the session window.',
        suggested_fix: 'Send an automated cart abandonment recovery email with a fresh checkout link.',
      };
    case 'payment_intent.payment_failed':
    case 'charge.failed':
      return {
        service: 'Stripe',
        severity: 'CRITICAL',
        affected_user: dataObj?.customer || dataObj?.billing_details?.email || 'N/A',
        summary: `Payment failed: ${dataObj?.last_payment_error?.message || dataObj?.failure_message || 'Declined'}`,
        root_cause: dataObj?.last_payment_error?.code || dataObj?.failure_code || 'card_declined',
        suggested_fix: 'Notify customer to update payment method or retry with 3D Secure verification.',
      };
    case 'customer.subscription.deleted':
      return {
        service: 'Stripe',
        severity: 'HIGH',
        affected_user: dataObj?.customer || 'N/A',
        summary: 'Customer subscription canceled',
        root_cause: 'Subscription reached period end or was canceled via billing portal.',
        suggested_fix: 'Trigger offboarding survey and churn mitigation outreach.',
      };
    case 'invoice.payment_failed':
      return {
        service: 'Stripe',
        severity: 'CRITICAL',
        affected_user: dataObj?.customer_email || dataObj?.customer || 'N/A',
        summary: 'Recurring invoice payment failed',
        root_cause: dataObj?.last_payment_error?.message || 'Invoice charge failure',
        suggested_fix: 'Initiate Smart Retries / Dunning sequence before revoking access.',
      };
    default:
      return null;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ apiKey: string }> | { apiKey: string } }
) {
  try {
    const resolvedParams = await params;
    const apiKey = resolvedParams.apiKey;

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Verificer projekt
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('api_key', apiKey)
      .maybeSingle();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing HookLens API key.' },
        { status: 401 }
      );
    }

    const payload = await request.json();
    const eventType = payload?.type || 'webhook.event';
    const dataObj = payload?.data?.object || payload;

    // 2. Kør regel-baseret analyse først
    let triage = parseStripeEvent(eventType, dataObj) || {
      service: eventType.includes('.') ? 'Stripe' : 'Generic',
      severity: 'MEDIUM',
      affected_user: dataObj?.customer_email || dataObj?.email || dataObj?.customer || 'N/A',
      summary: `Webhook event: ${eventType}`,
      root_cause: 'Webhook delivered to ingest endpoint',
      suggested_fix: 'Inspect payload details',
    };

    // 3. Hvis Gemini AI er tilgængelig og hændelsen er ukendt, kør LLM triage
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && (!triage || triage.severity === 'MEDIUM')) {
      try {
        const prompt = `You are HookLens AI. Analyze this webhook payload JSON and provide diagnosis.
Respond ONLY with JSON matching:
{
  "service": "Service name",
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "affected_user": "email or user ID or N/A",
  "summary": "Clear summary in English",
  "root_cause": "Technical root cause in English",
  "suggested_fix": "Actionable developer fix in English"
}
Payload:
${JSON.stringify(payload).slice(0, 4000)}`;

        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (aiRes.ok) {
          const aiJson = await aiRes.json();
          const rawText = aiJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            triage = JSON.parse(rawText);
          }
        }
      } catch (err) {
        console.error('Gemini call error:', err);
      }
    }

    // 4. Gem hændelsen i Supabase
    const { data: savedEvent, error: dbError } = await supabaseAdmin
      .from('webhook_events')
      .insert({
        project_id: project.id,
        service: triage.service || 'Stripe',
        severity: triage.severity || 'HIGH',
        affected_user: triage.affected_user || 'N/A',
        summary: triage.summary || eventType,
        root_cause: triage.root_cause || '',
        suggested_fix: triage.suggested_fix || '',
        raw_payload: payload,
      })
      .select()
      .maybeSingle();

    if (dbError) {
      console.error('Database Ingest Error:', dbError);
    }

    return NextResponse.json({
      success: true,
      data: savedEvent || triage,
    });
  } catch (error: any) {
    console.error('Ingest Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}