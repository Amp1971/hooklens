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

    // 1. Verificer projektet ud fra API-nøglen
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

    // 2. Kør AI Triage med direkte Gemini REST API
    let triage = {
      service: payload?.type?.startsWith('checkout.') ? 'Stripe' : 'Generic',
      severity: 'MEDIUM',
      affected_user: 'N/A',
      summary: payload?.type || 'Webhook event received',
      root_cause: 'Payload event triggered',
      suggested_fix: 'Review event details in dashboard',
    };

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const prompt = `You are HookLens AI, an expert webhook monitoring engine.
Analyze this webhook payload. Detect service/source (e.g. Stripe, Shopify, GitHub), severity level, affected customer email/ID, root cause, and actionable fix.

Payload:
${JSON.stringify(payload, null, 2)}

Respond ONLY with a valid JSON object matching this schema:
{
  "service": "Stripe" | "Shopify" | "PayPal" | "WooCommerce" | "Other",
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "affected_user": "User email or customer ID or 'N/A'",
  "summary": "Short descriptive summary",
  "root_cause": "Exact technical root cause",
  "suggested_fix": "Actionable developer guidance to resolve or mitigate"
}`;

        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
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
        } else {
          const errBody = await aiRes.text();
          console.error('Gemini API Error Response:', errBody);
        }
      } catch (aiErr) {
        console.error('AI Triage exception:', aiErr);
      }
    }

    // 3. Gem hændelsen i Supabase
    const { data: savedEvent, error: dbError } = await supabaseAdmin
      .from('webhook_events')
      .insert({
        project_id: project.id,
        service: triage.service || 'Stripe',
        severity: triage.severity || 'MEDIUM',
        affected_user: triage.affected_user || 'N/A',
        summary: triage.summary || 'Webhook event received',
        root_cause: triage.root_cause || '',
        suggested_fix: triage.suggested_fix || '',
        raw_payload: payload,
      })
      .select()
      .maybeSingle();

    if (dbError) {
      console.error('Database Ingest Error:', dbError);
    }

    // 4. Send Slack Notifikation
    const slackUrl = project.slack_webhook_url || process.env.SLACK_WEBHOOK_URL;
    if (slackUrl) {
      const color = triage.severity === 'CRITICAL' ? '#E01E5A' : triage.severity === 'HIGH' ? '#ECB22E' : '#2EB67D';
      const slackMessage = {
        attachments: [
          {
            color: color,
            blocks: [
              {
                type: 'header',
                text: {
                  type: 'plain_text',
                  text: `🚨 [${triage.severity}] ${triage.service} Incident: ${project.name}`,
                  emoji: true,
                },
              },
              {
                type: 'section',
                fields: [
                  { type: 'mrkdwn', text: `*Affected User:*\n\`${triage.affected_user}\`` },
                  { type: 'mrkdwn', text: `*Project:*\n${project.name}` },
                ],
              },
              {
                type: 'section',
                text: { type: 'mrkdwn', text: `*Summary:*\n${triage.summary}` },
              },
              {
                type: 'section',
                text: { type: 'mrkdwn', text: `*Root Cause:*\n${triage.root_cause}` },
              },
              {
                type: 'section',
                text: { type: 'mrkdwn', text: `*Suggested Fix:*\n${triage.suggested_fix}` },
              },
            ],
          },
        ],
      };

      await fetch(slackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage),
      }).catch((err) => console.error('Slack Send Error:', err));
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