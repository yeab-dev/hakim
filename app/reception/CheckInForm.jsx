"use client";

import PropTypes from "prop-types";
import { useActionState } from "react";
import { checkInAppointment } from "@/app/actions";

// One "Checked in" button per waiting patient. The role and clinic checks are
// inside checkInAppointment on the server — this only shows pending and the
// action's answer.
function CheckInForm({ appointmentId, patientName }) {
  const [state, formAction, pending] = useActionState(checkInAppointment, null);
  return (
    <form action={formAction} className="checkin">
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <button type="submit" className="button button--quiet" disabled={pending}>
        {pending ? "Saving…" : "Mark arrived"}
        <span className="visually-hidden"> — {patientName}</span>
      </button>
      {state?.error && (
        <p className="field__error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}

CheckInForm.propTypes = {
  appointmentId: PropTypes.string.isRequired,
  patientName: PropTypes.string.isRequired,
};

export default CheckInForm;
