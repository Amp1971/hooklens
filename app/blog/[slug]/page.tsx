import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug } from '@/lib/blog';

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            H
          </div>
          <span className="text-xl font-bold tracking-tight text-white">HookLens</span>
        </Link>
        <Link href="/blog" className="text-sm text-slate-400 hover:text-white">&larr; Back to blog</Link>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-16 space-y-6">
        <span className="text-xs font-semibold text-blue-400">{post.category}</span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white">{post.title}</h1>
        <p className="text-slate-400 text-sm border-l-2 border-blue-500 pl-4 italic">{post.description}</p>
        <div className="text-slate-300 whitespace-pre-line leading-relaxed text-sm pt-4">
          {post.content}
        </div>
      </article>
    </div>
  );
}
