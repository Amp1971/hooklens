import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

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

    // 1. Verificer projektet ud fra API-nøglen via Admin Client
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

    // 2. Kør AI Triage med Gemini
    let triage = {
      service: 'Stripe',
      severity: 'HIGH',
      affected_user: 'N/A',
      summary: 'Webhook event received',
      root_cause: 'Payload captured for analysis',
      suggested_fix: 'Check webhook details in payload',
    };

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `
You are an expert webhook failure monitoring assistant (HookLens AI).
Analyze the following webhook payload, detect the platform/source (e.g. Stripe, Shopify, GitHub, Supabase),
severity level, affected customer/user, root cause, and an actionable suggested fix.

Return ONLY valid JSON matching this schema:
{
  "service": "Service name",
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "affected_user": "User email or ID or 'N/A'",
  "summary": "One sentence summary in English",
  "root_cause": "Exact technical root cause in English",
  "suggested_fix": "Actionable developer fix in English"
}

Payload:
${JSON.stringify(payload, null, 2)}
`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const triageText = aiResponse.text;
        if (triageText) {
          triage = JSON.parse(triageText);
        }
      } catch (aiErr) {
        console.error('AI Triage error fallback:', aiErr);
      }
    }

    // 3. Gem hændelsen i Supabase via Admin Client
    const { data: savedEvent, error: dbError } = await supabaseAdmin
      .from('webhook_events')
      .insert({
        project_id: project.id,
        service: triage.service || 'Stripe',
        severity: triage.severity || 'HIGH',
        affected_user: triage.affected_user || 'N/A',
        summary: triage.summary || 'Webhook received',
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