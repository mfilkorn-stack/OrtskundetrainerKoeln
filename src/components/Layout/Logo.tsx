interface LogoProps {
  size?: number;
  className?: string;
  variant?: "light" | "dark";
}

export function Logo({ size = 32, className, variant = "light" }: LogoProps) {
  const color = variant === "light" ? "#ffffff" : "#C8102E";
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      fill={color}
      stroke={color}
      strokeWidth="0"
    >
      {/* Left spire */}
      <polygon points="20,6 12,40 28,40" />
      {/* Left cross */}
      <rect x="19" y="2" width="2" height="5" />
      <rect x="17.5" y="3.5" width="5" height="2" />

      {/* Right spire */}
      <polygon points="44,10 36,40 52,40" />
      {/* Right cross */}
      <rect x="43" y="6" width="2" height="5" />
      <rect x="41.5" y="7.5" width="5" height="2" />

      {/* Cathedral body */}
      <rect x="12" y="40" width="40" height="8" />

      {/* Rosette window */}
      <circle cx="32" cy="34" r="3" fill={variant === "light" ? "#C8102E" : "#ffffff"} />

      {/* Road converging upward */}
      <polygon points="22,64 42,64 36,48 28,48" />

      {/* Road center line (dashed) */}
      <line
        x1="32" y1="63" x2="32" y2="49"
        stroke={variant === "light" ? "#C8102E" : "#ffffff"}
        strokeWidth="1.5"
        strokeDasharray="2.5 2"
      />
    </svg>
  );
}
