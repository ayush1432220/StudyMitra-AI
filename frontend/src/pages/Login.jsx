import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight } from "lucide-react";
import Logo from "../components/common/Logo";
import { loginUser } from "../redux/slices/authSlice.js";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { status, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    const result = await dispatch(
      loginUser({
        email,
        password,
      })
    );

    if (loginUser.fulfilled.match(result)) {
      navigate(
        location.state?.from?.pathname || "/dashboard",
        { replace: true }
      );
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
            AI ACADEMIC ASSISTANT
          </span>

          <h1>
            Make learning feel <em>less complicated.</em>
          </h1>

          <p>
            One focused workspace for your questions, documents
            and academic research.
          </p>
        </div>

        <div className="auth-glow" />
      </div>

      <div className="auth-form-side">
        <div className="auth-form-wrap">
          <span className="mobile-logo">STUDYMITRA AI</span>

          <h2>Welcome back</h2>

          <p className="auth-subtitle">
            Sign in to continue to your workspace.
          </p>

          <form onSubmit={submit} className="auth-form">
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
              placeholder="Enter your password"
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
                "Signing in..."
              ) : (
                <>
                  Sign in
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <p className="auth-switch">
            New to StudyMitra AI?{" "}
            <Link to="/register">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}