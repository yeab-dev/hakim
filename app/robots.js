import { SITE_URL } from "@/lib/site";

// /robots.txt. The private routes are disallowed: there is nothing there for
// a crawler but a redirect to /login. /login and /signup are not disallowed,
// so a crawler can read their noindex instead.
export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/appointments", "/book/", "/reception", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
