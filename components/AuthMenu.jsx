"use client";

import Link from "next/link";
import { signOut } from "@/app/actions";
import { useAuth } from "@/auth/useAuth";

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
