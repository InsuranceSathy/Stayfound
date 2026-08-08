import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PostCard } from "@/components/blog/post-card";
import { allPosts, allTags } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — StayFound",
  description:
    "Notes on winning AI search: how answer engines pick who they recommend, what the tooling actually measures, and what to do about it.",
};

export default function BlogIndexPage() {
  const posts = allPosts();
  const tags = allTags();
  const [featured, ...rest] = posts;

  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <h1 className="page-title">Notes from the answer era.</h1>
            <p className="page-lead">
              How AI engines decide who gets recommended — and what that means
              for the brands trying to be on the list.
            </p>
          </div>
        </section>

        <section className="wrap blog-list">
          {tags.length > 1 && (
            <nav className="tag-row tag-filter" aria-label="Browse by topic">
              <span className="tag-chip on">All</span>
              {tags.map((t) => (
                <Link key={t.slug} href={`/blog/tag/${t.slug}`} className="tag-chip">
                  {t.label} <span className="tag-n">{t.count}</span>
                </Link>
              ))}
            </nav>
          )}

          {featured && <PostCard post={featured} featured />}

          {rest.length > 0 && (
            <div className="blog-grid">
              {rest.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
