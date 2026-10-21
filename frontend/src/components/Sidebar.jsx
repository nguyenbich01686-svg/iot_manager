import {
  History,
  LayoutDashboard,
  LogOut,
  RadioTower,
  UserRound,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

function Sidebar() {
  const {
    logout,
  } = useAuth();

  const navigate =
    useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside className="sidebar">

      <div className="brand">

        <h1>
          IOT Manager
        </h1>

        <span>
          Smart Room
        </span>

      </div>

      <nav>

        <NavLink
          to="/"
          end
          className="nav-link"
        >
          <LayoutDashboard
            size={19}
          />
          Dashboard
        </NavLink>

        <NavLink
          to="/sensors"
          className="nav-link"
        >
          <RadioTower
            size={19}
          />
          Data Sensors
        </NavLink>

        <NavLink
          to="/actions"
          className="nav-link"
        >
          <History
            size={19}
          />
          Action History
        </NavLink>

        <NavLink
          to="/profile"
          className="nav-link"
        >
          <UserRound
            size={19}
          />
          Profile
        </NavLink>

      </nav>

      <button
        className="logout-button"
        onClick={
          handleLogout
        }
      >
        <LogOut size={17} />
        Sign out
      </button>

      <div className="copyright">
        © 2026 IOT Manager
      </div>

    </aside>
  );
}

export default Sidebar;