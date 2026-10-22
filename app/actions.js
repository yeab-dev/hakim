"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkCancel } from "@/lib/appointments";
import { bookSlot } from "@/lib/booking";
import { parseBooking, parseSignIn, readBookingForm, safeReturnPath } from "@/lib/schema";
import { endSession, getUser, startSession } from "@/lib/session";
import { markCancelled } from "@/lib/store";

// Server actions. Each one is a public HTTP endpoint — anyone can call it with
// any arguments, with or without our forms — so each one checks its own input
// and its own permissions, however it is reached.

// The sign-in form's action, driven by useActionState.
export async function signIn(_previous, formData) {
  const phone = formData.get("phone");
  const parsed = parseSignIn({ phone });
  if (!parsed.success) {
    return { fieldErrors: parsed.fieldErrors, values: { phone: typeof phone === "string" ? phone : "" } };
  }
  await startSession(parsed.data.phone);
  redirect(safeReturnPath(formData.get("from")));
}

export async function signOut() {
  await endSession();
  redirect("/");
}

// The booking form's action, driven by useActionState. Returns the form's
// next state on failure; redirects to the new appointment on success.
export async function bookAppointment(_previous, formData) {
  const raw = readBookingForm(formData);

  // 1. Who is asking — from the signed cookie, not from the form.
  const user = await getUser();
  if (!user) redirect(`/login?from=${encodeURIComponent(`/book/${raw.slotId}`)}`);

  // 2. The same rules the form checked, enforced here for real.
  const parsed = parseBooking(raw);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values: raw };

  // 3. The slot must exist and still be free.
  const result = await bookSlot(user, parsed.data);
  if (result.status === "not-found") {
    return { formError: "That time is no longer on offer. Go back to the clinic and choose another.", values: raw };
  }
  if (result.status === "taken") {
    return { formError: "Someone has just booked that time. Go back to the clinic and choose another.", values: raw };
  }

  // 4. The clinic page is cached (ISR): tell Next.js its slots changed.
  revalidatePath(`/clinics/${result.slot.clinic.id}`);
  revalidatePath("/appointments");
  redirect(`/appointments/${result.appointment.id}?booked=1`);
}

// Cancel one booking. The appointment id arrives from the browser, so it is
// treated as a claim, not a fact: this action checks, every time, that there
// is a session AND that the booking belongs to that session's user. Hiding
// the Cancel button on other people's bookings would stop nobody — this
// function is an HTTP endpoint and can be called with any id.
export async function cancelAppointment(_previous, formData) {
  const id = formData.get("appointmentId");

  const user = await getUser();
  if (!user) return { error: "Your session has ended. Sign in again to cancel." };

  const { outcome, appointment } = await checkCancel(user.phone, id);
  if (outcome === "not-found" || outcome === "forbidden") {
    // One message for both: do not confirm that someone else's booking exists.
    console.warn(`cancelAppointment refused (${outcome}) for ${user.phone}: ${String(id)}`);
    return { error: "You can only cancel your own bookings." };
  }
  if (outcome === "too-late") return { error: "This appointment has already started, so it cannot be cancelled." };
  if (outcome === "already-cancelled") return { ok: true };

  await markCancelled(appointment.id);
  // The slot is free again: refresh the cached clinic page and the lists.
  revalidatePath(`/clinics/${appointment.clinicId}`);
  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointment.id}`);
  return { ok: true };
}
