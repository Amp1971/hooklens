import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { name, slackWebhookUrl, discordWebhookUrl } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Project name is required.' },
        { status: 400 }
      );
    }

    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const apiKey = `hk_live_${randomSuffix}`;

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name: name.trim(),
        api_key: apiKey,
        slack_webhook_url: slackWebhookUrl?.trim() || null,
        discord_webhook_url: discordWebhookUrl?.trim() || null
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      project
    });

  } catch (error: any) {
    console.error('Create Project Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create project.' },
      { status: 500 }
    );
  }
}
