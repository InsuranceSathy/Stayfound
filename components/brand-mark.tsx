/**
 * The mark is a citation bracket with your name inside it.
 *
 * The product's whole promise is being the brand an assistant cites, and a
 * bracketed reference is the printed form of exactly that. It replaced a map
 * pin, which read as "location" and was carried on the gradient tile every AI
 * product wears.
 *
 * Drawn on a 100 grid with no gradient and no tile, so it sits in a line of
 * type. The stroke thickens at small sizes — at 16px a hairline bracket fills
 * in and the mark turns to mush.
 */
export function BrandMark({ size = 28 }: { size?: number }) {
  const stroke = size <= 20 ? 11 : size <= 32 ? 9 : 8;
  return (
    <svg
      className="mark"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M38 22H24v56h14"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="square"
      />
      <path
        d="M62 22h14v56H62"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="square"
      />
      <circle cx="50" cy="50" r={size <= 20 ? 12 : 9} fill="var(--sf-signal, #f2c744)" />
    </svg>
  );
}
