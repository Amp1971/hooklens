import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            H
          </div>
          <span className="text-xl font-bold tracking-tight text-white">HookLens</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/#pricing" className="text-sm font-medium text-slate-400 hover:text-white transition">Pricing</Link>
          <Link href="/blog" className="text-sm font-medium text-white transition">Blog</Link>
          <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition">Log in</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        <header className="space-y-3">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Engineering Blog & Guides</h1>
          <p className="text-slate-400 text-sm">Technical guides on debugging webhooks, APIs, and billing integrations.</p>
        </header>

        <div className="space-y-6">
          {posts.map((post) => (
            <article key={post.slug} className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="text-blue-400 font-medium">{post.category}</span>
                <span>•</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="text-xl font-bold text-white hover:text-blue-400 transition">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="text-sm text-slate-400">{post.description}</p>
              <div>
                <Link href={`/blog/${post.slug}`} className="text-xs font-semibold text-blue-400 hover:underline">
                  Read article &rarr;
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
