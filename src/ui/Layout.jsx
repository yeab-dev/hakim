import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import "./Layout.css";

const TABS = [
  { to: "/", label: "Home", end: true },
  { to: "/clinics", label: "Find a clinic" },
  { to: "/appointments", label: "My appointments" },
];

// The frame every screen renders into. Built once; navigating swaps only
// what is in the <Outlet />.
function Layout() {
  const { user, signOut } = useAuth();

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" to="/">
          Hakim
        </Link>
        <nav aria-label="Main" className="nav">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => (isActive ? "nav__link nav__link--active" : "nav__link")}
            >
              {tab.label}
            </NavLink>
          ))}
          {user ? (
            <button type="button" className="nav__link nav__button" onClick={signOut}>
              Sign out {user.phone}
            </button>
          ) : (
            <NavLink to="/login" className="nav__link">
              Sign in
            </NavLink>
          )}
        </nav>
      </header>

      <main className="page">
        <Outlet />
      </main>

      <footer className="footer">
        <p>Hakim · book a doctor in Addis Ababa without the morning queue.</p>
      </footer>
    </div>
  );
}

export default Layout;
