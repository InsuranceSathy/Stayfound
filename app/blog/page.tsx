import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { allPosts, formatPostDate } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — StayFound",
  description:
    "Notes on winning AI search: how answer engines pick who they recommend, what the tooling actually measures, and what to do about it.",
};

export default function BlogIndexPage() {
  const posts = allPosts();

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
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="blog-card"
            >
              <p className="post-meta">
                <time dateTime={post.publishedAt}>
                  {formatPostDate(post.publishedAt)}
                </time>
                <span className="dot-sep" aria-hidden="true">
                  ·
                </span>
                {post.readingMinutes} min read
              </p>
              <h2>{post.title}</h2>
              <p className="blog-excerpt">{post.excerpt}</p>
              <span className="blog-more">
                Read it <span className="arr">→</span>
              </span>
            </Link>
          ))}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
