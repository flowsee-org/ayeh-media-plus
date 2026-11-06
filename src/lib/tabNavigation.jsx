import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/* Per-tab navigation stack: each bottom-tab remembers the routes the user
   visited inside it (sessionStorage). Switching tabs restores the tab's
   last route; re-selecting the active tab jumps to its root. */

const STORAGE_KEY = "tab-nav-stacks";
const TabNavContext = createContext(null);

const readStacks = () => {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

const matchTab = (tabs, pathname) =>
  tabs.find(({ to }) => (to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/"))) || null;

export function TabNavProvider({ tabs, children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [stacks, setStacks] = useState(readStacks);
  const lastTabRef = useRef(matchTab(tabs, pathname)?.to ?? null);

  /* Record every path into its owning tab's history */
  useEffect(() => {
    const tab = matchTab(tabs, pathname)?.to;
    if (!tab) return;
    setStacks((prev) => {
      const stack = prev[tab] || [tab];
      const idx = stack.indexOf(pathname);
      const nextStack = idx !== -1 ? stack.slice(0, idx + 1) : [...stack, pathname];
      const next = { ...prev, [tab]: nextStack };
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    lastTabRef.current = tab;
  }, [pathname, tabs]);

  const handleTabClick = (e, to) => {
    e.preventDefault();
    const activeTab = matchTab(tabs, pathname)?.to;
    if (activeTab === to) {
      /* Re-selecting the active tab → jump to its root and reset its stack */
      setStacks((prev) => {
        const next = { ...prev, [to]: [to] };
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
      if (pathname !== to) navigate(to);
      return;
    }
    /* Switching tabs → restore that tab's saved last route */
    const stack = stacks[to] || [to];
    navigate(stack[stack.length - 1] || to);
  };

  return <TabNavContext.Provider value={{ handleTabClick }}>{children}</TabNavContext.Provider>;
}

export function useTabNav() {
  return useContext(TabNavContext) || { handleTabClick: null };
}