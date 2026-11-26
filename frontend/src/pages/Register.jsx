import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight } from "lucide-react";
import Logo from "../components/common/Logo";
import { registerUser } from "../redux/slices/authSlice.js";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { status, error } = useSelector((state) => state.auth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    const result = await dispatch(
      registerUser({
        name,
        email,
        password,
      })
    );

    if (registerUser.fulfilled.match(result)) {
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="auth-brand">
          <div className="brand-mark">
            <Logo size={20} />
          </div>

          <strong>StudyMitra AI</strong>
        </div>

        <div className="auth-visual-copy">
          <span className="hero-chip">
            YOUR STUDY WORKSPACE
          </span>

          <h1>
            Learn with more <em>clarity.</em>
          </h1>

          <p>
            Bring your notes, questions and academic workflow
            into one intelligent place.
          </p>
        </div>

        <div className="auth-glow" />
      </div>

      <div className="auth-form-side">
        <div className="auth-form-wrap">
          <span className="mobile-logo">STUDYMITRA AI</span>

          <h2>Create your account</h2>

          <p className="auth-subtitle">
            Set up your academic workspace in a minute.
          </p>

          <form onSubmit={submit} className="auth-form">
            <label>Full name</label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />

            <label>Email address</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
            />

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={status === "loading"}
            >
              {status === "loading" ? (
                "Creating..."
              ) : (
                <>
                  Create account
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/login">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}