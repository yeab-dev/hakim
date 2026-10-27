import Link from "next/link";
import PropTypes from "prop-types";

function ClinicCard({ clinic }) {
  return (
    <article className="card">
      <h2 className="card__title">
        <Link className="card-title-link" href={`/clinics/${clinic.id}`}>{clinic.name}</Link>
      </h2>
      <p className="card__meta">
        {clinic.areaName} · {clinic.address}
      </p>
      <ul className="chips chips--small" aria-label="Specialties">
        {clinic.specialties.map((s) => (
          <li key={s.id} className="chip chip--static">
            {s.name}
          </li>
        ))}
      </ul>
      <p className="card__soonest">
        {clinic.soonest ? (
          <>
            Soonest open slot: <strong>{clinic.soonest.label}</strong> with {clinic.soonest.doctorName}
          </>
        ) : (
          "No open slots in the next seven days."
        )}
      </p>
    </article>
  );
}

ClinicCard.propTypes = {
  clinic: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    areaName: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    specialties: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, name: PropTypes.string })).isRequired,
    soonest: PropTypes.shape({ label: PropTypes.string, doctorName: PropTypes.string }),
  }).isRequired,
};

export default ClinicCard;
