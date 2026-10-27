import { etb } from "./format";
import { absolute } from "./site";

const SPECIALTY = {
  "general-practice": "PrimaryCare",
  paediatrics: "Pediatric",
  gynaecology: "Gynecologic",
  dentistry: "Dentistry",
  dermatology: "Dermatology",
};
const specialtyUrl = (id) => (SPECIALTY[id] ? `https://schema.org/${SPECIALTY[id]}` : undefined);

const international = (local) => `+251 ${local.replace(/^0/, "")}`;

export function clinicJsonLd(clinic) {
  const url = absolute(`/clinics/${clinic.id}`);
  const address = {
    "@type": "PostalAddress",
    streetAddress: clinic.address,
    addressLocality: "Addis Ababa",
    addressRegion: clinic.areaName,
    addressCountry: "ET",
  };
  const specialties = clinic.specialties.map((s) => specialtyUrl(s.id)).filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalClinic",
        "@id": `${url}#clinic`,
        name: clinic.name,
        url,
        description: clinic.about,
        telephone: international(clinic.phone),
        address,
        ...(specialties.length ? { medicalSpecialty: specialties } : {}),
        image: absolute(`/clinics/${clinic.id}/opengraph-image`),
      },
      ...clinic.doctors.map((d) => ({
        "@type": "Physician",
        "@id": `${url}#${d.id}`,
        name: d.name,
        url: `${url}#${d.id}`,
        description: d.about,
        ...(specialtyUrl(d.specialty) ? { medicalSpecialty: specialtyUrl(d.specialty) } : {}),
        priceRange: etb(d.fee),
        currenciesAccepted: "ETB",
        address,
        parentOrganization: { "@id": `${url}#clinic` },
      })),
    ],
  };
}

export const serialiseJsonLd = (data) => JSON.stringify(data).replace(/</g, "\\u003c");
