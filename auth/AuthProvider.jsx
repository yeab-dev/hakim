"use client";

import { usePathname } from "next/navigation";
import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";

// Who is signed in, for the header. On Vite this read localStorage. Now the
// session is an httpOnly cookie that no script can read, and the root layout
// must not read it either — a cookies() call there would make every page,
// including the static ones, render per request. So the header asks
// GET /api/session from the browser, after the page has arrived, and again on
// every navigation (signing in or out ends in one).
function AuthProvider({ children }) {
  const pathname = usePathname();
  const [state, setState] = useState({ status: "loading", user: null });

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/session", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { user: null }))
      .then(({ user }) => setState({ status: "ready", user }))
      .catch((error) => {
        if (error.name !== "AbortError") setState({ status: "ready", user: null });
      });
    return () => controller.abort();
  }, [pathname]);

  // Signing out on the page you are on does not change the pathname.
  const clear = useCallback(() => setState({ status: "ready", user: null }), []);

  const value = useMemo(() => ({ ...state, clear }), [state, clear]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};

export default AuthProvider;
