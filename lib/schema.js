// The rules for every form in Hakim, in one pure module.
//
// No React, no Next.js, no Node APIs — so the same file runs in the browser
// (the booking and sign-in forms check as you go) and on the server (the
// server actions and the route handlers check again, because anyone can send
// a request without the form). The browser check is a courtesy; the server
// check is the rule.
//
// parse*() returns the shape zod's safeParse does, so swapping zod in later
// changes this file only:
//   { success: true, data }  or  { success: false, fieldErrors: { field: "message" } }

// Ethiopian mobile numbers: 09XXXXXXXX or +2519XXXXXXXX — the same rule as
// the Day 33 checkout. People type spaces and dashes; strip what we can fix
// ourselves before testing, and never reject a number for formatting.
const MOBILE = /^(?:\+251|0)9\d{8}$/;

export const PHONE_HINT = "09… or +2519… — ten digits starting 09.";
export const NAME_MAX = 80;
export const REASON_MIN = 3;
export const REASON_MAX = 300;

// Field order, top to bottom: focus goes to the first bad field in this order.
export const BOOKING_FIELDS = ["patientName", "phone", "reason"];

export function normalisePhone(raw) {
  return String(raw ?? "").replace(/[\s\-().]/g, "");
}

export function phoneError(raw) {
  const phone = normalisePhone(raw);
  if (!phone) return "Enter a mobile number";
  if (!MOBILE.test(phone)) return "Use 09… or +2519… — a mobile number has 10 digits";
  return undefined;
}

// One spelling for storage and comparison: +2519XXXXXXXX.
export function canonicalPhone(raw) {
  const phone = normalisePhone(raw);
  return phone.startsWith("0") ? `+251${phone.slice(1)}` : phone;
}

// For people: "0911 234 567".
export function displayPhone(canonical) {
  const local = `0${String(canonical).replace(/^\+251/, "")}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

// The raw values out of a submitted form, as plain strings and a boolean.
export function readBookingForm(formData) {
  const get = (key) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };
  return {
    slotId: get("slotId"),
    patientName: get("patientName"),
    phone: get("phone"),
    reason: get("reason"),
    forSomeoneElse: formData.get("forSomeoneElse") === "on",
  };
}

// The booking form's rules. Takes the raw values, returns { field: message };
// {} means valid. Also accepts a JSON body (the route handler), so every
// value is checked for its type, not just its content.
export function validateBooking(form) {
  const errors = {};
  const name = typeof form.patientName === "string" ? form.patientName.trim() : "";
  const reason = typeof form.reason === "string" ? form.reason.trim() : "";

  if (!name) {
    errors.patientName = "Enter the patient's name";
  } else if (name.length > NAME_MAX) {
    errors.patientName = `Keep the name to ${NAME_MAX} characters`;
  }

  const phone = phoneError(typeof form.phone === "string" ? form.phone : "");
  if (phone) errors.phone = phone;

  if (!reason) {
    errors.reason = "Say in a few words why you are coming";
  } else if (reason.length < REASON_MIN) {
    errors.reason = `A few words, please — at least ${REASON_MIN} characters`;
  } else if (reason.length > REASON_MAX) {
    errors.reason = `Keep it to ${REASON_MAX} characters — you have ${reason.length}`;
  }

  if (form.forSomeoneElse !== undefined && typeof form.forSomeoneElse !== "boolean") {
    errors.forSomeoneElse = "Must be true or false";
  }

  if (typeof form.slotId !== "string" || !form.slotId) {
    errors.slotId = "Choose a slot";
  }

  return errors;
}

export function parseBooking(input) {
  const form = input && typeof input === "object" ? input : {};
  const fieldErrors = validateBooking(form);
  if (Object.keys(fieldErrors).length > 0) return { success: false, fieldErrors };
  return {
    success: true,
    data: {
      slotId: form.slotId,
      patientName: form.patientName.trim(),
      phone: canonicalPhone(form.phone),
      reason: form.reason.trim(),
      forSomeoneElse: Boolean(form.forSomeoneElse),
    },
  };
}

export function parseSignIn(input) {
  const phone = typeof input?.phone === "string" ? input.phone : "";
  const error = phoneError(phone);
  if (error) return { success: false, fieldErrors: { phone: error } };
  return { success: true, data: { phone: canonicalPhone(phone) } };
}

// Where to go after signing in. Only a path on this site: "/book/x" yes,
// "//evil.example" or "https://…" no — otherwise the login page is an open
// redirect.
export function safeReturnPath(from, fallback = "/appointments") {
  if (typeof from !== "string" || !from.startsWith("/") || from.startsWith("//") || from.includes("\\")) {
    return fallback;
  }
  return from;
}
