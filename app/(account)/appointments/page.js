import { requireUser } from "@/lib/session";

export const metadata = { title: "My appointments" };

export default async function AppointmentsPage() {
  await requireUser("/appointments");
  return <h1>My appointments</h1>;
}
