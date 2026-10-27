import Link from "next/link";
import { safeReturnPath } from "@/lib/schema";
import { getSession } from "@/lib/session";
import { openGraph } from "@/lib/site";
import LoginForm from "./LoginForm";

const DESCRIPTION =
  "Sign in to Hakim with your mobile number and password to book a clinic appointment and see your bookings.";

export const metadata = {
  title: "Sign in",
  description: DESCRIPTION,
  openGraph: openGraph({ title: "Sign in · Hakim", description: DESCRIPTION, path: "/login" }),
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

export default async function LoginPage({ searchParams }) {
  const { next } = await searchParams;
  const session = await getSession();
  const returnTo = safeReturnPath(next, session?.role === "reception" ? "/reception" : "/appointments");
  const signUpHref = next ? `/signup?next=${encodeURIComponent(returnTo)}` : "/signup";

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
      <h1>Sign in</h1>
      <p>Booking and your appointments need an account: your mobile number and a password.</p>
      {next && <p className="note">Sign in to continue to the page you asked for.</p>}
      <LoginForm next={returnTo} />
      <p>
        New to Hakim? <Link href={signUpHref}>Create an account</Link>
      </p>
    </>
  );
}
