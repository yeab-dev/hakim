import Link from "next/link";

// The staff part of the site: today's list (/reception) and the week view
// (/reception/week). Both are one clinic's private data, read with the
// session cookie, so the group renders per request, and is never indexed.
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default function ReceptionLayout({ children }) {
  return (
    <>
      <nav className="subnav" aria-label="Reception">
        <Link href="/reception">Today</Link>
        <Link href="/reception/week">This week</Link>
      </nav>
      {children}
    </>
  );
}
