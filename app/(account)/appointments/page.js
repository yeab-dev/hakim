import Link from "next/link";
import PropTypes from "prop-types";
import { appointmentsFor } from "@/lib/appointments";
import { requireSession } from "@/lib/session";

export const metadata = { title: "My appointments" };

// Dynamic (ƒ): one person's bookings, read with their cookie. The Vite
// version fetched these in an effect; this async server component reads them
// directly — no useFetch, no loading flag, no endpoint in between.
export default async function AppointmentsPage() {
  const session = await requireSession("/appointments");
  const { upcoming, earlier } = await appointmentsFor(session.userId);

  return (
    <>
      <h1>My appointments</h1>
      <p>Signed in as {session.name} ({session.display}).</p>

      <h2>Upcoming</h2>
      {upcoming.length === 0 ? (
        <div className="state">
          <p>Nothing booked yet.</p>
          <p>
            <Link href="/clinics">Find a clinic with free time this week</Link>
          </p>
        </div>
      ) : (
        <AppointmentList appointments={upcoming} />
      )}

      {earlier.length > 0 && (
        <>
          <h2>Past and cancelled</h2>
          <AppointmentList appointments={earlier} />
        </>
      )}
    </>
  );
}

function AppointmentList({ appointments }) {
  return (
    <ul className="appointments">
      {appointments.map((a) => (
        <li key={a.id} className="appointment">
          <div>
            <p className="appointment__when">
              <Link href={`/appointments/${a.id}`}>{a.whenLabel}</Link> · {a.doctorName}
            </p>
            <p className="appointment__who">
              {a.clinicName}, {a.areaName} · for {a.patientName}
            </p>
          </div>
          <div>
            <span className={`status status--${a.status}`}>
              {a.statusLabel}
            </span>{" "}
            <span className="reference">{a.id}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

AppointmentList.propTypes = {
  appointments: PropTypes.arrayOf(PropTypes.object).isRequired,
};
