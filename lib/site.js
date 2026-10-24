// Where the site lives, and the metadata defaults every route shares.
//
// SITE_URL is the production origin, used for metadataBase (so og:image and
// canonical URLs are absolute), the sitemap and robots.txt. It is read on the
// server only — not NEXT_PUBLIC_, because no browser code needs it. It is not
// a secret either.
//
// In order: SITE_URL if set; otherwise, on Vercel, the project's production
// domain, which Vercel provides at build time as VERCEL_PROJECT_PRODUCTION_URL
// (a bare host, so https:// is added). That makes previews correct with no
// dashboard setup. Off Vercel, with neither set, a placeholder on the reserved
// .example domain is used, so nobody mistakes it for a real address and no
// preview ever points at localhost.
const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : null;
export const SITE_URL = (process.env.SITE_URL || vercelProduction || "https://hakim.example").replace(/\/+$/, "");
export const SITE_NAME = "Hakim";

export const absolute = (path) => new URL(path, `${SITE_URL}/`).toString();

// Next.js merges metadata shallowly: a page's `openGraph` replaces the
// layout's whole object. Pages build theirs through this so the shared fields
// stay — including the site-wide card from app/opengraph-image.js, which a
// page's own openGraph would otherwise drop. A page whose folder has its own
// opengraph-image file (each clinic) passes `siteCard: false`: in Next.js
// 16.4 an `images` entry here would replace that file's card, not the other
// way round (checked in the served HTML).
const SITE_CARD = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Hakim: book a clinic appointment in Addis Ababa without the morning queue",
};

export function openGraph({ title, description, path, type = "website", siteCard = true }) {
  return {
    title,
    description,
    url: path,
    siteName: SITE_NAME,
    locale: "en_ET",
    type,
    ...(siteCard ? { images: [SITE_CARD] } : {}),
  };
}

// Pages that only make sense for one signed-in person.
export const PRIVATE = { index: false, follow: false };
