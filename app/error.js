"use client";

import Link from "next/link";
import PropTypes from "prop-types";

// The fallback for a throw anywhere without a closer error.js (the clinics
// segment has its own). The layout above it — header and nav — stays up.
export default function RootError({ error, reset }) {
  return (
    <div className="state state--error" role="alert">
      <h1>Something went wrong</h1>
      <p>
        This page could not be shown.
        {error.digest && <> (Reference {error.digest}.)</>}
      </p>
      <p>
        <button type="button" className="button" onClick={() => reset()}>
          Try again
        </button>{" "}
        <Link href="/">Back to the home page</Link>
      </p>
    </div>
  );
}

RootError.propTypes = {
  error: PropTypes.shape({ digest: PropTypes.string }).isRequired,
  reset: PropTypes.func.isRequired,
};
