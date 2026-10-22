import { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "./AuthContext";

const STORAGE_KEY = "hakim-session";

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

// A stand-in session: no server and no password yet. Real authentication
// arrives with the Next.js weeks; for now the point is the guard.
function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);

  const signIn = useCallback((phone) => {
    const session = { phone };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setUser(session);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};

export default AuthProvider;
