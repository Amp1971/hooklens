'use client';

import Link from 'next/link';
import { blogPosts } from '@/lib/blog-data';

export default function BlogIndexPage() {
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

      <main className="max-w-4xl mx-auto px-6 py-20">
        <header className="mb-16 text-center max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            Engineering & <span className="text-blue-500">Webhooks</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            In-depth guides, architectural patterns, and debugging strategies for Stripe, Shopify, and modern distributed APIs.
          </p>
        </header>

        <div className="space-y-8">
          {blogPosts.map((post) => (
            <article 
              key={post.slug}
              className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 hover:border-slate-700 transition space-y-4 shadow-xl"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">{post.date}</span>
                <span className="text-slate-700">•</span>
                <span className="text-xs text-slate-400">{post.readTime}</span>
                <div className="flex gap-2 ml-auto">
                  {post.tags.slice(0, 2).map((t) => (
                    <span key={t} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <Link href={`/blog/${post.slug}`} className="block group">
                <h2 className="text-2xl font-bold text-white group-hover:text-blue-400 transition tracking-tight">
                  {post.title}
                </h2>
              </Link>

              <p className="text-slate-400 text-sm leading-relaxed">
                {post.excerpt}
              </p>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">By {post.author.name}</span>
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
      </main>

      <footer className="py-16 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>© 2026 UseHookLens. Built for developers by developers.</p>
      </footer>
    </div>
  );
}
