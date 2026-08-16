import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '@/app/lib/supabase';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function sendToSlack(analysis: any, slackWebhookUrl: string) {
  if (!slackWebhookUrl) return;

  const severityColor = analysis.severity === 'CRITICAL' || analysis.severity === 'HIGH' ? '#E01E5A' : '#ECB22E';

  const payload = {
    attachments: [
      {
        color: severityColor,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `🚨 [${analysis.severity}] ${analysis.service} Webhook Failure`,
              emoji: true
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Affected User / Entity:*\n\`${analysis.affectedUser}\``
              },
              {
                type: 'mrkdwn',
                text: `*Service:*\n${analysis.service}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Summary:*\n${analysis.summary}`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Root Cause:*\n${analysis.rootCause}`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `💡 *Suggested Fix:*\n${analysis.suggestedFix}`
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'View in HookLens Dashboard',
                  emoji: true
                },
                url: 'https://usehooklens.com',
                style: 'primary'
              }
            ]
          }
        ]
      }
    ]
  };

  try {
    await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('Failed to send Slack alert:', err);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ apiKey: string }> }
) {
  try {
    const { apiKey } = await params;

    // 1. Slå projektet op i Supabase baseret på API-nøglen
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('api_key', apiKey)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Ugyldig API-nøgle. Opret et projekt i HookLens.' },
        { status: 401 }
      );
    }

    const rawPayload = await request.json();

    // 2. Kør Gemini Triage
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `You are an expert site reliability and webhook triage engineer. 
Analyze this failed webhook or error payload and return structured actionable advice for the development team.

Payload:
${JSON.stringify(rawPayload, null, 2)}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            service: { type: Type.STRING, description: 'Source system, e.g., Stripe, Shopify, GitHub, Unknown' },
            severity: { type: Type.STRING, description: 'CRITICAL, HIGH, MEDIUM, or LOW' },
            affectedUser: { type: Type.STRING, description: 'User ID, Email, or Customer Reference if found, otherwise N/A' },
            summary: { type: Type.STRING, description: 'Clear 1-sentence explanation of what failed' },
            rootCause: { type: Type.STRING, description: 'Why it happened' },
            suggestedFix: { type: Type.STRING, description: 'Concrete step-by-step action for developer' }
          },
          required: ['service', 'severity', 'affectedUser', 'summary', 'rootCause', 'suggestedFix']
        }
      }
    });

    const parsedAnalysis = JSON.parse(response.text || '{}');

    // 3. Gem hændelsen knyttet til det specifikke projekt
    await supabase.from('webhook_events').insert({
      project_id: project.id,
      service: parsedAnalysis.service,
      severity: parsedAnalysis.severity,
      affected_user: parsedAnalysis.affectedUser,
      summary: parsedAnalysis.summary,
      root_cause: parsedAnalysis.rootCause,
      suggested_fix: parsedAnalysis.suggestedFix,
      raw_payload: rawPayload
    });

    // 4. Send Slack-alarm
    const targetSlackUrl = project.slack_webhook_url || process.env.SLACK_WEBHOOK_URL;
    if (targetSlackUrl) {
      await sendToSlack(parsedAnalysis, targetSlackUrl);
    }

    return NextResponse.json({
      success: true,
      data: parsedAnalysis
    });

  } catch (error: any) {
    console.error('Ingest Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
