import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/app/lib/supabase';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ apiKey: string }> | { apiKey: string } }
) {
  try {
    const resolvedParams = await params;
    const apiKey = resolvedParams.apiKey;

    // 1. Verificer projektet ud fra API-nøglen
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('api_key', apiKey)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing HookLens API key.' },
        { status: 401 }
      );
    }

    const payload = await request.json();

    // 2. Kør AI Triage med Gemini
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
    if (!triageText) {
      throw new Error('Gemini returned an empty response');
    }

    const triage = JSON.parse(triageText);

    // 3. Gem hændelsen i Supabase
    const { data: savedEvent, error: dbError } = await supabase
      .from('webhook_events')
      .insert({
        project_id: project.id,
        service: triage.service || 'Unknown',
        severity: triage.severity || 'MEDIUM',
        affected_user: triage.affected_user || 'N/A',
        summary: triage.summary || '',
        root_cause: triage.root_cause || '',
        suggested_fix: triage.suggested_fix || '',
        raw_payload: payload
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database Error:', dbError);
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
                  emoji: true
                }
              },
              {
                type: 'section',
                fields: [
                  { type: 'mrkdwn', text: `*Affected User:*\n\`${triage.affected_user}\`` },
                  { type: 'mrkdwn', text: `*Project:*\n${project.name}` }
                ]
              },
              {
                type: 'section',
                text: { type: 'mrkdwn', text: `*Summary:*\n${triage.summary}` }
              },
              {
                type: 'section',
                text: { type: 'mrkdwn', text: `*Root Cause:*\n${triage.root_cause}` }
              },
              {
                type: 'section',
                text: { type: 'mrkdwn', text: `*Suggested Fix:*\n${triage.suggested_fix}` }
              }
            ]
          }
        ]
      };

      await fetch(slackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage)
      }).catch(err => console.error('Slack Send Error:', err));
    }

    // 5. Send Discord Notifikation
    const discordUrl = project.discord_webhook_url;
    if (discordUrl) {
      const discordColor = triage.severity === 'CRITICAL' ? 14688858 : triage.severity === 'HIGH' ? 15512110 : 3061373;
      const discordMessage = {
        embeds: [
          {
            title: `🚨 [${triage.severity}] ${triage.service} Incident: ${project.name}`,
            color: discordColor,
            fields: [
              { name: '👤 Affected User', value: `\`${triage.affected_user}\``, inline: true },
              { name: '📁 Project', value: project.name, inline: true },
              { name: '📋 Summary', value: triage.summary },
              { name: '🔍 Root Cause', value: triage.root_cause },
              { name: '💡 Suggested Fix', value: triage.suggested_fix }
            ],
            footer: {
              text: 'HookLens AI Triage Engine'
            },
            timestamp: new Date().toISOString()
          }
        ]
      };

      await fetch(discordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordMessage)
      }).catch(err => console.error('Discord Send Error:', err));
    }

    return NextResponse.json({
      success: true,
      data: savedEvent || triage
    });

  } catch (error: any) {
    console.error('Ingest Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
