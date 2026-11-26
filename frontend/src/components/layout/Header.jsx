import { Bell, Search } from "lucide-react";
import { useSelector } from "react-redux";

export default function Header() {
  const user = useSelector((state) => state.auth.user);
  const name = user?.name || "Student";

  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={17} />
        <input placeholder="Search your workspace..." />
        <kbd>⌘ K</kbd>
      </div>

      <div className="topbar-actions">
        <button className="icon-button" aria-label="Notifications">
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

        <div className="profile-mini">
          <div className="avatar">{name.charAt(0).toUpperCase()}</div>
          <div className="profile-mini-text">
            <strong>{name}</strong>
            <span>Student</span>
          </div>
        </div>
      </div>
    </header>
  );
}