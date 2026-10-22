"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", end: true },
  { href: "/clinics", label: "Find a clinic" },
  { href: "/appointments", label: "My appointments" },
];

// Next.js has no NavLink. "Which tab is open" comes from usePathname, a hook,
// so this one piece is a client component and the layout around it stays on
// the server. `end` keeps "/" from matching every address.
function NavTabs() {
  const pathname = usePathname();

  function isActive(tab) {
    return tab.end
      ? pathname === tab.href
      : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
  }

  return (
    <>
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={isActive(tab) ? "nav__link nav__link--active" : "nav__link"}
          aria-current={isActive(tab) ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </>
  );
}

export default NavTabs;
