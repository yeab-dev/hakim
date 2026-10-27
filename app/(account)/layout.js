import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = { robots: { index: false, follow: false } };

export default function AccountLayout({ children }) {
  return (
    <>
      <nav className="subnav" aria-label="Your account">
        <Link href="/appointments">My appointments</Link>
        <Link href="/clinics">Book another visit</Link>
      </nav>
      {children}
    </>
  );
}
