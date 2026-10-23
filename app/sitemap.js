import { getAreas, getClinicIds, getSpecialties } from "@/lib/data";
import { absolute } from "@/lib/site";

// /sitemap.xml, built from the same data the pages use, so a clinic added to
// data/clinics.json is listed without anyone editing this file. Only public
// pages: the home page, the clinic list, its single-filter views (the links
// on the home page, each with its own canonical URL), and every clinic.
// Nothing behind sign-in, and not /login or /signup.
export default function sitemap() {
  return [
    { url: absolute("/"), changeFrequency: "weekly", priority: 1 },
    { url: absolute("/clinics"), changeFrequency: "daily", priority: 0.9 },
    ...getClinicIds().map((id) => ({
      url: absolute(`/clinics/${id}`),
      changeFrequency: "daily",
      priority: 0.8,
    })),
    ...getSpecialties().map((s) => ({
      url: absolute(`/clinics?specialty=${s.id}`),
      changeFrequency: "daily",
      priority: 0.6,
    })),
    ...getAreas().map((a) => ({
      url: absolute(`/clinics?area=${a.id}`),
      changeFrequency: "daily",
      priority: 0.5,
    })),
  ];
}
