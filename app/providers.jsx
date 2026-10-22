"use client";

import PropTypes from "prop-types";
import AuthProvider from "@/auth/AuthProvider";

// Every provider in one client file, so app/layout.js stays a server
// component. `children` is passed in, not imported, so the pages inside are
// still server-rendered.
export default function Providers({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

Providers.propTypes = {
  children: PropTypes.node,
};
