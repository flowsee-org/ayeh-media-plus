import { Link, useLocation } from "@/lib/router-compat";
import { useTabNav } from "@/lib/tabNavigation";

export default function BottomNav({ tabs }) {
  const { pathname } = useLocation();
  const { handleTabClick } = useTabNav();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-xl shadow-soft font-ui"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="flex items-center justify-around h-15 px-1 max-w-lg mx-auto">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== "/" && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              onClick={(e) => handleTabClick?.(e, to)}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-colors ${
                active ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className="h-5 w-5"
                  strokeWidth={active ? 2.3 : 1.7}
                />
              </div>
              <span className={`text-xs mt-0.5 tracking-tight font-ui ${active ? "font-bold text-primary" : "font-medium"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
