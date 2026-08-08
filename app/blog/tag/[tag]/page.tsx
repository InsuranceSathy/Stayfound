import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PostCard } from "@/components/blog/post-card";
import { allTags, getTag, postsByTag } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

// Static tag pages rather than a ?tag= filter on /blog: reading searchParams
// would make the index dynamic, and a real URL per topic is something an AI
// engine can cite. That is the whole point of this section of the site.
export async function generateStaticParams() {
  return allTags().map((t) => ({ tag: t.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/tag/[tag]">): Promise<Metadata> {
  const { tag } = await params;
  const found = getTag(tag);
  if (!found) return { title: "Not found — StayFound" };

  return {
    title: `${found.label} — StayFound blog`,
    description: `StayFound posts on ${found.label.toLowerCase()}: how AI answer engines pick who they recommend, and what to do about it.`,
    alternates: { canonical: `${SITE_URL}/blog/tag/${found.slug}` },
  };
}

export default async function TagPage({ params }: PageProps<"/blog/tag/[tag]">) {
  const { tag } = await params;
  const found = getTag(tag);
  if (!found) notFound();

  const posts = postsByTag(found.slug);
  const tags = allTags();

  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <p className="post-meta post-meta-hero">
              <Link href="/blog">Blog</Link>
              <span className="dot-sep" aria-hidden="true">
                ·
              </span>
              {posts.length} post{posts.length === 1 ? "" : "s"}
            </p>
            <h1 className="page-title post-title">{found.label}</h1>
          </div>
        </section>

        <section className="wrap blog-list">
          <nav className="tag-row tag-filter" aria-label="Browse by topic">
            <Link href="/blog" className="tag-chip">
              All
            </Link>
            {tags.map((t) => (
              <Link
                key={t.slug}
                href={`/blog/tag/${t.slug}`}
                className={`tag-chip ${t.slug === found.slug ? "on" : ""}`}
                aria-current={t.slug === found.slug ? "page" : undefined}
              >
                {t.label} <span className="tag-n">{t.count}</span>
              </Link>
            ))}
          </nav>

          <div className="blog-grid">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
