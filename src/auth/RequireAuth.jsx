import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

// Wraps the routes marked "Sign-in: Yes" in the route map. A signed-out
// visitor goes to /login, carrying where they were headed so Login can send
// them back.
function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

RequireAuth.propTypes = {
  children: PropTypes.node,
};

export default RequireAuth;
