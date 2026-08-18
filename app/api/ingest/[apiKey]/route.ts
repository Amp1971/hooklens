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
      service: 'Webhook',
      severity: 'MEDIUM',
      affected_user: 'N/A',
      summary: payload?.type || 'Webhook event received',
      root_cause: 'Raw payload processed without AI analysis',
      suggested_fix: 'Check raw payload in dashboard',
    };

    // 2. Dynamisk AI Triage med Gemini (forstår alle platforme)
    if (geminiKey) {
      try {
        const prompt = `You are HookLens AI, an automated webhook reliability and incident triage engine.
Analyze this webhook payload from any service (Stripe, WooCommerce, PayPal, Shopify, Paddle, GitHub, Supabase, etc.).

Analyze what happened, determine severity, identify customer/user (if any), diagnose the exact root cause, and formulate a clear, actionable solution for the developer.

Respond ONLY with a valid JSON object matching this schema:
{
  "service": "Service name (e.g. Stripe, WooCommerce, PayPal, Shopify)",
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "affected_user": "Customer email, customer ID, user reference or 'N/A'",
  "summary": "Concise 1-sentence explanation of what occurred in plain English",
  "root_cause": "Specific technical root cause based on payload codes/errors/cancellation reasons in plain English",
  "suggested_fix": "Concrete developer or business action to resolve or follow up in plain English"
}

Payload data:
${JSON.stringify(payload).slice(0, 10000)}`;

        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.2,
              },
            }),
          }
        );

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const rawText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            triage = JSON.parse(rawText);
          }
        } else {
          const errorDetails = await aiRes.text();
          console.error('Gemini API Error details:', errorDetails);
        }
      } catch (aiErr) {
        console.error('AI Triage execution failed:', aiErr);
      }
    } else {
      console.warn('GEMINI_API_KEY is not defined in environment variables.');
    }

    // 3. Gem den AI-analyserede hændelse i Supabase
    const { data: savedEvent, error: dbError } = await supabaseAdmin
      .from('webhook_events')
      .insert({
        project_id: project.id,
        service: triage.service || 'Webhook',
        severity: triage.severity || 'MEDIUM',
        affected_user: triage.affected_user || 'N/A',
        summary: triage.summary || 'Webhook Event',
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