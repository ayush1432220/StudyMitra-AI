import { useSelector } from "react-redux";
import { Mail, UserRound, ShieldCheck } from "lucide-react";
import react from 'react'

export default function Profile() {
  const user = useSelector((state) => state.auth.user);
  const name = user?.name || "Student";

  return (
    <div className="profile-page">
      <div className="page-heading">
        <div>
          <span className="section-kicker">ACCOUNT</span>
          <h1>Your profile</h1>
          <p>Manage your academic workspace identity.</p>
        </div>
      </div>

      <section className="profile-panel">
        <div className="profile-cover" />
        <div className="profile-body">
          <div className="profile-avatar">{name.charAt(0).toUpperCase()}</div>
          <div className="profile-main">
            <h2>{name}</h2>
            <p>{user?.email || "No email available"}</p>
          </div>
          <span className="verified"><ShieldCheck size={15} /> Active</span>
        </div>

        <div className="profile-fields">
          <div className="profile-field"><UserRound size={17} /><div><span>Full name</span><strong>{name}</strong></div></div>
          <div className="profile-field"><Mail size={17} /><div><span>Email address</span><strong>{user?.email || "Not available"}</strong></div></div>
        </div>
      </section>
    </div>
  );
}