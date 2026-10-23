"use client";

import PropTypes from "prop-types";
import { useAppointment } from "./useAppointment";

// The status row of the appointment page, kept current by polling (see
// useAppointment). Server-rendered first with the page's own data, so it is
// complete before any JavaScript runs.
function LiveStatus({ initial }) {
  const { data, error } = useAppointment(initial);
  const a = data.appointment;

  let queue = null;
  if (a.status === "booked" && a.queueAhead !== null && a.queueAhead !== undefined) {
    queue =
      a.queueAhead === 0
        ? `You are next for ${a.doctorName}.`
        : `${a.queueAhead} ${a.queueAhead === 1 ? "patient is" : "patients are"} booked ahead of you with ${a.doctorName} today.`;
  }

  return (
    <span className="live">
      <span className={`status status--${a.status}`}>{a.statusLabel}</span>
      {/* role=status: a screen reader hears the change when reception checks you in. */}
      <span role="status" className="live__text">
        {a.status === "arrived" && "Reception has checked you in."}
        {queue}
      </span>
      {a.live && !error && <span className="live__hint">Updates by itself every few seconds.</span>}
      {error && (
        <span className="live__hint">
          Could not refresh{error.status === 401 ? " — sign in again" : ""}. Showing the last known status.
        </span>
      )}
    </span>
  );
}

LiveStatus.propTypes = {
  initial: PropTypes.shape({
    id: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    statusLabel: PropTypes.string.isRequired,
    doctorName: PropTypes.string.isRequired,
    live: PropTypes.bool.isRequired,
    queueAhead: PropTypes.number,
  }).isRequired,
};

export default LiveStatus;
