'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronLeft } from 'lucide-react';

/**
 * Aparat-style global search — compact bar with suggestions
 */
const SUGGESTIONS = [
  'تلاوت سوره یاسین',
  'تفسیر آیه کرسی',
  'مسابقات قرآنی',
  'قاری عبدالباسط',
  'محفل قرآن',
  'سوره رحمان',
];

export default function GlobalSearch({ className = '' }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchRef = useRef(null);

  const filtered = query.trim()
    ? SUGGESTIONS.filter((s) => s.includes(query.trim())).slice(0, 6)
    : SUGGESTIONS.slice(0, 4);

  const goSearch = (q = query) => {
    const value = (q || '').trim();
    if (!value) {
      router.push('/search');
      return;
    }
    router.push(`/search?q=${encodeURIComponent(value)}`);
    setShowSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    goSearch();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showSuggestions) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((i) => (i >= filtered.length - 1 ? 0 : i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((i) => (i <= 0 ? filtered.length - 1 : i - 1));
      } else if (e.key === 'Enter' && focusedIndex >= 0 && filtered[focusedIndex]) {
        e.preventDefault();
        goSearch(filtered[focusedIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setFocusedIndex(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestions, filtered, focusedIndex]);

  return (
    <div className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative w-full">
        <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="جستجوی ویدیو، قاری، مسابقه..."
          className="w-full h-10 pe-10 ps-24 rounded bg-muted/70 border border-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/30 focus:bg-card transition-all"
        />
        <button
          type="submit"
          className="absolute start-1.5 top-1/2 -translate-y-1/2 h-7 px-3 rounded bg-primary text-primary-foreground text-xs font-bold hover:opacity-90"
        >
          جستجو
        </button>
      </form>

      {showSuggestions && (
        <div className="absolute top-full inset-x-0 mt-2 bg-card border border-border rounded shadow-lg overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-border text-[10px] font-bold text-muted-foreground">
            پیشنهادها
          </div>
          <div className="p-1">
            {filtered.map((s, i) => (
              <button
                key={s}
                type="button"
                onMouseDown={() => goSearch(s)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
                  focusedIndex === i ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                }`}
              >
                <span className="truncate">{s}</span>
                <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ))}
            <button
              type="button"
              onMouseDown={() => goSearch()}
              className="w-full flex items-center justify-between px-3 py-2.5 mt-1 border-t border-border text-xs font-bold text-primary hover:bg-primary/5"
            >
              <span>مشاهده همه نتایج</span>
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
