'use client';

import { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogPosts } from '@/lib/blog-data';

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const post = blogPosts.find((p) => p.slug === resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const paragraphs = post.content.split('\n\n');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
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

      <article className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-8">
          <Link href="/blog" className="text-xs text-slate-500 hover:text-slate-300 transition">
            &larr; Back to all articles
          </Link>
        </div>

        <header className="space-y-6 pb-12 border-b border-slate-900">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">{post.date}</span>
            <span className="text-slate-700">•</span>
            <span className="text-xs text-slate-400">{post.readTime}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-semibold text-white">{post.author.name}</p>
              <p className="text-xs text-slate-500">{post.author.role}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </header>

        <div className="py-12 space-y-6 text-slate-300 leading-relaxed text-base">
          {paragraphs.map((p, idx) => {
            const text = p.trim();
            if (text.startsWith('### ')) {
              return <h3 key={idx} className="text-2xl font-bold text-white pt-8 tracking-tight">{text.replace('### ', '')}</h3>;
            }
            if (text.startsWith('#### ')) {
              return <h4 key={idx} className="text-lg font-bold text-white pt-4 tracking-tight">{text.replace('#### ', '')}</h4>;
            }
            if (text.startsWith('---')) {
              return <hr key={idx} className="border-slate-900 my-8" />;
            }
            if (text.startsWith('> ')) {
              return (
                <blockquote key={idx} className="border-l-2 border-blue-500 pl-4 py-2 my-4 bg-blue-500/5 text-slate-200 text-sm italic rounded-r-lg">
                  {text.replace('> ', '')}
                </blockquote>
              );
            }
            if (text.startsWith('```')) {
              const codeBlock = text.replace(/```[a-z]*\n?/g, '');
              return (
                <pre key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-blue-300 overflow-x-auto my-4 shadow-inner">
                  <code>{codeBlock}</code>
                </pre>
              );
            }
            return <p key={idx} className="leading-relaxed">{text}</p>;
          })}
        </div>

        <div className="mt-12 p-8 rounded-3xl bg-blue-950/30 border border-blue-500/30 text-center space-y-4 shadow-2xl">
          <h3 className="text-xl font-bold text-white tracking-tight">
            Diagnose Failed Webhooks in Real Time
          </h3>
          <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
            Stop digging through raw server logs. Connect your Stripe & Shopify webhooks to HookLens and receive immediate AI root-cause analysis and code fixes.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-blue-500/20"
            >
              Start Free Trial &rarr;
            </Link>
          </div>
        </div>
      </article>

      <footer className="py-16 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>© 2026 UseHookLens. All rights reserved.</p>
      </footer>
    </div>
  );
}
