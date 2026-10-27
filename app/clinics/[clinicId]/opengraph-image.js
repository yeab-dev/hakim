import { ImageResponse } from "next/og";
import { getClinicCard, getClinicIds } from "@/lib/data";
import { etbRange } from "@/lib/format";
import { OG_SIZE, OgFrame } from "@/lib/og";

export const alt = "A Hakim clinic: name, area, specialties and consultation fees";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamicParams = false;

export function generateStaticParams() {
  return getClinicIds().map((clinicId) => ({ clinicId }));
}

export default async function Image({ params }) {
  const { clinicId } = await params;
  const clinic = getClinicCard(clinicId);
  const fees = etbRange(clinic.feeFrom, clinic.feeTo);
  return new ImageResponse(
    (
      <OgFrame
        eyebrow={`${clinic.areaName.toUpperCase()} · ADDIS ABABA`}
        title={clinic.name}
        lines={[
          clinic.specialties.map((s) => s.name).join(" · "),
          `${clinic.doctorCount} doctors · consultation ${fees}`,
        ]}
        footer={clinic.hours}
      />
    ),
    size,
  );
}
