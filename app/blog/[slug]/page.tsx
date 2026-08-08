import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toc } from "@/components/blog/toc";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { PostCard } from "@/components/blog/post-card";
import {
  POSTS,
  getPost,
  lastTouched,
  formatPostDate,
  neighbors,
  related,
  tagSlug,
} from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

// Prerender every post at build time. Without this the pages render on demand
// and the first crawler to arrive — which is the entire audience for this
// content — pays the latency.
export async function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Not found — StayFound" };

  const url = `${SITE_URL}/blog/${post.slug}`;

  return {
    title: post.seoTitle,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.seoTitle,
      description: post.description,
      publishedTime: post.publishedAt,
      modifiedTime: lastTouched(post),
      tags: [...post.tags],
    },
  };
}

export default async function BlogPostPage({
  params,
}: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const { Body } = post;
  const url = `${SITE_URL}/blog/${post.slug}`;
  const { newer, older } = neighbors(post.slug);
  const more = related(post.slug);
  const updated = lastTouched(post);

  // The product hands customers this exact schema block as a recommended fix
  // (see lib/snippets.ts). Publishing without it would be advice we don't take.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: updated,
    keywords: post.tags.join(", "),
    author: { "@type": "Organization", name: "StayFound", url: SITE_URL },
    publisher: { "@type": "Organization", name: "StayFound", url: SITE_URL },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  return (
    <>
      <SiteHeader />
      <ReadingProgress />
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <section className="page-hero">
          <div className="wrap">
            <p className="post-meta post-meta-hero">
              <Link href="/blog">Blog</Link>
              <span className="dot-sep" aria-hidden="true">
                ·
              </span>
              <time dateTime={post.publishedAt}>
                {formatPostDate(post.publishedAt)}
              </time>
              <span className="dot-sep" aria-hidden="true">
                ·
              </span>
              {post.readingMinutes} min read
            </p>
            <h1 className="page-title post-title">{post.title}</h1>
            <p className="page-lead">{post.description}</p>
            <div className="tag-row post-tags">
              {post.tags.map((t) => (
                <Link
                  key={t}
                  href={`/blog/tag/${tagSlug(t)}`}
                  className="tag-chip"
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div className="wrap post-layout">
          <article className="post-body">
            <div className="prose">
              <Body />
            </div>
            {post.updatedAt && (
              <p className="post-updated">
                Last updated{" "}
                <time dateTime={post.updatedAt}>
                  {formatPostDate(post.updatedAt)}
                </time>
                .
              </p>
            )}
          </article>

          {/* Sticky on desktop, display:none under 1100px — see globals.css. */}
          <div className="post-aside">
            <Toc />
          </div>
        </div>

        {(newer || older) && (
          <nav className="wrap post-nav" aria-label="More posts">
            {older ? (
              <Link href={`/blog/${older.slug}`} className="post-nav-link">
                <span className="post-nav-dir">← Older</span>
                <span className="post-nav-t">{older.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {newer ? (
              <Link href={`/blog/${newer.slug}`} className="post-nav-link ta-r">
                <span className="post-nav-dir">Newer →</span>
                <span className="post-nav-t">{newer.title}</span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}

        {more.length > 0 && (
          <section className="wrap related">
            <h2 className="sec-title">Keep reading</h2>
            <div className="blog-grid">
              {more.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          </section>
        )}

        <section className="wrap">
          <div className="status-card">
            <p className="status-text">
              Want to know how AI answers your buyers’ questions?{" "}
              <strong>We’ll run the report and email it to you.</strong>
            </p>
            <div className="cta-row">
              <Link href="/#report" className="btn btn-primary">
                Get my free report <span className="arr">→</span>
              </Link>
              <Link href="/demo" className="btn btn-ghost">
                Talk to a founder
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
