import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '@/app/lib/supabase';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function sendToSlack(analysis: any) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

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

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function POST(request: Request) {
  try {
    const rawPayload = await request.json();

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
            rootCause: { type: Type.STRING, description: 'Why it happened (e.g. invalid tax code, expired token, schema mismatch)' },
            suggestedFix: { type: Type.STRING, description: 'Concrete step-by-step action for the developer to fix it' }
          },
          required: ['service', 'severity', 'affectedUser', 'summary', 'rootCause', 'suggestedFix']
        }
      }
    });

    const parsedAnalysis = JSON.parse(response.text || '{}');

    // 1. Gem i Supabase
    const { error: dbError } = await supabase.from('webhook_events').insert({
      service: parsedAnalysis.service,
      severity: parsedAnalysis.severity,
      affected_user: parsedAnalysis.affectedUser,
      summary: parsedAnalysis.summary,
      root_cause: parsedAnalysis.rootCause,
      suggested_fix: parsedAnalysis.suggestedFix,
      raw_payload: rawPayload
    });

    if (dbError) {
      console.error('Supabase Insert Error:', dbError);
    }

    // 2. Send til Slack
    await sendToSlack(parsedAnalysis);

    return NextResponse.json({
      success: true,
      data: parsedAnalysis
    });

  } catch (error: any) {
    console.error('Triage Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}