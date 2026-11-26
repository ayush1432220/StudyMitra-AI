import Logo from "../common/Logo";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  LayoutDashboard,
  MessageSquareText,
  Files,
  UserRound,
  LogOut,
  Sparkles,
  Settings,
} from "lucide-react";
import { logout } from "../../redux/slices/authSlice.js";

const links = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/chat", label: "AI Assistant", icon: MessageSquareText },
  { to: "/documents", label: "My Documents", icon: Files },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><Logo size={20} /></div>
        <div>
          <strong>StudyMitra AI</strong>
          <span>AI Study Companion</span>
        </div>
      </div>

      <div className="workspace-label">WORKSPACE</div>

      <nav className="nav-list">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-spacer" />

      <div className="sidebar-tip">
        <div className="tip-icon"><Sparkles size={15} /></div>
        <strong>Study smarter</strong>
        <p>Upload notes and ask StudyMitra AI anything about them.</p>
      </div>

      <button className="nav-item logout-button" onClick={handleLogout}>
        <LogOut size={18} />
        <span>Sign out</span>
      </button>

      <div className="sidebar-footer">
        <Settings size={15} />
        <span>Workspace</span>
      </div>
    </aside>
  );
}