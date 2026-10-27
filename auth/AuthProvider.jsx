"use client";

import { usePathname } from "next/navigation";
import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useRef } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { AuthContext } from "./AuthContext";

function AuthProvider({ children }) {
  const pathname = usePathname();
  const { data, error, isLoading, mutate } = useSWR("/api/session", fetcher, {
    dedupingInterval: 2000,
  });

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    mutate();
  }, [pathname, mutate]);

  const clear = useCallback(() => mutate({ user: null }, { revalidate: false }), [mutate]);

  const value = useMemo(
    () => ({
      status: isLoading ? "loading" : "ready",
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
