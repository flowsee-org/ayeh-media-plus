'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, BookOpen, Mic, Trophy, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

/**
 * Global Search Component — Aparat-style specialized search
 * Supports category filtering, autocomplete suggestions, and keyboard navigation.
 */
const SEARCH_CATEGORIES = [
  { id: 'all', label: 'همه', icon: Search, color: 'quranic-emerald' },
  { id: 'surah', label: 'سوره', icon: BookOpen, color: 'quranic-turquoise' },
  { id: 'reciters', label: 'قاری', icon: Mic, color: 'quranic-turquoise' },
  { id: 'competitions', label: 'مسابقات', icon: Trophy, color: 'quranic-saffron' },
  { id: 'verses', label: 'آیه', icon: ChevronRight, color: 'quranic-emerald' },
];

const SUGGESTIONS = {
  surah: [
    'سوره بقره', 'سوره یاسین', 'سوره رحمان', 'سوره ملک', 'سوره وقعه',
    'سوره کاف', 'سوره طه', 'سوره مومنون', 'سوره نور', 'سوره احزاب',
  ],
  reciters: [
    'شیخ مشاری راشد عفاسی', 'عبدالباسط عبدالصمد', 'سعود الشریم',
    'ماهر المعیقلی', 'علی جابر', 'احمد العجمی', 'یاسر الدوسری',
    'محمد صدیق المنشاوی', 'محمود خلیل الحصری',
  ],
  competitions: [
    'مسابقات قرآنی ۱۴۰۳', 'مسابقات قرآنی بین‌المللی',
    'مسابقات حفظ قرآن', 'مسابقات تلاوت', 'مسابقات تفسیر',
  ],
  verses: [
    'آیه کرسی', 'آیه نور', 'آیه فطریه', 'آیه توحید', 'آیه حفظ',
    'آیه شفاء', 'آیه رزق', 'آیه صبر', 'آیه توبه', 'آیه دعا',
  ],
};

export default function GlobalSearch({ className = '', maxWidth = 'max-w-[600px]' }) {
  const router = useRouter();
  const { openAuthModal } = useAuth();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}&category=${activeCategory}`);
      setShowSuggestions(false);
    }
  };

  const handleQuickSearch = (q, cat) => {
    setQuery(q);
    setActiveCategory(cat);
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(q)}&category=${cat}`);
  };

  const getSuggestions = () => {
    if (!query.trim()) return [];
    const q = query.trim();
    if (activeCategory === 'all') {
      return [
        ...SUGGESTIONS.surah.slice(0, 3).map((s) => ({ label: s, category: 'surah', type: 'surah' })),
        ...SUGGESTIONS.reciters.slice(0, 3).map((r) => ({ label: r, category: 'reciters', type: 'reciter' })),
        ...SUGGESTIONS.competitions.slice(0, 2).map((c) => ({ label: c, category: 'competitions', type: 'competition' })),
      ];
    }
    const list = SUGGESTIONS[activeCategory] || [];
    return list.slice(0, 6).map((item) => ({ label: item, category: activeCategory, type: activeCategory === 'surah' ? 'surah' : activeCategory === 'reciters' ? 'reciter' : 'item' }));
  };

  const suggestions = getSuggestions();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showSuggestions) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((i) => (i >= suggestions.length - 1 ? 0 : i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (suggestions[focusedIndex]) {
          handleQuickSearch(suggestions[focusedIndex].label, suggestions[focusedIndex].category);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setFocusedIndex(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestions, suggestions, focusedIndex]);

  return (
    <div className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative w-full group">
        {/* Category Tabs (Desktop) */}
        <div className="hidden lg:flex items-center gap-1 mb-2">
          {SEARCH_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-quranic-emerald text-white shadow-quranic-glow'
                    : 'bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <Icon className={`h-3 w-3 ${isActive ? 'text-white' : 'text-muted-foreground/60'}`} />
                <span className="ml-1">{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-quranic-emerald"
          />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(e.target.value.trim().length > 0);
            }}
            onFocus={() => setShowSuggestions(query.trim().length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder={
              activeCategory === 'surah' ? 'جستجوی نام سوره...'
                : activeCategory === 'reciters' ? 'جستجوی نام قاری...'
                : activeCategory === 'competitions' ? 'جستجوی مسابقات قرآنی...'
                : activeCategory === 'verses' ? 'جستجوی شماره آیه...'
                : 'جستجو در قرآن، تلاوت، مسابقات و تفسیر...'
            }
            className={`w-full pl-12 pr-10 py-3 rounded-2xl bg-background border border-input text-sm font-ui text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-quranic-emerald/30 focus:border-quranic-emerald transition-all ${maxWidth}`}
          />
          <button
            type="submit"
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-quranic-emerald transition-colors"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && query.trim().length > 0 && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 w-full bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50 animate-scale-in">
            <div className="px-4 py-2 border-b border-border/50">
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider font-ui">
                نتایج پیشنهادی
              </span>
            </div>
            <div className="p-1">
              {suggestions.map((s, i) => (
                <button
                  key={`${s.label}-${i}`}
                  onClick={() => handleQuickSearch(s.label, s.category)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                    focusedIndex === i
                      ? 'bg-quranic-emerald/10 text-quranic-emerald border border-quranic-emerald/20'
                      : 'text-foreground hover:bg-muted/50'
                  }`}
                >
                  <span className="truncate">{s.label}</span>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] ${s.category === 'surah' ? 'text-quranic-turquoise' : s.category === 'reciters' ? 'text-quranic-turquoise' : 'text-muted-foreground'}`}>
                      {s.type === 'surah' ? 'سوره' : s.type === 'reciter' ? 'قاری' : s.category}
                    </span>
                    <ChevronRight className={`h-3 w-3 ${focusedIndex === i ? 'text-quranic-emerald' : 'text-muted-foreground/40'}`} />
                  </div>
                </button>
              ))}
              <div className="px-3 py-2 border-t border-border/50">
                <button
                  onClick={() => {
                    setShowSuggestions(false);
                    if (query.trim()) {
                      router.push(`/search?q=${encodeURIComponent(query.trim())}&category=${activeCategory}`);
                    }
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-quranic-emerald hover:bg-quranic-emerald/5 transition-colors"
                >
                  <span>نمایش همه نتایج</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Mobile: Compact search button that opens full search page */}
      <button
        onClick={() => {
          if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}&category=${activeCategory}`);
          } else {
            router.push('/search');
          }
        }}
        className="lg:hidden px-3 py-2 rounded-xl bg-quranic-emerald text-white text-xs font-bold shadow-quranic-glow hover:opacity-90 transition-all"
      >
        جستجو
      </button>
    </div>
  );
}
