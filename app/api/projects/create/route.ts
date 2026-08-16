import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { name, slackWebhookUrl, discordWebhookUrl, userId } = await req.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const apiKey = `hl_${crypto.randomBytes(12).toString('hex')}`;

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name: name.trim(),
        api_key: apiKey,
        slack_webhook_url: slackWebhookUrl?.trim() || null,
        discord_webhook_url: discordWebhookUrl?.trim() || null,
        user_id: userId || null
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, project });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
