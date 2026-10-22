import { Link, useParams } from "react-router-dom";
import Placeholder from "../ui/Placeholder";

function Appointment() {
  const { appointmentId } = useParams();

  return (
    <>
      <p>
        <Link to="/appointments">&larr; My appointments</Link>
      </p>
      <h1>Appointment {appointmentId}</h1>
      <Placeholder needs="this appointment by id (only if it is yours), and a cancel action" />
    </>
  );
}

export default Appointment;
