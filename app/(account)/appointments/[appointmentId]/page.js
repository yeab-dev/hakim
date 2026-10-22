import { requireUser } from "@/lib/session";

export default async function AppointmentPage({ params }) {
  const { appointmentId } = await params;
  await requireUser(`/appointments/${appointmentId}`);
  return <h1>Appointment {appointmentId}</h1>;
}
