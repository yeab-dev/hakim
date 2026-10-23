"use client";

import PropTypes from "prop-types";
import { useActionState, useEffect, useState } from "react";
import { cancelAppointment } from "@/app/actions";
import { useAppointment } from "./useAppointment";

// The cancel button, with a "are you sure?" step. A client component for that
// one piece of state and the pending flag. The permission check is not here —
// it is inside cancelAppointment, on the server.
//
// It reads the same SWR key as LiveStatus (one request serves both), so the
// button disappears by itself if reception checks the patient in while the
// page is open — and after a cancel it refreshes that key at once rather
// than waiting for the next poll.
function CancelForm({ initial }) {
  const [state, formAction, pending] = useActionState(cancelAppointment, null);
  const [confirming, setConfirming] = useState(false);
  const { data, mutate } = useAppointment(initial);
  const appointmentId = initial.id;

  useEffect(() => {
    if (state?.ok) mutate();
  }, [state, mutate]);

  if (!data.appointment.cancellable && !state?.error) return null;

  return (
    <form action={formAction} className="form">
      <input type="hidden" name="appointmentId" value={appointmentId} />
      {state?.error && (
        <p className="banner banner--error" role="alert">
          {state.error}
        </p>
      )}
      {confirming ? (
        <p>
          <strong>Cancel this booking?</strong> The time goes back to other patients.{" "}
          <button type="submit" className="button button--danger" disabled={pending}>
            {pending ? "Cancelling…" : "Yes, cancel it"}
          </button>{" "}
          <button type="button" className="button button--quiet" onClick={() => setConfirming(false)}>
            Keep it
          </button>
        </p>
      ) : (
        <p>
          {/* Without JavaScript this submits straight away; with it, it asks first. */}
          <button
            type="submit"
            className="button button--danger"
            onClick={(event) => {
              event.preventDefault();
              setConfirming(true);
            }}
          >
            Cancel this booking
          </button>
        </p>
      )}
    </form>
  );
}

CancelForm.propTypes = {
  initial: PropTypes.shape({ id: PropTypes.string.isRequired, cancellable: PropTypes.bool.isRequired }).isRequired,
};

export default CancelForm;
