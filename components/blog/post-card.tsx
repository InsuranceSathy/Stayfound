import Link from "next/link";
import { formatPostDate, tagSlug, type Post } from "@/lib/blog";

/** Shared by the index, the tag pages and the related-posts footer. */
export function PostCard({
  post,
  featured = false,
}: {
  post: Post;
  featured?: boolean;
}) {
  return (
    <article className={`blog-card ${featured ? "is-featured" : ""}`}>
      <p className="post-meta">
        <time dateTime={post.publishedAt}>
          {formatPostDate(post.publishedAt)}
        </time>
        <span className="dot-sep" aria-hidden="true">
          ·
        </span>
        {post.readingMinutes} min read
      </p>

      <h2>
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h2>

      <p className="blog-excerpt">{featured ? post.excerpt : post.description}</p>

      <div className="blog-card-foot">
        <span className="blog-more">
          Read it <span className="arr">→</span>
        </span>
        {/* Tag links live outside the title link — nesting anchors is invalid
            HTML and the browser silently drops the inner one. */}
        <span className="tag-row">
          {post.tags.map((t) => (
            <Link key={t} href={`/blog/tag/${tagSlug(t)}`} className="tag-chip">
              {t}
            </Link>
          ))}
        </span>
      </div>
    </article>
  );
}
