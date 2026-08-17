import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function GET(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Hent profiler (altid tilgængelig)
    let profiles: any[] = [];
    try {
      const { data, error } = await supabaseAdmin.from('profiles').select('*');
      if (!error && data) profiles = data;
    } catch (e) {
      console.warn('Profiles fetch warning:', e);
    }

    // 2. Forsøg at hente auth brugere
    let authUsers: any[] = [];
    try {
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
      if (!authErr && authData?.users) {
        authUsers = authData.users;
      }
    } catch (e) {
      console.warn('Auth admin fetch warning:', e);
    }

    // 3. Hent endpoints hvis tabellen findes
    let endpoints: any[] = [];
    try {
      const { data } = await supabaseAdmin.from('endpoints').select('*');
      if (data) endpoints = data;
    } catch (e) {}

    // 4. Hent incidents hvis tabellen findes
    let incidents: any[] = [];
    try {
      const { data } = await supabaseAdmin.from('incidents').select('*').order('created_at', { ascending: false }).limit(20);
      if (data) incidents = data;
    } catch (e) {}

    // Flet sammen baseret på enten authUsers eller profiler
    const combinedUsers = authUsers.length > 0
      ? authUsers.map((u) => {
          const prof = profiles.find((p) => p.id === u.id || p.email === u.email);
          const userEndpoints = endpoints.filter((e) => e.user_id === u.id);
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
        })
      : profiles.map((p) => ({
          id: p.id,
          email: p.email || 'Ukendt',
          createdAt: p.created_at || new Date().toISOString(),
          lastSignIn: null,
          plan: p.plan_tier || 'starter',
          status: p.subscription_status || 'active',
          stripeCustomerId: p.stripe_customer_id || null,
          endpointsCount: endpoints.filter((e) => e.user_id === p.id).length,
        }));

    return NextResponse.json({
      totalUsers: combinedUsers.length,
      activeSubscriptions: combinedUsers.filter(u => u.status === 'active').length,
      users: combinedUsers,
      recentIncidents: incidents,
    });
  } catch (err: any) {
    console.error('Admin API error:', err);
    return NextResponse.json({ error: err.message || 'Ukendt serverfejl' }, { status: 500 });
  }
}
