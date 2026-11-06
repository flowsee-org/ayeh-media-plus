import { useId } from "react";

/**
 * IslamicArch — a decorative onion-dome / pointed-arch frame.
 * Uses an SVG mask to create the arch shape, with a thin gold border.
 *
 * Usage: <IslamicArch className="...">content</IslamicArch>
 */
export default function IslamicArch({ children, className = "", borderClassName = "text-accent/30", _height = 60 }) {
  const uid = useId().replace(/:/g, "");
  const maskId = `arch-mask-${uid}`;

  return (
    <div className={`relative ${className}`}>
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <clipPath id={maskId} clipPathUnits="objectBoundingBox">
            <path d="M0,1 L0,0.3 Q0,0.05 0.5,0.05 Q1,0.05 1,0.3 L1,1 Z" />
          </clipPath>
        </defs>
      </svg>
      <div
        style={{ clipPath: `url(#${maskId})`, WebkitClipPath: `url(#${maskId})` }}
        className="relative"
      >
        {children}
      </div>
      {/* Arch border overlay */}
      <svg
        className={`absolute inset-0 w-full h-full pointer-events-none ${borderClassName}`}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        aria-hidden="true"
      >
        <path d="M0.5,99.5 L0.5,30 Q0.5,1 50,1 Q99.5,1 99.5,30 L99.5,99.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}