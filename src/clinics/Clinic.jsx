import { Link, useParams } from "react-router-dom";
import Placeholder from "../ui/Placeholder";

function Clinic() {
  const { clinicId } = useParams();

  return (
    <>
      <p>
        <Link to="/clinics">&larr; All clinics</Link>
      </p>
      <h1>Clinic: {clinicId}</h1>
      <Placeholder needs="this clinic, its doctors, and their open slots for the next 7 days" />
      {/* Temporary: proves the guarded booking route. */}
      <p>
        <Link to="/book/slot-101">Book an example slot</Link>
      </p>
    </>
  );
}

export default Clinic;
