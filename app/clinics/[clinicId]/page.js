import Link from "next/link";
import { notFound } from "next/navigation";
import { getClinic, getClinicIds } from "@/lib/data";
import { etb, etbRange } from "@/lib/format";
import { clinicJsonLd, serialiseJsonLd } from "@/lib/jsonld";
import { openGraph } from "@/lib/site";
import DoctorSlots from "./DoctorSlots";

export const revalidate = 60;

export const dynamicParams = false;

export function generateStaticParams() {
  return getClinicIds().map((clinicId) => ({ clinicId }));
}

export async function generateMetadata({ params }) {
  const { clinicId } = await params;
  const clinic = await getClinic(clinicId);
  if (!clinic) return { title: "Clinic not found" };

  const fees = clinic.doctors.map((d) => d.fee);
  const low = Math.min(...fees);
  const high = Math.max(...fees);
  const specialties = clinic.specialties.map((s) => s.name.toLowerCase()).join(", ");
  const description =
    `${clinic.name}, ${clinic.areaName}, Addis Ababa: ${specialties}. ` +
    `${clinic.doctors.length} doctors, consultations ${etbRange(low, high)}. ` +
    "See this week's open times and book online.";
  const path = `/clinics/${clinic.id}`;
  return {
    title: `${clinic.name}, ${clinic.areaName}`,
    description,
    alternates: { canonical: path },
    openGraph: openGraph({ title: `${clinic.name} · Hakim`, description, path, siteCard: false }),
  };
}

export default async function ClinicPage({ params }) {
  const { clinicId } = await params;
  const clinic = await getClinic(clinicId);
  if (!clinic) notFound();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialiseJsonLd(clinicJsonLd(clinic)) }} />
      <p>
        <Link className="back-link" href="/clinics">&larr; All clinics</Link>
      </p>
      <h1>{clinic.name}</h1>
      <dl className="facts">
        <div>
          <dt>Address</dt>
          <dd>
            {clinic.address}, {clinic.areaName}
          </dd>
        </div>
        <div>
          <dt>Opening hours</dt>
          <dd>{clinic.hours}</dd>
        </div>
        <div>
          <dt>Reception</dt>
          <dd>{clinic.phone}</dd>
        </div>
      </dl>
      <p>{clinic.about}</p>

      <h2>Doctors and open times this week</h2>
      <ul className="doctors">
        {clinic.doctors.map((doctor) => (
          <li key={doctor.id} id={doctor.id} className="doctor">
            <h3 className="doctor__name">{doctor.name}</h3>
            <p className="doctor__meta">
              {doctor.specialtyName} · consultation {etb(doctor.fee)}
            </p>
            <p className="doctor__about">{doctor.about}</p>
            <DoctorSlots doctorId={doctor.id} doctorName={doctor.name} week={doctor.week} />
          </li>
        ))}
      </ul>
    </>
  );
}
