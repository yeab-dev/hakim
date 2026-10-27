"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkCredentials, createAccount } from "@/lib/accounts";
import { checkArrive, checkCancel } from "@/lib/appointments";
import { bookSlot } from "@/lib/booking";
import { parseBooking, parseSignIn, parseSignUp, readBookingForm, safeReturnPath } from "@/lib/schema";
import { endSession, getSession, startSession } from "@/lib/session";
import { markArrived, markCancelled } from "@/lib/store";

const field = (formData, key) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

const homeFor = (role) => (role === "reception" ? "/reception" : "/appointments");

export async function signIn(_previous, formData) {
  const values = { phone: field(formData, "phone") };
  const parsed = parseSignIn({ phone: values.phone, password: field(formData, "password") });
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };

  const { outcome, account } = await checkCredentials(parsed.data.phone, parsed.data.password);
  if (outcome === "locked") {
    return { formError: "Too many wrong passwords for this number. Wait fifteen minutes and try again.", values };
  }
  if (outcome !== "ok") return { formError: "That number and password do not match an account.", values };

  await startSession(account.id);
  redirect(safeReturnPath(field(formData, "next"), homeFor(account.role)));
}

export async function signUp(_previous, formData) {
  const values = { name: field(formData, "name"), phone: field(formData, "phone") };
  const parsed = parseSignUp({ ...values, password: field(formData, "password") });
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };

  const result = await createAccount(parsed.data);
  if (!result.ok) {
    return { fieldErrors: { phone: "There is already an account for this number — sign in instead." }, values };
  }
  await startSession(result.account.id);
  redirect(safeReturnPath(field(formData, "next"), homeFor(result.account.role)));
}

export async function signOut() {
  await endSession();
  redirect("/");
}

export async function bookAppointment(_previous, formData) {
  const raw = readBookingForm(formData);

  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(`/book/${raw.slotId}`)}`);

  const parsed = parseBooking(raw);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values: raw };

  const result = await bookSlot(session, parsed.data);
  if (result.status === "not-found") {
    return { formError: "That time is no longer on offer. Go back to the clinic and choose another.", values: raw };
  }
  if (result.status === "taken") {
    return { formError: "Someone has just booked that time. Go back to the clinic and choose another.", values: raw };
  }

  revalidatePath(`/clinics/${result.slot.clinic.id}`);
  revalidatePath("/appointments");
  redirect(`/appointments/${result.appointment.id}?booked=1`);
}

export async function cancelAppointment(_previous, formData) {
  const id = formData.get("appointmentId");

  const session = await getSession();
  if (!session) return { error: "Sign in first: your session has ended or you are signed out." };

  const { outcome, appointment } = await checkCancel(session.userId, id);
  if (outcome === "not-found" || outcome === "forbidden") {
    console.warn(`cancelAppointment refused (${outcome}) for ${session.userId}: ${String(id)}`);
    return { error: "You can only cancel your own bookings." };
  }
  if (outcome === "too-late") return { error: "This appointment has started or you have checked in, so it cannot be cancelled." };
  if (outcome === "already-cancelled") return { ok: true };

  await markCancelled(appointment.id);
  revalidatePath(`/clinics/${appointment.clinicId}`);
  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointment.id}`);
  revalidatePath("/reception");
  return { ok: true };
}

export async function checkInAppointment(_previous, formData) {
  const id = formData.get("appointmentId");

  const session = await getSession();
  if (!session) return { error: "Sign in first: your session has ended or you are signed out." };
  if (session.role !== "reception") return { error: "Only clinic reception can check patients in." };

  const { outcome, appointment } = await checkArrive(session, id);
  if (outcome === "not-found" || outcome === "forbidden") {
    console.warn(`checkInAppointment refused (${outcome}) for ${session.userId}: ${String(id)}`);
    return { error: "That booking is not on your clinic's list for today." };
  }
  if (outcome === "not-today") return { error: "Only today's bookings can be checked in." };
  if (outcome === "cancelled") return { error: "That booking was cancelled." };
  if (outcome === "ok") await markArrived(appointment.id);

  revalidatePath("/reception");
  revalidatePath(`/appointments/${appointment.id}`);
  return { ok: true, id: appointment.id };
}
