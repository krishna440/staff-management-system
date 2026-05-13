import React, { useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://staff-management-system-eluv.onrender.com/api";

export default function ChangePassword() {
  const navigate = useNavigate();
  const stored = useMemo(() => JSON.parse(sessionStorage.getItem("user") || "null"), []);
  const email = stored?.user?.email || "";
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const requestOtp = async () => {
    try {
      setLoading("otp");
      setError("");
      setMessage("");
      await axios.post(`${API_BASE}/auth/request-password-otp`, { email }, { timeout: 22000 });
      setOtpSent(true);
      setMessage("OTP sent to your registered email.");
    } catch (err) {
      setError(err.response?.data?.message || "Email server took too long. Please check SMTP settings and try again.");
    } finally {
      setLoading("");
    }
  };

  const verifyOtp = async () => {
    try {
      setLoading("verify");
      setError("");
      setMessage("");
      await axios.post(`${API_BASE}/auth/verify-password-otp`, { email, otp });
      setOtpVerified(true);
      setMessage("OTP verified. Set your new password.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to verify OTP");
    } finally {
      setLoading("");
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading("change");
      setError("");
      setMessage("");
      const res = await axios.post(`${API_BASE}/auth/change-password`, { email, newPassword });
      sessionStorage.setItem("user", JSON.stringify({ user: res.data.user }));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to change password");
    } finally {
      setLoading("");
    }
  };

  const logout = () => {
    sessionStorage.removeItem("user");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <img src="/vjtiLogo.png" alt="VJTI" style={styles.logo} />
          <div>
            <div style={styles.eyebrow}>VJTI MCA Portal</div>
            <h1 style={styles.title}>Change password</h1>
          </div>
        </div>

        <p style={styles.copy}>
          First login requires a password change. We will verify your account with an OTP sent to {email}.
        </p>

        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.success}>{message}</div>}

        <button style={styles.primaryBtn} onClick={requestOtp} disabled={loading === "otp"}>
          {loading === "otp" ? "Sending OTP..." : otpSent ? "Resend OTP" : "Send OTP"}
        </button>

        {otpSent && (
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email OTP</label>
            <div style={styles.inlineRow}>
              <input
                style={styles.input}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
              />
              <button style={styles.secondaryBtn} onClick={verifyOtp} disabled={loading === "verify" || !otp}>
                {loading === "verify" ? "Checking..." : "Verify"}
              </button>
            </div>
          </div>
        )}

        {otpVerified && (
          <>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>New password</label>
              <input
                style={styles.input}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Confirm password</label>
              <input
                style={styles.input}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>
            <button style={styles.primaryBtn} onClick={changePassword} disabled={loading === "change"}>
              {loading === "change" ? "Updating..." : "Change Password"}
            </button>
          </>
        )}

        <button style={styles.linkBtn} onClick={logout}>Use another login</button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background: "#f0f4ff",
    fontFamily: "Inter, Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 460,
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 28,
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  logo: {
    width: 54,
    height: 54,
    objectFit: "contain",
    borderRadius: 12,
    background: "#eef2ff",
    padding: 6,
  },
  eyebrow: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: 800,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    margin: "4px 0 0",
    fontSize: 26,
    color: "#0f172a",
  },
  copy: {
    margin: "0 0 20px",
    color: "#64748b",
    lineHeight: 1.55,
    fontSize: 14,
  },
  fieldGroup: {
    display: "grid",
    gap: 7,
    marginTop: 16,
  },
  label: {
    color: "#334155",
    fontWeight: 700,
    fontSize: 13,
  },
  inlineRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 10,
  },
  input: {
    width: "100%",
    border: "1.5px solid #dbe3ef",
    borderRadius: 10,
    padding: "12px 13px",
    fontSize: 14,
    outline: "none",
  },
  primaryBtn: {
    width: "100%",
    border: "none",
    borderRadius: 10,
    background: "#0f172a",
    color: "#fff",
    padding: "13px 16px",
    fontWeight: 800,
    cursor: "pointer",
    marginTop: 10,
  },
  secondaryBtn: {
    border: "none",
    borderRadius: 10,
    background: "#4338ca",
    color: "#fff",
    padding: "0 18px",
    fontWeight: 800,
    cursor: "pointer",
  },
  linkBtn: {
    marginTop: 18,
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#475569",
    fontWeight: 700,
    cursor: "pointer",
  },
  error: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    borderRadius: 10,
    padding: "10px 12px",
    marginBottom: 12,
    fontSize: 13,
  },
  success: {
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#166534",
    borderRadius: 10,
    padding: "10px 12px",
    marginBottom: 12,
    fontSize: 13,
  },
};
