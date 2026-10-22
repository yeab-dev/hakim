"use client";

import PropTypes from "prop-types";
import { useActionState, useState } from "react";
import { cancelAppointment } from "@/app/actions";

// The cancel button, with a "are you sure?" step. A client component for that
// one piece of state and the pending flag. The permission check is not here —
// it is inside cancelAppointment, on the server.
function CancelForm({ appointmentId }) {
  const [state, formAction, pending] = useActionState(cancelAppointment, null);
  const [confirming, setConfirming] = useState(false);

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
  appointmentId: PropTypes.string.isRequired,
};

export default CancelForm;
