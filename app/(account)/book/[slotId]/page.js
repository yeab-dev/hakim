import Link from "next/link";
import { notFound } from "next/navigation";
import SlotSummary from "@/components/SlotSummary";
import { longDayLabel } from "@/lib/clock";
import { getSlot } from "@/lib/data";
import { requireUser } from "@/lib/session";
import BookingForm from "./BookingForm";

export const metadata = { title: "Book an appointment" };

// Dynamic (ƒ) — the (account) layout says so, and the page needs it: it reads
// the session cookie, and the slot's "still free?" must be checked now, not
// at build time.
export default async function BookPage({ params }) {
  const { slotId } = await params;
  const user = await requireUser(`/book/${slotId}`);
  const slot = await getSlot(slotId);
  if (!slot) notFound();

  const rows = [
    ["Doctor", `${slot.doctor.name} · ${slot.doctor.specialtyName}`],
    ["Clinic", `${slot.clinic.name}, ${slot.clinic.areaName}`],
    ["When", `${longDayLabel(slot.date)} at ${slot.time}`],
    ["Fee", `${slot.doctor.fee} ETB, paid at the clinic`],
  ];

  return (
    <>
      <p>
        <Link href={`/clinics/${slot.clinic.id}`}>&larr; Back to {slot.clinic.name}</Link>
      </p>
      <h1>Book this appointment</h1>
      <SlotSummary rows={rows} />

      {slot.taken ? (
        <div className="state" role="status">
          <p>
            <strong>Someone has just booked this time.</strong>
          </p>
          <p>
            <Link href={`/clinics/${slot.clinic.id}`}>Choose another time at {slot.clinic.name}</Link>
          </p>
        </div>
      ) : (
        <BookingForm slotId={slot.id} defaultPhone={user.display} />
      )}
    </>
  );
}
