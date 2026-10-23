"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition } from "react";
import PropTypes from "prop-types";

// Catches a throw anywhere in the clinics segment — try /clinics?fail=1.
// A client component because an error boundary is state plus a retry handler.
// In production the server's message is withheld; `digest` is the id to find
// it in the server log.
export default function ClinicsError({ error, reset }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // About React error #419 in the console after ?fail=1 (Day 49): it is not
  // caused by this retry. The list failed inside a Suspense boundary during
  // the server render, so the HTML holds that boundary as "client-render
  // this". React queues a recoverable-error report for it while hydrating and
  // prints it on the next commit, whatever that commit is: pressing Try
  // again, or following "Back to the home page", both print it (checked).
  // It is React accurately reporting the deliberate server failure. The
  // fixes tried (reset after the navigation commits, reordering) do not
  // touch it, because the report is already queued before any click.
  function retry() {
    // reset() alone would re-render the same failed server output. Drop
    // ?fail=1 (keeping the filters), ask the server again, and clear the
    // boundary in the same transition.
    const next = new URLSearchParams(params);
    next.delete("fail");
    const query = next.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname);
      reset();
    });
  }

  return (
    <div className="state state--error" role="alert">
      <h1>Could not load the clinics</h1>
      <p>
        The clinic directory is not answering right now.
        {error.digest && <> (Reference {error.digest}.)</>}
      </p>
      <p>
        <button type="button" className="button" onClick={retry}>
          Try again
        </button>{" "}
        <Link href="/">Back to the home page</Link>
      </p>
    </div>
  );
}

ClinicsError.propTypes = {
  error: PropTypes.shape({ digest: PropTypes.string }).isRequired,
  reset: PropTypes.func.isRequired,
};
