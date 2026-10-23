import Link from "next/link";
import { notFound } from "next/navigation";
import SlotSummary from "@/components/SlotSummary";
import { appointmentFor } from "@/lib/appointments";
import { requireSession } from "@/lib/session";
import CancelForm from "./CancelForm";
import LiveStatus from "./LiveStatus";

export const metadata = {
  title: "Appointment",
  description: "One booking on Hakim: its reference, doctor, clinic and time, and whether reception has checked you in.",
};

// Dynamic (ƒ): one booking, shown only to its owner. Somebody else's
// reference gets the same not-found screen as a reference that does not exist.
export default async function AppointmentPage({ params, searchParams }) {
  const { appointmentId } = await params;
  const { booked } = await searchParams;
  const session = await requireSession(`/appointments/${appointmentId}`);
  const appointment = await appointmentFor(session.userId, appointmentId);
  if (!appointment) notFound();

  const rows = [
    ["Reference", <span key="ref" className="reference">{appointment.id}</span>],
    // The one live row: a client component seeded with this same record.
    ["Status", <LiveStatus key="status" initial={appointment} />],
    ["Doctor", appointment.doctorName],
    ["Clinic", `${appointment.clinicName}, ${appointment.areaName}`],
    ["When", appointment.longWhen],
    ["Patient", appointment.forSomeoneElse ? `${appointment.patientName} (booked by you)` : appointment.patientName],
    ["Contact", appointment.phoneLabel],
    ["Reason", appointment.reason],
  ];

  return (
    <>
      <p>
        <Link href="/appointments">&larr; My appointments</Link>
      </p>
      {booked === "1" && appointment.status === "booked" && (
        <p className="banner" role="status">
          Booked. Your reference is <span className="reference">{appointment.id}</span> — show it at
          reception.
        </p>
      )}
      <h1>Appointment {appointment.id}</h1>
      <SlotSummary rows={rows} />

      {appointment.cancellable && <CancelForm initial={appointment} />}
      {appointment.status === "cancelled" && (
        <p>
          This booking is cancelled and the time is free for someone else.{" "}
          <Link href={`/clinics/${appointment.clinicId}`}>Book another time</Link>
        </p>
      )}
    </>
  );
}
