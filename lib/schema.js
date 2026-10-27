const MOBILE = /^(?:\+251|0)9\d{8}$/;

export const PHONE_HINT = "09… or +2519… — ten digits starting 09.";
export const NAME_MAX = 80;
export const REASON_MIN = 3;
export const REASON_MAX = 300;

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

export function canonicalPhone(raw) {
  const phone = normalisePhone(raw);
  return phone.startsWith("0") ? `+251${phone.slice(1)}` : phone;
}

export function displayPhone(canonical) {
  const local = `0${String(canonical).replace(/^\+251/, "")}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

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

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const PASSWORD_HINT = `At least ${PASSWORD_MIN} characters. A short sentence is easier to remember than a code.`;

const text = (value) => (typeof value === "string" ? value : "");

export function parseSignIn(input) {
  const phone = text(input?.phone);
  const password = text(input?.password);
  const fieldErrors = {};
  const problem = phoneError(phone);
  if (problem) fieldErrors.phone = problem;
  if (!password) fieldErrors.password = "Enter your password";
  if (Object.keys(fieldErrors).length > 0) return { success: false, fieldErrors };
  return { success: true, data: { phone: canonicalPhone(phone), password } };
}

export function passwordError(raw) {
  const password = text(raw);
  if (!password) return "Choose a password";
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters`;
  if (password.length > PASSWORD_MAX) return `Keep it under ${PASSWORD_MAX} characters`;
  return undefined;
}

export function nameError(raw) {
  const name = text(raw).trim();
  if (!name) return "Enter your name";
  if (name.length > NAME_MAX) return `Keep the name to ${NAME_MAX} characters`;
  return undefined;
}

export const SIGN_UP_FIELDS = ["name", "phone", "password"];

export function validateSignUp(input) {
  const errors = {};
  const name = nameError(input?.name);
  const phone = phoneError(text(input?.phone));
  const password = passwordError(input?.password);
  if (name) errors.name = name;
  if (phone) errors.phone = phone;
  if (password) errors.password = password;
  return errors;
}

export function parseSignUp(input) {
  const fieldErrors = validateSignUp(input);
  if (Object.keys(fieldErrors).length > 0) return { success: false, fieldErrors };
  return {
    success: true,
    data: { name: input.name.trim(), phone: canonicalPhone(input.phone), password: input.password },
  };
}

export function safeReturnPath(next, fallback = "/appointments") {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || /[\\\s]/.test(next)) {
    return fallback;
  }
  try {
    const url = new URL(next, "http://hakim.invalid");
    if (url.origin !== "http://hakim.invalid") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
