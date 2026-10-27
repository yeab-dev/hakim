import Link from "next/link";
import PropTypes from "prop-types";
import { listClinics } from "@/lib/data";
import ClinicCard from "./ClinicCard";

async function ClinicList({ specialty, area, fail, slow }) {
  const clinics = await listClinics({ specialty, area, fail, slow });

  if (clinics.length === 0) {
    return (
      <div className="state" role="status">
        <p>
          <strong>No clinic matches that search.</strong> Try another area, or any specialty.
        </p>
        <p>
          <Link href="/clinics">Show every clinic</Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="count" role="status">
        {clinics.length === 1 ? "1 clinic" : `${clinics.length} clinics`}
      </p>
      <ul className="cards">
        {clinics.map((clinic) => (
          <li key={clinic.id}>
            <ClinicCard clinic={clinic} />
          </li>
        ))}
      </ul>
    </>
  );
}

ClinicList.propTypes = {
  specialty: PropTypes.string,
  area: PropTypes.string,
  fail: PropTypes.bool,
  slow: PropTypes.bool,
};

export default ClinicList;
