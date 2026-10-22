import { Link, useSearchParams } from "react-router-dom";
import Placeholder from "../ui/Placeholder";

function Clinics() {
  // The filters live in the URL: /clinics?specialty=dentistry&area=bole is
  // shareable and survives a refresh.
  const [params] = useSearchParams();
  const specialty = params.get("specialty") ?? "any specialty";
  const area = params.get("area") ?? "any area";

  return (
    <>
      <h1>Clinics</h1>
      <p>
        Showing {specialty} in {area}.
      </p>
      <Placeholder needs="every clinic's name, area, specialties and soonest open slot" />
      {/* Temporary, until the list is fetched: proves the dynamic route. */}
      <p>
        <Link to="/clinics/bole-family-clinic">Example clinic</Link>
      </p>
    </>
  );
}

export default Clinics;
