import { useEffect, useState } from "react";
import api from "@/lib/api";

/** Scholars & teachers may create tadabbur content; everyone else is read-only. */
export function isScholarUser(user) {
  if (!user) return false;
  return user.is_scholar === true || user.role === "admin";
}

export function useScholar() {
  const [state, setState] = useState({ user: null, loading: true });

  useEffect(() => {
    api.auth
      .me()
      .then((user) => setState({ user, loading: false }))
      .catch(() => setState({ user: null, loading: false }));
  }, []);

  return { user: state.user, loading: state.loading, isScholar: isScholarUser(state.user) };
}