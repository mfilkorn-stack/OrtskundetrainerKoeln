interface LogoProps {
  size?: number;
  className?: string;
  variant?: "light" | "dark";
}

export function Logo({ size = 32, className, variant = "light" }: LogoProps) {
  const shieldFill = variant === "light" ? "#1A2D5A" : "#0F1C3F";
  const shieldStroke = "#C5A23C";
  const accentColor = "#C5A23C";
  const redAccent = "#C8102E";
  const roadColor = variant === "light" ? "#ffffff" : "#E8EAF0";

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      {/* Shield */}
      <path
        d="M32 4 L56 16 V38 C56 48 45 56 32 62 C19 56 8 48 8 38 V16 Z"
        fill={shieldFill}
        stroke={shieldStroke}
        strokeWidth="1.5"
      />
      {/* Left spire */}
      <polygon points="22,12 16,36 28,36" fill={accentColor} />
      <rect x="21" y="8" width="2" height="5" fill={accentColor} />
      <rect x="19.5" y="9.5" width="5" height="2" fill={accentColor} />
      {/* Right spire */}
      <polygon points="42,16 36,36 48,36" fill={accentColor} />
      <rect x="41" y="12" width="2" height="5" fill={accentColor} />
      <rect x="39.5" y="13.5" width="5" height="2" fill={accentColor} />
      {/* Cathedral body */}
      <rect x="16" y="36" width="32" height="6" fill={accentColor} />
      {/* Rosette */}
      <circle cx="32" cy="30" r="2.5" fill={redAccent} />
      {/* Road */}
      <polygon points="24,56 40,56 36,42 28,42" fill={roadColor} opacity="0.9" />
      <line
        x1="32" y1="55" x2="32" y2="43"
        stroke={redAccent}
        strokeWidth="1.5"
        strokeDasharray="2.5 2"
      />
    </svg>
  );
}
