"use client";

import PropTypes from "prop-types";
import { useActionState, useRef, useState } from "react";
import { bookAppointment } from "@/app/actions";
import Field from "@/components/Field";
import { BOOKING_FIELDS, PHONE_HINT, REASON_MAX, validateBooking } from "@/lib/schema";

// The booking form — the only client component on the page. It owns the
// field values and which fields have been touched; the server action owns
// what happens next. Both use validateBooking() from lib/schema.js.
//
// It works without JavaScript too: the form posts to the action, and the page
// comes back with the action's errors and the values typed so far.
function BookingForm({ slotId, defaultPhone }) {
  const [state, formAction, pending] = useActionState(bookAppointment, null);
  const [values, setValues] = useState(() => ({
    patientName: state?.values?.patientName ?? "",
    phone: state?.values?.phone ?? defaultPhone ?? "",
    reason: state?.values?.reason ?? "",
    forSomeoneElse: state?.values?.forSomeoneElse ?? false,
  }));
  const [touched, setTouched] = useState({});
  const formRef = useRef(null);

  const clientErrors = validateBooking({ ...values, slotId });
  const errorFor = (field) => (touched[field] && clientErrors[field]) || state?.fieldErrors?.[field];

  function update(field) {
    return (event) => {
      const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
      setValues((v) => ({ ...v, [field]: value }));
    };
  }

  function touch(field) {
    return () => setTouched((t) => ({ ...t, [field]: true }));
  }

  function handleSubmit(event) {
    const firstBad = BOOKING_FIELDS.find((field) => clientErrors[field]);
    if (firstBad) {
      event.preventDefault();
      setTouched(Object.fromEntries(BOOKING_FIELDS.map((f) => [f, true])));
      formRef.current.elements[firstBad].focus();
    }
  }

  const reasonLeft = REASON_MAX - values.reason.trim().length;

  return (
    <form ref={formRef} className="form" action={formAction} onSubmit={handleSubmit} noValidate>
      {state?.formError && (
        <p className="banner banner--error" role="alert">
          {state.formError}
        </p>
      )}

      <input type="hidden" name="slotId" value={slotId} />

      <div className="check">
        <input
          id="forSomeoneElse"
          name="forSomeoneElse"
          type="checkbox"
          checked={values.forSomeoneElse}
          onChange={update("forSomeoneElse")}
        />
        <label htmlFor="forSomeoneElse">I am booking for someone else (a parent, a child, a relative)</label>
      </div>

      <Field
        name="patientName"
        label={values.forSomeoneElse ? "The patient's name" : "Your name"}
        hint={values.forSomeoneElse ? "The person the doctor will see." : undefined}
        error={errorFor("patientName")}
        autoComplete={values.forSomeoneElse ? "off" : "name"}
        value={values.patientName}
        onChange={update("patientName")}
        onBlur={touch("patientName")}
      />

      <Field
        name="phone"
        label="Mobile number for the clinic to call"
        hint={PHONE_HINT}
        error={errorFor("phone")}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={values.phone}
        onChange={update("phone")}
        onBlur={touch("phone")}
      />

      <Field
        as="textarea"
        name="reason"
        label="Reason for the visit"
        hint={reasonLeft >= 0 ? `A few words for the doctor. ${reasonLeft} characters left.` : "A few words for the doctor."}
        error={errorFor("reason")}
        rows={3}
        value={values.reason}
        onChange={update("reason")}
        onBlur={touch("reason")}
      />

      <p>
        <button type="submit" className="button" disabled={pending}>
          {pending ? "Booking…" : "Book this appointment"}
        </button>
      </p>
    </form>
  );
}

BookingForm.propTypes = {
  slotId: PropTypes.string.isRequired,
  defaultPhone: PropTypes.string,
};

export default BookingForm;
