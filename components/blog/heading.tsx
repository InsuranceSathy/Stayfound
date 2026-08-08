/**
 * Headings that can be linked to.
 *
 * `children` is typed as `string` rather than ReactNode on purpose: the id is
 * derived from the text, and a JSX child would slugify to "[object Object]"
 * silently — a broken anchor that still renders fine. Keeping the type narrow
 * turns that into a compile error instead.
 *
 * The TOC reads these ids out of the DOM (see components/blog/toc.tsx), so
 * every h2 in a post body must come through here or it won't appear in the
 * contents list.
 */

export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’'"“”]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function H2({ children }: { children: string }) {
  const id = headingId(children);
  return (
    <h2 id={id}>
      {children}
      <a className="anchor" href={`#${id}`} aria-label={`Link to “${children}”`}>
        #
      </a>
    </h2>
  );
}

export function H3({ children }: { children: string }) {
  return <h3 id={headingId(children)}>{children}</h3>;
}
