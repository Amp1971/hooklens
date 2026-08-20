'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { blogPosts } from '@/lib/blog-data';

export default function BlogIndexPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<'all' | 'error-library' | 'deep-dive'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('All');

  // Udtræk unikke tags på tværs af alle posts til hurtig filtrering
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    blogPosts.forEach((post) => {
      post.tags?.forEach((tag) => tagsSet.add(tag));
    });
    return ['All', ...Array.from(tagsSet)];
  }, []);

  // Filtreringslogik
  const filteredPosts = useMemo(() => {
    return blogPosts.filter((post: any) => {
      // 1. Filtrer på Spor (Error Library vs Deep Dive)
      // Hvis post.track ikke er sat eksplicit endnu, kategoriseres den ud fra tags eller sættes som default
      const postTrack = post.track || (post.tags?.some((t: string) => t.toLowerCase().includes('error') || t.toLowerCase().includes('debug') || t.toLowerCase().includes('stripe')) ? 'error-library' : 'deep-dive');
      
      if (selectedTrack !== 'all' && postTrack !== selectedTrack) {
        return false;
      }

      // 2. Filtrer på Tag / Platform
      if (selectedTag !== 'All' && !post.tags?.includes(selectedTag)) {
        return false;
      }

      // 3. Søgefrase (Titel, Excerpt, Tags)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchTitle = post.title?.toLowerCase().includes(query);
        const matchExcerpt = post.excerpt?.toLowerCase().includes(query);
        const matchTags = post.tags?.some((t: string) => t.toLowerCase().includes(query));

        return matchTitle || matchExcerpt || matchTags;
      }

      return true;
    });
  }, [searchQuery, selectedTrack, selectedTag]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tighter hover:opacity-80 transition">
            Hook<span className="text-blue-500">Lens</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/blog" className="text-sm font-medium text-blue-400">Blog</Link>
            <Link href="/changelog" className="text-sm font-medium text-slate-400 hover:text-white transition">Changelog</Link>
            <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition">Login</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <header className="mb-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span>Engineering & Incident Knowledge Base</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            Engineering & <span className="text-blue-500">Webhooks</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            In-depth fix guides, incident triage playbooks, and architectural patterns for Stripe, PayPal, and distributed webhook pipelines.
          </p>
        </header>

        {/* Search and Category Scaffolding */}
        <div className="space-y-4 mb-10">
          {/* Live Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search guides by error, keyword, or platform (e.g. timeout, 400, Stripe)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3.5 pl-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-inner"
            />
            <svg
              className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Two Tracks (Tabs) & Platform Tags */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            {/* Tracks */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setSelectedTrack('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  selectedTrack === 'all'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Posts
              </button>
              <button
                onClick={() => setSelectedTrack('error-library')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  selectedTrack === 'error-library'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚡ Error Library
              </button>
              <button
                onClick={() => setSelectedTrack('deep-dive')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  selectedTrack === 'deep-dive'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📖 Deep Dives
              </button>
            </div>

            {/* Tag / Platform Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {allTags.slice(0, 6).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition whitespace-nowrap ${
                    selectedTag === tag
                      ? 'border-blue-500/50 bg-blue-500/20 text-blue-300 font-semibold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Counter and Reset */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-6">
          <span>Showing {filteredPosts.length} article{filteredPosts.length === 1 ? '' : 's'}</span>
          {(searchQuery || selectedTrack !== 'all' || selectedTag !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTrack('all');
                setSelectedTag('All');
              }}
              className="text-blue-400 hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Articles List */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80">
            <p className="text-slate-400 text-sm">No guides or articles found matching your criteria.</p>
            <p className="text-xs text-slate-500 mt-1">Try another search keyword or reset your filters.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPosts.map((post: any) => (
              <article
                key={post.slug}
                className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 hover:border-slate-700 transition space-y-4 shadow-xl"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">{post.date}</span>
                  <span className="text-slate-700">•</span>
                  <span className="text-xs text-slate-400">{post.readTime}</span>
                  <div className="flex gap-2 ml-auto">
                    {post.tags?.slice(0, 3).map((t: string) => (
                      <span
                        key={t}
                        className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <Link href={`/blog/${post.slug}`} className="block group">
                  <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-blue-400 transition tracking-tight">
                    {post.title}
                  </h2>
                </Link>

                <p className="text-slate-400 text-sm leading-relaxed">
                  {post.excerpt}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/50">
                  <span className="text-xs text-slate-500">By {post.author?.name || 'HookLens Engineering'}</span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
                  >
                    Read full article &rarr;
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="py-16 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>© 2026 UseHookLens. Built for developers by developers.</p>
      </footer>
    </div>
  );
}