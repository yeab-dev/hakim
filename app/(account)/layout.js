import Link from "next/link";

// The signed-in part of the site: /book/…, /appointments and
// /appointments/…. The round brackets group them under one layout without
// adding "(account)" to the URL.
//
// Everything in here depends on who is asking — each page reads the session
// cookie — so the whole group is rendered per request. Said once, here,
// rather than left to be inferred page by page.
export const dynamic = "force-dynamic";

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
