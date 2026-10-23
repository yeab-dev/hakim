import { ImageResponse } from "next/og";
import { getClinicIds, getSpecialties } from "@/lib/data";
import { OG_SIZE, OgFrame } from "@/lib/og";

// The site-wide preview card, used by every route that has no card of its own
// (each clinic page has one: app/clinics/[clinicId]/opengraph-image.js).
// Built once at build time, as a static PNG.
export const alt = "Hakim: book a clinic appointment in Addis Ababa without the morning queue";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  const clinics = getClinicIds().length;
  const specialties = getSpecialties().length;
  return new ImageResponse(
    (
      <OgFrame
        eyebrow="ADDIS ABABA"
        title="See a doctor this week, without the morning queue"
        lines={[`${clinics} clinics · ${specialties} specialties · open times for the next 7 days`]}
        footer="Book online, pay at the clinic"
      />
    ),
    size,
  );
}
