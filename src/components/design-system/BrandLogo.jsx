'use client';

import Link from 'next/link';

/**
 * Ayeh Media Plus brand mark — compact Aparat-style header logo
 */
export default function BrandLogo({ variant = 'inline', className = '' }) {
  const iconOnly = variant === 'icon-only';

  return (
    <Link
      href="/"
      className={`flex items-center gap-2 cursor-pointer group ${className}`}
      aria-label="صفحه اصلی آیه مدیا پلاس"
    >
      <div
        className={`rounded-xl bg-gradient-to-br from-quranic-emerald to-quranic-turquoise flex items-center justify-center text-white shadow-sm group-hover:shadow-quranic-glow transition-shadow ${
          iconOnly ? 'h-10 w-10' : 'h-9 w-9'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={iconOnly ? 'h-5 w-5' : 'h-4.5 w-4.5 h-[18px] w-[18px]'}
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      </div>
      {variant === 'inline' && (
        <div className="hidden sm:flex flex-col leading-none">
          <span className="font-rokh-bold font-bold text-[15px] text-foreground tracking-tight">
            آیه<span className="text-primary">پلاس</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
            رسانه ویدیویی قرآن
          </span>
        </div>
      )}
    </Link>
  );
}
