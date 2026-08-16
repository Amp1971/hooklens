import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { status } = await request.json();

    if (!['open', 'resolved'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Use "open" or "resolved".' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('webhook_events')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Update Status Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update status' },
      { status: 500 }
    );
  }
}
