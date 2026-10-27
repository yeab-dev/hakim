"use client";

import Link from "next/link";
import PropTypes from "prop-types";
import { useState } from "react";

function DoctorSlots({ doctorId, doctorName, week }) {
  const firstOpen = week.find((day) => day.slots.length > 0);
  const [selected, setSelected] = useState(firstOpen ? firstOpen.date : week[0].date);
  const day = week.find((d) => d.date === selected) ?? week[0];
  const listId = `slots-${doctorId}`;

  if (!firstOpen) {
    return <p className="slots__none">No open times in the next seven days.</p>;
  }

  return (
    <div className="slots">
      <div className="slots__days" role="group" aria-label={`Days for ${doctorName}`}>
        {week.map((d) => (
          <button
            key={d.date}
            type="button"
            className="slots__day"
            aria-pressed={d.date === selected}
            aria-controls={listId}
            disabled={d.slots.length === 0}
            onClick={() => setSelected(d.date)}
          >
            <span>{d.label}</span>
            <span className="slots__count">{d.works ? `${d.slots.length} open` : "Off"}</span>
          </button>
        ))}
      </div>

      <ul id={listId} className="slots__times" aria-label={`Open times on ${day.label}`}>
        {day.slots.map((slot) => (
          <li key={slot.id}>
            <Link className="slot" href={`/book/${slot.id}`} prefetch={false}>
              <span className="visually-hidden">Book {day.label} at </span>
              {slot.time}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

DoctorSlots.propTypes = {
  doctorId: PropTypes.string.isRequired,
  doctorName: PropTypes.string.isRequired,
  week: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      works: PropTypes.bool.isRequired,
      slots: PropTypes.arrayOf(
        PropTypes.shape({ id: PropTypes.string.isRequired, time: PropTypes.string.isRequired }),
      ).isRequired,
    }),
  ).isRequired,
};

export default DoctorSlots;
