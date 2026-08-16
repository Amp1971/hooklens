import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug, getAllPosts } from '@/lib/blog';
import PricingSection from '@/components/PricingSection';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found — HookLens' };

  return {
    title: `${post.title} — HookLens Blog`,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedAt,
      url: `https://usehooklens.com/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            H
          </div>
          <span className="text-xl font-bold tracking-tight text-white">HookLens</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/blog" className="text-sm font-medium text-slate-400 hover:text-white transition">
            &larr; All Articles
          </Link>
          <a
            href="#pricing"
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-lg shadow-blue-500/20"
          >
            Start Free Trial
          </a>
        </div>
      </nav>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-6 pt-16 pb-20 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-blue-400 font-medium">
              {post.category}
            </span>
            <span>•</span>
            <time dateTime={post.publishedAt}>{post.publishedAt}</time>
            <span>•</span>
            <span>{post.readTime}</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
            {post.title}
          </h1>

          <p className="text-base text-slate-400 leading-relaxed italic border-l-2 border-blue-500 pl-4">
            {post.description}
          </p>
        </div>

        {/* Formatted body */}
        <div className="text-slate-300 space-y-6 text-sm md:text-base leading-relaxed whitespace-pre-line">
          {post.content}
        </div>
      </article>

      {/* Full Interactive Pricing & Checkout Section */}
      <PricingSection />

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-10 border-t border-slate-900 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} HookLens. All rights reserved.
      </footer>
    </div>
  );
}
