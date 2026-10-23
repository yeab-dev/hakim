import Link from "next/link";
import { notFound } from "next/navigation";
import { getClinic, getClinicIds } from "@/lib/data";
import DoctorSlots from "./DoctorSlots";

// Prerendered from params (●), refreshed at most once a minute (ISR), and
// refreshed at once by revalidatePath() whenever a booking or cancellation
// changes a slot here (see app/actions.js).
//
// - Every clinic id is known at build time → generateStaticParams.
// - The page is the same for every visitor → no cookie read, so it can be
//   cached. The Book link is where the session starts to matter.
// - Slots move as people book and as the clock passes them → 60 seconds is
//   the most a list of open times may be out of date; the booking page checks
//   the slot again anyway, so a stale slot can never be double-booked.
export const revalidate = 60;

// An id that was not built is a 404 — a real one, sent before any HTML.
export const dynamicParams = false;

export function generateStaticParams() {
  return getClinicIds().map((clinicId) => ({ clinicId }));
}

export async function generateMetadata({ params }) {
  const { clinicId } = await params;
  const clinic = await getClinic(clinicId);
  return { title: clinic ? clinic.name : "Clinic not found" };
}

export default async function ClinicPage({ params }) {
  const { clinicId } = await params; // a Promise in Next.js 15+
  const clinic = await getClinic(clinicId);
  if (!clinic) notFound();

  return (
    <>
      <p>
        <Link href="/clinics">&larr; All clinics</Link>
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
              {doctor.specialtyName} · consultation {doctor.fee} ETB
            </p>
            <p className="doctor__about">{doctor.about}</p>
            {/* Only the day picker is a client component. It gets plain data
                — dates, labels and slot ids — never a function. */}
            <DoctorSlots doctorId={doctor.id} doctorName={doctor.name} week={doctor.week} />
          </li>
        ))}
      </ul>
    </>
  );
}
