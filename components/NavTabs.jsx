"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/auth/useAuth";

const TABS = [
  { href: "/", label: "Home", end: true },
  { href: "/clinics", label: "Find a clinic" },
  { href: "/appointments", label: "My appointments" },
];

const RECEPTION_TAB = { href: "/reception", label: "Reception" };

function NavTabs() {
  const pathname = usePathname();
  const { user } = useAuth();
  const tabs = user?.role === "reception" ? [...TABS, RECEPTION_TAB] : TABS;

  function isActive(tab) {
    return tab.end
      ? pathname === tab.href
      : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
  }

  return (
    <>
      {tabs.map((tab) => (
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
