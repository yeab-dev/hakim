import { Link } from "react-router-dom";
import Placeholder from "../ui/Placeholder";

function Appointments() {
  return (
    <>
      <h1>My appointments</h1>
      <Placeholder needs="the signed-in user's appointments, upcoming first" />
      <p>
        <Link to="/appointments/HK-1001">Example appointment</Link>
      </p>
    </>
  );
}

export default Appointments;
