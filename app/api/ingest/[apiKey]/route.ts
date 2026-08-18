import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key);
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
    const geminiKey = process.env.GEMINI_API_KEY;

    let triage = {
      service: payload?.type?.startsWith('checkout.') || payload?.type?.includes('intent') ? 'Stripe' : 'Webhook',
      severity: 'MEDIUM',
      affected_user: payload?.data?.object?.customer_email || payload?.data?.object?.customer || 'N/A',
      summary: payload?.type || 'Webhook event received',
      root_cause: 'Payload processed',
      suggested_fix: 'Review raw payload details in dashboard',
    };

    // 2. Kør Gemini 3.6 Flash
    if (geminiKey) {
      try {
        const prompt = `You are HookLens AI, an automated webhook reliability and incident triage engine.
Analyze this webhook payload from any platform (Stripe, WooCommerce, PayPal, Shopify, Paddle, GitHub, Supabase, etc.).

Diagnose what happened, determine severity, extract affected customer email/ID, state the technical root cause, and provide a clear actionable developer solution.

Respond ONLY with a valid JSON object matching this schema:
{
  "service": "Platform name (e.g. Stripe, WooCommerce, PayPal, Shopify)",
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "affected_user": "Customer email, customer ID, user reference or 'N/A'",
  "summary": "Concise 1-sentence explanation in plain English",
  "root_cause": "Specific technical root cause based on payload codes/errors/cancellation reasons in plain English",
  "suggested_fix": "Actionable developer or merchant guidance to resolve or follow up in plain English"
}

Payload data:
${JSON.stringify(payload).slice(0, 10000)}`;

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`;

        const aiRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const rawText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            triage = JSON.parse(rawText);
          } else {
            triage.root_cause = 'Gemini returned empty candidate text';
            triage.suggested_fix = JSON.stringify(aiData).slice(0, 150);
          }
        } else {
          const errBody = await aiRes.text();
          triage.root_cause = `Gemini HTTP ${aiRes.status} Error`;
          triage.suggested_fix = errBody.slice(0, 150);
        }
      } catch (aiErr: any) {
        triage.root_cause = 'AI execution exception';
        triage.suggested_fix = (aiErr.message || 'Unknown network error').slice(0, 150);
      }
    } else {
      triage.root_cause = 'Missing GEMINI_API_KEY';
      triage.suggested_fix = 'Configure GEMINI_API_KEY in Vercel Environment Variables';
    }

    // 3. Gem i Supabase
    const { data: savedEvent, error: dbError } = await supabaseAdmin
      .from('webhook_events')
      .insert({
        project_id: project.id,
        service: triage.service || 'Webhook',
        severity: triage.severity || 'MEDIUM',
        affected_user: triage.affected_user || 'N/A',
        summary: triage.summary || payload?.type || 'Webhook Event',
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
    console.error('Ingest Route Fatal Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}