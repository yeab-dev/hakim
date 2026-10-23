import { absolute } from "./site";

// schema.org JSON-LD for a clinic page, built from the very object the page
// renders (getClinic), so it cannot claim anything the page does not show:
// the name, address, reception number, description, specialties, and each
// doctor with their specialty and consultation fee in ETB.
//
// Opening hours are left out on purpose: the page shows them as free text
// ("Mon–Sat, 08:00–18:00"), and turning that into schema's machine format
// would be a second, unchecked source of truth.

// Our specialties → schema.org MedicalSpecialty, where one clearly fits.
// Internal medicine and eye care have no exact match, so they are not
// claimed.
const SPECIALTY = {
  "general-practice": "PrimaryCare",
  paediatrics: "Pediatric",
  gynaecology: "Gynecologic",
  dentistry: "Dentistry",
  dermatology: "Dermatology",
};
const specialtyUrl = (id) => (SPECIALTY[id] ? `https://schema.org/${SPECIALTY[id]}` : undefined);

// "011 661 2040" → "+251 11 661 2040"
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
        priceRange: `${d.fee} ETB`,
        currenciesAccepted: "ETB",
        address,
        parentOrganization: { "@id": `${url}#clinic` },
      })),
    ],
  };
}

// For <script type="application/ld+json">: JSON.stringify does not escape
// "<", so a "</script>" inside any value would end the tag early.
export const serialiseJsonLd = (data) => JSON.stringify(data).replace(/</g, "\\u003c");
