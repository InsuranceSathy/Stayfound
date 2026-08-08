import { ImageResponse } from "next/og";
import { POSTS, getPost } from "@/lib/blog";

export const alt = "StayFound";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Prerender one card per post at build time so sharing a link never waits on
// image generation.
export async function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

/**
 * The share card.
 *
 * No custom font on purpose: Geist reaches the site through `next/font`, which
 * ImageResponse can't consume, and the alternative — fetching a TTF during the
 * build — turns a network hiccup into a failed deploy. The default face is
 * legible and this file has one job.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);

  const title = post?.title ?? "StayFound";
  const tag = post?.tags[0] ?? "AI search";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#08070d",
          padding: "72px 76px",
        }}
      >
        {/* Accent wash, echoing .page-hero::before on the site itself. */}
        <div
          style={{
            position: "absolute",
            top: -260,
            left: 0,
            width: 1200,
            height: 620,
            background:
              "radial-gradient(closest-side, rgba(124,108,245,0.42), rgba(8,7,13,0))",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "linear-gradient(100deg, #7c6cf5, #a78bfa 45%, #f472b6)",
            }}
          />
          <span style={{ color: "#f7f5fc", fontSize: 30, fontWeight: 700 }}>
            StayFound
          </span>
          <span style={{ color: "#7a7392", fontSize: 26 }}>·</span>
          <span style={{ color: "#b0aac4", fontSize: 25 }}>{tag}</span>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: title.length > 84 ? 55 : 66,
            lineHeight: 1.12,
            letterSpacing: "-0.035em",
            fontWeight: 700,
            color: "#f7f5fc",
            maxWidth: 1000,
          }}
        >
          {title}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 74,
              height: 5,
              borderRadius: 3,
              background: "linear-gradient(100deg, #7c6cf5, #a78bfa 45%, #f472b6)",
            }}
          />
          <span style={{ color: "#9a94b2", fontSize: 25 }}>
            Be the brand AI keeps recommending
          </span>
        </div>
      </div>
    ),
    size,
  );
}
