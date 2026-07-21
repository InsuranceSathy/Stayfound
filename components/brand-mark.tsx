export function BrandMark({ size = 28 }: { size?: number }) {
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
      <defs>
        <linearGradient
          id="sfEmber"
          x1="50"
          y1="16"
          x2="50"
          y2="66"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF8A4C" />
          <stop offset="1" stopColor="#FB4D17" />
        </linearGradient>
      </defs>
      {/* app tile */}
      <rect x="3" y="3" width="94" height="94" rx="26" fill="#17150F" />
      {/* surface + depth lines */}
      <path
        d="M24 67 H76"
        stroke="#544D42"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M34 76 H66"
        stroke="#332F29"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* rising signal cresting the surface */}
      <path
        d="M30 60 L50 33 L70 60"
        stroke="url(#sfEmber)"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* beacon */}
      <circle cx="50" cy="21" r="6.5" fill="#FF8A4C" />
    </svg>
  );
}
