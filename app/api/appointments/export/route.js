import { appointmentsFor } from "@/lib/appointments";
import { toCsv } from "@/lib/csv";
import { NOT_SIGNED_IN } from "@/lib/http";
import { getSession } from "@/lib/session";

// GET /api/appointments/export
//   200 text/csv   the signed-in user's own booking history, as a download
//   401 not signed in
//
// Scoped to session.userId like every other query: there is no id in the
// request to tamper with.
const COLUMNS = [
  { header: "Reference", value: (a) => a.id },
  { header: "Date", value: (a) => a.date },
  { header: "Time", value: (a) => a.timeLabel },
  { header: "Doctor", value: (a) => a.doctorName },
  { header: "Clinic", value: (a) => a.clinicName },
  { header: "Area", value: (a) => a.areaName },
  { header: "Patient", value: (a) => a.patientName },
  { header: "Reason", value: (a) => a.reason },
  { header: "Status", value: (a) => a.statusLabel },
];

export async function GET() {
  const session = await getSession();
  if (!session) return NOT_SIGNED_IN();

  const { upcoming, earlier } = await appointmentsFor(session.userId);
  const csv = toCsv(COLUMNS, [...upcoming, ...earlier]);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="hakim-appointments.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
