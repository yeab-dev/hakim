import { Link, NavLink, Outlet } from "react-router-dom";
import "./Layout.css";

const TABS = [
  { to: "/", label: "Home", end: true },
  { to: "/clinics", label: "Find a clinic" },
  { to: "/appointments", label: "My appointments" },
];

// The frame every screen renders into. Built once; navigating swaps only
// what is in the <Outlet />.
function Layout() {
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
