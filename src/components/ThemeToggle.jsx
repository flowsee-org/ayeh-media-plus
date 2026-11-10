import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Theme hook — light mode is the primary Aparat-style experience.
 * Dark remains available as an explicit opt-in.
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tadabbur-theme");
      if (stored === "dark" || stored === "light") return stored;
      return "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("tadabbur-theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return { theme, toggle, toggleTheme: toggle, setTheme };
}

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full" />
    );
  }
  return (
    <button
      onClick={toggle}
      aria-label="تغییر تم"
      className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
    >
      {theme === "dark" ? (
        <Sun className="h-[21px] w-[21px]" strokeWidth={1.8} />
      ) : (
        <Moon className="h-[21px] w-[21px]" strokeWidth={1.8} />
      )}
    </button>
  );
}
