"use server";

import { redirect } from "next/navigation";
import { parseSignIn, safeReturnPath } from "@/lib/schema";
import { endSession, startSession } from "@/lib/session";

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
