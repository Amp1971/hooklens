import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'allan@usehooklens.com';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, serviceKey);
}

export async function GET(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
    if (authErr) throw authErr;

    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('*');

    const { data: endpoints } = await supabaseAdmin
      .from('endpoints')
      .select('id, user_id, name, created_at');

    const { data: incidents } = await supabaseAdmin
      .from('incidents')
      .select('id, provider, event_type, severity, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    const usersSummary = (authData.users || []).map((u) => {
      const prof = profiles?.find((p) => p.id === u.id || p.email === u.email);
      const userEndpoints = endpoints?.filter((e) => e.user_id === u.id) || [];
      return {
        id: u.id,
        email: u.email,
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at,
        plan: prof?.plan_tier || 'trial',
        status: prof?.subscription_status || 'inactive',
        stripeCustomerId: prof?.stripe_customer_id || null,
        endpointsCount: userEndpoints.length,
      };
    });

    return NextResponse.json({
      adminEmail: ADMIN_EMAIL,
      totalUsers: usersSummary.length,
      activeSubscriptions: usersSummary.filter(u => u.status === 'active').length,
      users: usersSummary,
      recentIncidents: incidents || [],
    });
  } catch (err: any) {
    console.error('Admin API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
