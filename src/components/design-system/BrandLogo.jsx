'use client';

import Link from 'next/link';

/**
 * Ayeh Media Plus Brand Logo
 * Consistent brand mark used across header, sidebar, and footer.
 * Supports inline (icon + text) and icon-only variants.
 */
export default function BrandLogo({ variant = 'inline', className = '' }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2 cursor-pointer group ${className}`}
      aria-label="صفحه اصلی آیه مدیا پلاس"
    >
      <div
        className={`h-10 w-10 rounded-2xl bg-gradient-to-br from-quranic-emerald to-quranic-turquoise flex items-center justify-center text-white shadow-quranic-glow group-hover:shadow-[0_0_25px_-4px_hsl(var(--quranic-emerald)_/0.6)] transition-all duration-300 ${variant === 'icon-only' ? 'h-12 w-12' : ''}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={28}
          height={28}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-6 w-6 ${variant === 'icon-only' ? 'h-8 w-8' : ''}`}
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      </div>
      {variant === 'inline' && (
        <div className="hidden sm:block">
          <span className="font-rokh-bold font-bold text-base text-foreground leading-none block">
            آیه
          </span>
          <span className="font-rokh-bold font-bold text-base text-quranic-saffron leading-none block">
            پلاس
          </span>
        </div>
      )}
    </Link>
  );
}
