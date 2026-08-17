"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

const ADMIN_EMAIL = 'allan@usehooklens.com';

export default function AdminPage() {
  const [data, setData] = useState<any>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function checkAuthAndLoad() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const email = authData?.user?.email || null;
        setCurrentUserEmail(email);

        if (email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
          setLoading(false);
          return;
        }

        const res = await fetch('/api/admin/overview');
        if (!res.ok) throw new Error('Kunne ikke hente admin data.');
        const d = await res.json();
        setData(d);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndLoad();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center text-sm font-medium">
        Indlæser kontrolpanel...
      </div>
    );
  }

  if (!currentUserEmail || currentUserEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-xl mb-4">
          🔒
        </div>
        <h1 className="text-xl font-bold text-white">Adgang Nægtet</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-sm">
          Dette dashboard er udelukkende tilgængeligt for administratoren (<span className="text-emerald-400 font-mono">{ADMIN_EMAIL}</span>).
        </p>
        <Link href="/dashboard" className="mt-6 text-xs font-semibold text-emerald-400 hover:underline">
          &larr; Gå til Dashboard
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-rose-400 flex items-center justify-center p-4">
        Fejl: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Administrator Hub</span>
            <h1 className="text-2xl font-bold text-white mt-1">HookLens Admin Hub</h1>
            <p className="text-xs text-slate-400 mt-0.5">Logget ind som: <span className="text-slate-200 font-mono">{ADMIN_EMAIL}</span></p>
          </div>
          <Link href="/dashboard" className="text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg">
            &larr; Tilbage til Dashboard
          </Link>
        </div>

        {/* Nøgletal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
            <div className="text-xs text-slate-400 uppercase font-semibold">Brugere I Alt</div>
            <div className="text-3xl font-extrabold text-white mt-2">{data?.totalUsers || 0}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
            <div className="text-xs text-slate-400 uppercase font-semibold">Aktive Kunder / Planer</div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2">{data?.activeSubscriptions || 0}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
            <div className="text-xs text-slate-400 uppercase font-semibold">Seneste Incidents</div>
            <div className="text-3xl font-extrabold text-blue-400 mt-2">{data?.recentIncidents?.length || 0}</div>
          </div>
        </div>

        {/* Brugertabel */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 font-semibold text-sm text-white">
            Brugeroversigt & Seneste Login
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">E-mail</th>
                  <th className="p-3">Plan / Status</th>
                  <th className="p-3">Sidst Logget Ind</th>
                  <th className="p-3">Oprettet</th>
                  <th className="p-3">Endpoints</th>
                  <th className="p-3">Stripe ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data?.users?.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-800/20">
                    <td className="p-3 font-medium text-white">{u.email}</td>
                    <td className="p-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
                        {u.plan} ({u.status})
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 font-mono">
                      {u.lastSignIn ? new Date(u.lastSignIn).toLocaleString('da-DK') : 'Aldrig'}
                    </td>
                    <td className="p-3 text-slate-400 font-mono">
                      {new Date(u.createdAt).toLocaleDateString('da-DK')}
                    </td>
                    <td className="p-3 font-semibold text-white">{u.endpointsCount}</td>
                    <td className="p-3 text-slate-400 font-mono">{u.stripeCustomerId || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
