import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { name, slackWebhookUrl } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Projektnavn er påkrævet.' },
        { status: 400 }
      );
    }

    // Generer en unik API-nøgle, f.eks: hk_live_a1b2c3d4e5f6
    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const apiKey = `hk_live_${randomSuffix}`;

    // Gem projektet i Supabase
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name: name.trim(),
        api_key: apiKey,
        slack_webhook_url: slackWebhookUrl?.trim() || null
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
      { success: false, error: error.message || 'Kunne ikke oprette projekt.' },
      { status: 500 }
    );
  }
}
