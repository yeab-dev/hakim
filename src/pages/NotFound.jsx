import { Link, useLocation } from "react-router-dom";

function NotFound() {
  const { pathname } = useLocation();
  return (
    <>
      <h1>Nothing at this address</h1>
      <p>
        There is no page at <code>{pathname}</code>.
      </p>
      <p>
        <Link to="/clinics">Find a clinic</Link> or <Link to="/">go home</Link>.
      </p>
    </>
  );
}

export default NotFound;
