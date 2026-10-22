import { useContext } from "react";
import { AuthContext } from "./AuthContext";

// { user, status, clear } — for display only. Decisions about who may do what
// are made on the server, from the cookie, never from this.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
