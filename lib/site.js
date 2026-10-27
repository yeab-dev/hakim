const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : null;
export const SITE_URL = (process.env.SITE_URL || vercelProduction || "https://hakim.example").replace(/\/+$/, "");
export const SITE_NAME = "Hakim";

export const absolute = (path) => new URL(path, `${SITE_URL}/`).toString();

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

export const PRIVATE = { index: false, follow: false };
