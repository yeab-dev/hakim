import Link from "next/link";
import { safeReturnPath } from "@/lib/schema";
import { getSession } from "@/lib/session";
import SignUpForm from "./SignUpForm";

export const metadata = { title: "Create an account" };

// Dynamic (ƒ), for the same reasons as /login: ?next= and the session cookie.
export default async function SignUpPage({ searchParams }) {
  const { next } = await searchParams;
  const returnTo = safeReturnPath(next);
  const session = await getSession();

  if (session) {
    return (
      <>
        <h1>Already signed in</h1>
        <p>
          You are signed in as {session.name} ({session.display}).
        </p>
        <p>
          <Link href={returnTo}>Continue</Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1>Create an account</h1>
      <p>
        One account per mobile number. You can book for anyone in your family from it — the
        patient&apos;s name goes on each booking.
      </p>
      <SignUpForm next={returnTo} />
      <p>
        Already have an account?{" "}
        <Link href={next ? `/login?next=${encodeURIComponent(returnTo)}` : "/login"}>Sign in</Link>
      </p>
    </>
  );
}
