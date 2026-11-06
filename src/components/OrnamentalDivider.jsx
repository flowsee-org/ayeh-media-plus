export default function OrnamentalDivider({ className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} dir="ltr">
      <div className="h-px w-16 sm:w-24 bg-gradient-to-l from-accent/40 to-transparent" />
      <svg width="32" height="32" viewBox="0 0 32 32" className="text-accent/50 shrink-0" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M16 2 L20 6 L28 6 L24 10 L30 16 L24 22 L28 26 L20 26 L16 30 L12 26 L4 26 L8 22 L2 16 L8 10 L4 6 L12 6 Z" />
          <circle cx="16" cy="16" r="4" />
        </g>
      </svg>
      <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-accent/40 to-transparent" />
    </div>
  );
}