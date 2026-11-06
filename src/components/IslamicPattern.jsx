import { useId } from "react";

export default function IslamicPattern({ className = "", opacity = 0.04 }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    >
      <defs>
        <pattern id={`islamic-star-${uid}`} x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#c5a059" strokeWidth="0.6" opacity={opacity}>
            <path d="M40 5 L48 13 L58 13 L50 21 L58 29 L50 37 L58 45 L50 53 L58 61 L48 61 L40 69 L32 61 L22 61 L30 53 L22 45 L30 37 L22 29 L30 21 L22 13 L32 13 Z" />
            <circle cx="40" cy="40" r="8" />
            <path d="M0 40 L5 35 M80 40 L75 35 M0 40 L5 45 M80 40 L75 45" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#islamic-star-${uid})`} />
    </svg>
  );
}