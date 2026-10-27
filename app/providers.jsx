"use client";

import PropTypes from "prop-types";
import AuthProvider from "@/auth/AuthProvider";

export default function Providers({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

Providers.propTypes = {
  children: PropTypes.node,
};
