"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { bookSlot } from "@/lib/booking";
import { parseBooking, parseSignIn, readBookingForm, safeReturnPath } from "@/lib/schema";
import { endSession, getUser, startSession } from "@/lib/session";

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
