import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await axios.post("https://staff-management-system-eluv.onrender.com/api/auth/login", {
        email,
        password,
      });
      localStorage.removeItem("user");
      sessionStorage.setItem("user", JSON.stringify(res.data));
      navigate(res.data?.user?.mustChangePassword ? "/change-password" : "/");
    } catch (err) {
  setError(err.response?.data?.message || "Login failed");
} finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #f0f2f8;
        }

        /* ── LEFT PANEL ── */
        .login-left {
          width: 420px;
          min-width: 420px;
          background: #0b1120;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 44px;
          position: relative;
          overflow: hidden;
        }

        /* decorative circles */
        .login-left::before {
          content: '';
          position: absolute;
          top: -80px; left: -80px;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%);
          pointer-events: none;
        }
        .login-left::after {
          content: '';
          position: absolute;
          bottom: -100px; right: -80px;
          width: 320px; height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%);
          pointer-events: none;
        }

        .left-top {}
        .left-logo {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 56px;
        }
        .left-logo-img {
          width: 52px; height: 52px;
          background: #fff;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; padding: 4px; flex-shrink: 0;
        }
        .left-logo-img img { width: 100%; height: 100%; object-fit: contain; }
        .left-logo-text h2 {
          font-family: 'DM Serif Display', serif;
          font-size: 16px; color: #fff; font-weight: 400; line-height: 1.2;
        }
        .left-logo-text p {
          font-size: 10px; color: rgba(255,255,255,0.35);
          margin-top: 3px; letter-spacing: 0.6px; text-transform: uppercase;
        }

        .left-headline {
          font-family: 'DM Serif Display', serif;
          font-size: 36px; color: #fff; font-weight: 400;
          line-height: 1.25; margin-bottom: 18px;
        }
        .left-headline span {
          color: #818cf8;
        }
        .left-desc {
          font-size: 14px; color: rgba(255,255,255,0.45);
          line-height: 1.75; max-width: 300px;
        }

        .left-bottom {}
        .left-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 14px 18px;
        }
        .badge-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #10b981; flex-shrink: 0;
          box-shadow: 0 0 6px rgba(16,185,129,0.6);
        }
        .badge-text { font-size: 12px; color: rgba(255,255,255,0.55); line-height: 1.4; }
        .badge-text strong { color: rgba(255,255,255,0.85); font-weight: 600; }

        /* ── RIGHT PANEL ── */
        .login-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 32px;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 40px 40px 36px;
          animation: cardIn 0.45s ease forwards;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .card-eyebrow {
          font-size: 11px; font-weight: 600; letter-spacing: 0.8px;
          text-transform: uppercase; color: #6366f1; margin-bottom: 8px;
        }
        .card-title {
          font-family: 'DM Serif Display', serif;
          font-size: 28px; color: #0f172a; font-weight: 400; margin-bottom: 6px;
        }
        .card-sub {
          font-size: 13px; color: #94a3b8; margin-bottom: 32px; line-height: 1.5;
        }

        /* Fields */
        .field-group { display: flex; flex-direction: column; gap: 16px; margin-bottom: 12px; }

        .field-wrap { display: flex; flex-direction: column; gap: 6px; }
        .field-label {
          font-size: 12px; font-weight: 600; color: #475569; letter-spacing: 0.2px;
        }
        .field-input-row {
          display: flex; align-items: center;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 0 14px;
          transition: border-color 0.15s, background 0.15s;
          height: 46px;
        }
        .field-input-row:focus-within {
          border-color: #6366f1;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .field-input-row.error-ring {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.08);
        }
        .field-icon {
          flex-shrink: 0; margin-right: 10px; display: flex; align-items: center;
        }
        .field-icon svg {
          width: 16px; height: 16px;
          stroke: #94a3b8; fill: none; stroke-width: 1.8;
          stroke-linecap: round; stroke-linejoin: round;
        }
        .field-input-row input {
          flex: 1; border: none; background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; color: #0f172a; outline: none;
        }
        .field-input-row input::placeholder { color: #cbd5e1; }
        .toggle-pw {
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center; padding: 0; margin-left: 8px; flex-shrink: 0;
        }
        .toggle-pw svg {
          width: 16px; height: 16px;
          stroke: #94a3b8; fill: none; stroke-width: 1.8;
          stroke-linecap: round; stroke-linejoin: round;
        }

        /* Error message */
        .error-msg {
          display: flex; align-items: center; gap: 7px;
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 8px; padding: 10px 14px;
          font-size: 12.5px; color: #b91c1c;
          margin-bottom: 20px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .error-msg svg {
          width: 15px; height: 15px; flex-shrink: 0;
          stroke: #ef4444; fill: none; stroke-width: 2;
          stroke-linecap: round; stroke-linejoin: round;
        }

        /* Login button */
        .login-btn {
          width: 100%; height: 48px;
          background: #0f172a; color: #fff;
          border: none; border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 8px;
          letter-spacing: 0.2px;
        }
        .login-btn:hover:not(:disabled) { background: #1e293b; }
        .login-btn:active:not(:disabled) { transform: scale(0.98); }
        .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .spinner {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          animation: spin 0.65s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Footer */
        .card-footer {
          margin-top: 24px; padding-top: 20px;
          border-top: 1px solid #f1f5f9;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .footer-label { font-size: 11px; color: #94a3b8; }
        .footer-chip {
          background: #f1f5f9; border-radius: 6px;
          padding: 3px 10px; font-size: 11px; font-weight: 600; color: #475569;
        }
      `}</style>

      <div className="login-root">

        {/* ── LEFT PANEL ── */}
        <div className="login-left">
          <div className="left-top">
            <div className="left-logo">
              <div className="left-logo-img">
                <img
                  src="/vjtiLogo.png"
                  alt="VJTI logo"
                />
              </div>
              <div className="left-logo-text">
                <h2>VJTI Mumbai</h2>
                <p>Chargesheet Portal</p>
              </div>
            </div>

            <h1 className="left-headline">
              MCA Department<br />
              <span>Chargesheet</span><br />
              Management
            </h1>
            <p className="left-desc">
              Manage teaching &amp; non-teaching staff chargesheets,
              exam sheets, task assignments, and approvals — all in one place.
            </p>
          </div>

          <div className="left-bottom">
            <div className="left-badge">
              <span className="badge-dot" />
              <div className="badge-text">
                <strong>Veermata Jijabai Technological Institute</strong><br />
                Secured portal · MCA Dept. only
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="login-right">
          <div className="login-card">
            <div className="card-eyebrow">MCA Department</div>
            <div className="card-title">Welcome back</div>
            <div className="card-sub">
              Sign in with your institutional credentials to continue.
            </div>

            <div className="field-group">
              {/* Email */}
              <div className="field-wrap">
                <label className="field-label">Email address</label>
                <div className={`field-input-row${error ? " error-ring" : ""}`}>
                  <span className="field-icon">
                    <svg viewBox="0 0 24 24">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M2 7l10 7 10-7" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    placeholder="you@vjti.ac.in"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    onKeyDown={handleKeyDown}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="field-wrap">
                <label className="field-label">Password</label>
                <div className={`field-input-row${error ? " error-ring" : ""}`}>
                  <span className="field-icon">
                    <svg viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    onKeyDown={handleKeyDown}
                    autoComplete="current-password"
                  />
                  <button
                    className="toggle-pw"
                    onClick={() => setShowPassword((p) => !p)}
                    tabIndex={-1}
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="error-msg">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              className="login-btn"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Signing in…
                </>
              ) : (
                "Sign in →"
              )}
            </button>

            {/* Footer */}
            <div className="card-footer">
              <span className="footer-label">Authorized access only</span>
              <span className="footer-chip">VJTI · MCA Dept.</span>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default Login;   
