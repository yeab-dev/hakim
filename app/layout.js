import Link from "next/link";
import AuthMenu from "@/components/AuthMenu";
import NavTabs from "@/components/NavTabs";
import { SITE_NAME, SITE_URL, openGraph } from "@/lib/site";
import Providers from "./providers";
import "./globals.css";

const DESCRIPTION =
  "Find a clinic in Addis Ababa, see which doctors have free time this week, and book a slot without the morning queue.";

// The defaults every route starts from. Only a server component may export
// metadata. metadataBase turns every relative URL below (and the og:image
// from opengraph-image.js) into an absolute one: without it a shared link
// arrives without its picture.
export const metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: "Hakim — book a clinic appointment in Addis Ababa",
    template: "%s · Hakim",
  },
  description: DESCRIPTION,
  openGraph: openGraph({ title: "Hakim — book a clinic appointment in Addis Ababa", description: DESCRIPTION, path: "/" }),
  twitter: { card: "summary_large_image" },
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
