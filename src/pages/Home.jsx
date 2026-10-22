import { Link } from "react-router-dom";
import Placeholder from "../ui/Placeholder";

function Home() {
  return (
    <>
      <h1>See a doctor this week, without the morning queue</h1>
      <p>Find a clinic in Addis Ababa, pick an open slot, and book it in a minute.</p>
      <p>
        <Link to="/clinics">Find a clinic</Link>
      </p>
      <Placeholder needs="the list of specialties, each linking to /clinics?specialty=…" />
    </>
  );
}

export default Home;
