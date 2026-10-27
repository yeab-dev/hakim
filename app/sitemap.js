import { getAreas, getClinicIds, getSpecialties } from "@/lib/data";
import { absolute } from "@/lib/site";

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
