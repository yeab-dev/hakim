import Link from "next/link";
import { clinicToday } from "@/lib/appointments";
import { addisToday } from "@/lib/clock";
import { longDay } from "@/lib/format";
import { getClinicSummary } from "@/lib/data";
import { requireRole } from "@/lib/session";
import CheckInForm from "./CheckInForm";

export const metadata = {
  title: "Reception",
  description: "Today's bookings at your clinic, for reception staff to check patients in.",
  robots: { index: false, follow: false },
};

// Staff only, rendered per request. Three things are checked here, on the
// server, before anything is read: a session (requireRole → requireSession),
// the reception role, and — through the query — which clinic: the list is
// read with session.clinicId, so no URL or form value can show another
// clinic's patients. The check-in action checks all of it again.
export const dynamic = "force-dynamic";

export default async function ReceptionPage() {
  const session = await requireRole("reception", "/reception");
  const clinic = getClinicSummary(session.clinicId);
  const bookings = await clinicToday(session.clinicId);
  const waiting = bookings.filter((a) => a.status === "booked").length;

  return (
    <>
      <h1>Reception · {clinic.name}</h1>
      <p>
        {longDay(addisToday())}. Signed in as {session.name}. {waiting} of {bookings.length}{" "}
        {bookings.length === 1 ? "booking" : "bookings"} still to arrive.
      </p>

      {bookings.length === 0 ? (
        <div className="state">
          <p>No bookings at {clinic.name} today.</p>
        </div>
      ) : (
        <ul className="appointments">
          {bookings.map((a) => (
            <li key={a.id} className="appointment">
              <div>
                <p className="appointment__when">
                  {a.timeLabel} · {a.doctorName}
                </p>
                <p className="appointment__who">
                  {a.patientName} · {a.phoneLabel} · {a.reason}
                </p>
              </div>
              <div className="appointment__side">
                <span className={`status status--${a.status}`}>{a.statusLabel}</span>{" "}
                <span className="reference">{a.id}</span>
                {a.status === "booked" && <CheckInForm appointmentId={a.id} patientName={a.patientName} />}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p>
        <Link href={`/clinics/${clinic.id}`}>See {clinic.name}&apos;s public page</Link>
      </p>
    </>
  );
}
