"use client";

import { usePathname } from "next/navigation";
import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useRef } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { AuthContext } from "./AuthContext";

// Who is signed in, for the header. The session is an httpOnly cookie no
// script can read, and the root layout must not read it either — a cookies()
// call there would make every page, including the static ones, render per
// request. So the header asks GET /api/session from the browser.
//
// One SWR query, key "/api/session": every component that needs it shares the
// one cache entry and the one request. Revalidated on focus (SWR's default —
// signing out in another tab shows here when you come back) and on every
// navigation, because signing in or out ends in one.
function AuthProvider({ children }) {
  const pathname = usePathname();
  const { data, error, isLoading, mutate } = useSWR("/api/session", fetcher, {
    dedupingInterval: 2000,
  });

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false; // the mount already fetched
      return;
    }
    mutate();
  }, [pathname, mutate]);

  // Signing out on the page you are on does not change the pathname: show
  // "signed out" now, without waiting for a request.
  const clear = useCallback(() => mutate({ user: null }, { revalidate: false }), [mutate]);

  const value = useMemo(
    () => ({
      status: isLoading ? "loading" : "ready",
      // A failed session request is shown as signed out; the server still
      // decides every real question.
      user: error ? null : (data?.user ?? null),
      clear,
    }),
    [isLoading, error, data, clear],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};

export default AuthProvider;
