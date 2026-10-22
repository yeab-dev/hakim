import Link from "next/link";
import AuthMenu from "@/components/AuthMenu";
import NavTabs from "@/components/NavTabs";
import Providers from "./providers";
import "./globals.css";

// Replaces index.html's <title>. Only a server component may export metadata.
export const metadata = {
  title: {
    default: "Hakim — book a clinic appointment in Addis Ababa",
    template: "%s · Hakim",
  },
  description:
    "Find a clinic in Addis Ababa, see which doctors have free time this week, and book a slot without the morning queue.",
  icons: "/favicon.svg",
};

export const viewport = {
  colorScheme: "light dark",
};

// The root shell. On Vite this was index.html, main.jsx and ui/Layout.jsx;
// `children` is what <Outlet /> used to be.
//
// A server component that imports two client leaves (NavTabs, AuthMenu) and
// the client Providers file — and reads no cookie, so it leaves every route
// free to be static. Who is signed in is fetched by the header itself.
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="shell">
            <header className="topbar">
              <Link className="brand" href="/">
                Hakim
              </Link>
              <nav aria-label="Main" className="nav">
                <NavTabs />
                <AuthMenu />
              </nav>
            </header>

            <main className="page">{children}</main>

            <footer className="footer">
              <p>Hakim · book a doctor in Addis Ababa without the morning queue.</p>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
