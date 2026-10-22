import Link from "next/link";
import { safeReturnPath } from "@/lib/schema";
import { getUser } from "@/lib/session";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in" };

// Dynamic (ƒ): it reads ?from= (where to return) and the session cookie (to
// say "already signed in" instead of showing the form).
export default async function LoginPage({ searchParams }) {
  const { from } = await searchParams;
  const returnTo = safeReturnPath(from);
  const user = await getUser();

  if (user) {
    return (
      <>
        <h1>Already signed in</h1>
        <p>You are signed in as {user.display}.</p>
        <p>
          <Link href={returnTo}>Continue</Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1>Sign in</h1>
      <p>
        Booking and your appointments need a mobile number. There is no password or SMS code yet —
        any 09… number signs you in as that number.
      </p>
      {from && <p className="note">Sign in to continue to the page you asked for.</p>}
      <LoginForm from={returnTo} />
    </>
  );
}
