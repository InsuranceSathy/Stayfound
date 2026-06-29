export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      className="mark"
      width={size}
      height={size}
      viewBox="0 0 28 28"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="26" height="26" rx="8" fill="#17150F" />
      <line
        x1="6"
        y1="18"
        x2="22"
        y2="18"
        stroke="#6F685C"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="14" cy="11.5" r="4.4" fill="#FB4D17" />
      <path
        d="M14 6.4 L14 9.2 M11.6 8 L14 6 L16.4 8"
        stroke="#FB4D17"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
