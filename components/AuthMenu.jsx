"use client";

import Link from "next/link";
import { signOut } from "@/app/actions";
import { useAuth } from "@/auth/useAuth";

// Sign in, or "Sign out 0911 234 567". The sign-out button is a form posting
// to a server action, so it works before the JavaScript has loaded.
//
// Who is signed in is only known after /api/session answers, so all three
// states render inside one .nav__auth box whose size is reserved in CSS (wide
// enough for the longest, "Sign out 0911 234 567"). Before Day 43 the box
// grew when the answer arrived, the header re-wrapped on a phone and pushed
// the page down: that was the whole of the site's layout shift, and it moved
// LCP to after the request.
function AuthMenu() {
  return (
    <span className="nav__auth">
      <AuthState />
    </span>
  );
}

function AuthState() {
  const { status, user, clear } = useAuth();

  if (status === "loading") {
    return (
      <span className="nav__link nav__pending" aria-hidden="true">
        &nbsp;
      </span>
    );
  }

  if (!user) {
    return (
      <Link href="/login" className="nav__link">
        Sign in
      </Link>
    );
  }

  return (
    <form action={signOut} onSubmit={clear}>
      <button type="submit" className="nav__link nav__button">
        Sign out <span className="visually-hidden">of </span>
        {user.display}
      </button>
    </form>
  );
}

export default AuthMenu;
