import Link from "next/link";
import PropTypes from "prop-types";
import { appointmentsFor } from "@/lib/appointments";
import { requireSession } from "@/lib/session";

export const metadata = {
  title: "My appointments",
  description: "Your upcoming, past and cancelled clinic bookings on Hakim, with the reference to show at reception.",
  alternates: { canonical: "/appointments" },
};

const PAGE_SIZE = 5;

export default async function AppointmentsPage({ searchParams }) {
  const { page: pageParam } = await searchParams;
  const session = await requireSession(pageParam ? `/appointments?page=${pageParam}` : "/appointments");
  const { upcoming, earlier } = await appointmentsFor(session.userId);

  const pages = Math.max(1, Math.ceil(earlier.length / PAGE_SIZE));
  const asked = Number.parseInt(pageParam, 10);
  const page = Number.isInteger(asked) && asked >= 1 && asked <= pages ? asked : 1;
  const shown = earlier.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <h1>My appointments</h1>
      <p>Signed in as {session.name} ({session.display}).</p>
      <p>
        <a href="/api/appointments/export" download>
          Download my booking history (CSV)
        </a>
      </p>

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
          <h2 id="earlier">Past and cancelled</h2>
          <AppointmentList appointments={shown} />
          {pages > 1 && <Pager page={page} pages={pages} total={earlier.length} />}
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

function Pager({ page, pages, total }) {
  const href = (n) => (n === 1 ? "/appointments#earlier" : `/appointments?page=${n}#earlier`);
  return (
    <nav className="pager" aria-label="Past and cancelled bookings, by page">
      {page > 1 ? <Link href={href(page - 1)}>&larr; Newer</Link> : <span aria-hidden="true" />}
      <span>
        Page {page} of {pages} · {total} bookings
      </span>
      {page < pages && <Link href={href(page + 1)}>Older &rarr;</Link>}
    </nav>
  );
}

Pager.propTypes = {
  page: PropTypes.number.isRequired,
  pages: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
};

AppointmentList.propTypes = {
  appointments: PropTypes.arrayOf(PropTypes.object).isRequired,
};
