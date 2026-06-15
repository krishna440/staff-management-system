import React, { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

const departments = [
  "Mathematics", "Science", "English", "History", "Geography",
  "Computer Science", "Physical Education", "Arts", "Music",
  "Administration", "Library", "Counseling", "Finance", "Security","MCA"
];

const initialForm = {
  name: "",
  phone: "",
  email: "",
  department: "",
  designation: "",
  type: "Teaching",
  empId: "",
  dateOfJoining: "",
  photo: null,
};

export default function AddStaff() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [avatar, setAvatar] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatar(ev.target.result);
        setForm(prev => ({ ...prev, photo: file }));
        if (errors.photo) setErrors(prev => ({ ...prev, photo: "" }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (form.phone.trim() && !/^\d{10}$/.test(form.phone)) e.phone = "Enter a valid 10-digit number";
    if (!form.designation.trim()) e.designation = "Designation is required";
    if (!form.type) e.type = "Teaching type is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setServerError("");
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("phone", form.phone);
      formData.append("email", form.email || "");
      formData.append("department", form.department);
      formData.append("designation", form.designation);
      formData.append("type", form.type);
      formData.append("empId", form.empId);
      formData.append("dateOfJoining", form.dateOfJoining || "");
      if (form.photo) formData.append("photo", form.photo);

      await API.post("/staff", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setSubmitted(true);
    } catch (err) {
      console.log(err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Server error (500). Please check your backend.";
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setForm(initialForm);
    setAvatar(null);
    setErrors({});
    setSubmitted(false);
    setServerError("");
  };

  if (submitted) {
    return (
      <div style={s.wrapper}>
        <style>{css}</style>
        <div style={s.card}>
          <div style={s.successWrap}>
            <div style={s.successRing}>
              <div style={s.successCheck}>✓</div>
            </div>
            <h2 style={s.successTitle}>Staff Added!</h2>
            <p style={s.successSub}><strong>{form.name}</strong> has been registered successfully.</p>
            <button style={s.btnPrimary} onClick={reset}>+ Add Another</button>
            <button style={s.btnSecondary} onClick={() => navigate("/")}>Go to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.wrapper}>
      <style>{css}</style>
      <div style={s.card}>

        {/* Header */}
        <div style={s.header}>
          
          <div>
            <h1 style={s.title}>Add New Staff</h1>
            <p style={s.subtitle}>Fill in the details below to register a staff member</p>
          </div>
          <button style={s.btnSecondary} onClick={() => navigate("/")}>Go to Dashboard</button>
        </div>

        <div style={s.body}>

          {/* Server Error Banner */}
          {serverError && (
            <div style={s.errorBanner}>
              
              <span>{serverError}</span>
              <button style={s.errorBannerClose} onClick={() => setServerError("")}>Close</button>
            </div>
          )}

          {/* Photo Upload */}
          <div style={s.avatarSection}>
            <label style={s.avatarWrap} className="avatar-upload">
              {avatar
                ? <img src={avatar} alt="staff" style={s.avatarImg} />
                : (
                  <div style={s.avatarPlaceholder}>
                    <span style={s.cameraIcon}></span>
                    <span style={s.uploadText}>Upload Photo</span>
                    <span style={s.uploadHint}>JPG or PNG</span>
                  </div>
                )}
              <input type="file" accept="image/*" onChange={handleAvatar} style={{ display: "none" }} />
            </label>
          </div>

          {/* Teaching Type Toggle */}
          <div style={s.field}>
            <label style={s.label}>Teaching Type <span style={s.req}>*</span></label>
            <div style={s.toggleGroup}>
              {["Teaching", "Non-Teaching"].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, type: t }))}
                  style={{ ...s.toggleBtn, ...(form.type === t ? s.toggleActive : {}) }}
                >
                  {t}
                </button>
              ))}
            </div>
            {errors.type && <span style={s.err}>{errors.type}</span>}
          </div>

          {/* Grid Fields */}
          <div style={s.grid}>

            <Field label="Full Name" error={errors.name} required>
              <input name="name" value={form.name} onChange={handleChange}
                placeholder="e.g. Ramesh Kumar"
                style={{ ...s.input, ...(errors.name ? s.inputErr : {}) }} />
            </Field>

            <Field label="Employee ID" error={errors.empId}>
              <input name="empId" value={form.empId} onChange={handleChange}
                placeholder="e.g. EMP-001"
                style={{ ...s.input, ...(errors.empId ? s.inputErr : {}) }} />
            </Field>

            <Field label="Date Of Joining" error={errors.dateOfJoining}>
              <input name="dateOfJoining" type="date" value={form.dateOfJoining} onChange={handleChange}
                style={{ ...s.input, ...(errors.dateOfJoining ? s.inputErr : {}) }} />
            </Field>

            <Field label="Phone Number" error={errors.phone}>
              <input name="phone" value={form.phone} onChange={handleChange}
                placeholder="10-digit mobile number" maxLength={10}
                style={{ ...s.input, ...(errors.phone ? s.inputErr : {}) }} />
            </Field>

            <Field label="Department" error={errors.department}>
              {/* FIX: select uses its own style object — no shorthand 'background' conflict */}
              <select name="department" value={form.department} onChange={handleChange}
                className={errors.department ? "select-err" : "select-normal"}
                style={s.selectField}>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.department && <span style={s.err}>{errors.department}</span>}
            </Field>

            <Field label="Designation" error={errors.designation} required>
              <input name="designation" value={form.designation} onChange={handleChange}
                placeholder="e.g. Senior Teacher"
                style={{ ...s.input, ...(errors.designation ? s.inputErr : {}) }} />
            </Field>

            <Field label="Email" error={errors.email}>
              <input name="email" value={form.email} onChange={handleChange}
                placeholder="abc@mc.vjti.ac.in"
                style={{ ...s.input, ...(errors.email ? s.inputErr : {}) }} />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div style={s.footer}>
          <button style={s.btnSecondary} onClick={reset} type="button">Reset</button>
          <button style={s.btnPrimary} onClick={handleSubmit} disabled={submitting} type="button">
            {submitting && <span className="spinner" />}
            {submitting ? "Saving..." : "✓ Add Staff Member"}
          </button>
        </div>

      </div>
    </div>
  );
}

function Field({ label, error, children, required = false }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label} {required && <span style={s.req}>*</span>}</label>
      {children}
      {error && <span style={s.err}>{error}</span>}
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  input, select, button { font-family: 'Plus Jakarta Sans', sans-serif !important; }
  input:focus, select:focus { outline: none !important; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important; }
  .avatar-upload { cursor: pointer; transition: transform .2s, box-shadow .2s; }
  .avatar-upload:hover { transform: scale(1.03); box-shadow: 0 8px 24px rgba(99,102,241,.25) !important; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; margin-right: 8px; vertical-align: middle; }
  @keyframes pop { from { opacity:0; transform:scale(.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }

  /* Select styles via class to avoid React inline style shorthand conflict */
  .select-normal {
    width: 100%; padding: 10px 36px 10px 14px;
    border: 1.5px solid #d1d5db; border-radius: 10px;
    font-size: 14px; color: #111827;
    background-color: #fff;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    appearance: none; transition: all .2s;
  }
  .select-err {
    width: 100%; padding: 10px 36px 10px 14px;
    border: 1.5px solid #ef4444; border-radius: 10px;
    font-size: 14px; color: #111827;
    background-color: #fff5f5;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    appearance: none; transition: all .2s;
  }
`;

const s = {
  wrapper: { minHeight: "100vh", background: "linear-gradient(135deg,#eef2ff 0%,#f0fdf4 100%)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", fontFamily: "'Plus Jakarta Sans', sans-serif" },
  card: { width: "100%", maxWidth: 680, backgroundColor: "#fff", borderRadius: 22, boxShadow: "0 12px 48px rgba(99,102,241,.13)", overflow: "hidden", animation: "pop .3s ease" },
  header: { background: "linear-gradient(135deg,#6366f1,#4f46e5)", padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 },
  headerEmoji: { fontSize: 36, background: "rgba(255,255,255,.15)", borderRadius: 14, width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  title: { margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" },
  subtitle: { margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,.75)" },
  body: { padding: "28px 32px" },
  errorBanner: { display: "flex", alignItems: "center", gap: 10, backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#b91c1c" },
  errorBannerIcon: { fontSize: 16, flexShrink: 0 },
  errorBannerClose: { marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#b91c1c", fontWeight: 700, padding: 0 },
  avatarSection: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 },
  avatarWrap: { width: 110, height: 110, borderRadius: "50%", border: "3px dashed #6366f1", backgroundColor: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: "0 4px 16px rgba(99,102,241,.15)" },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarPlaceholder: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  cameraIcon: { fontSize: 26 },
  uploadText: { fontSize: 12, fontWeight: 700, color: "#6366f1" },
  uploadHint: { fontSize: 10, color: "#9ca3af" },
  toggleGroup: { display: "flex", gap: 10 },
  toggleBtn: { flex: 1, padding: "10px 0", border: "1.5px solid #d1d5db", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer", backgroundColor: "#fff", transition: "all .2s" },
  toggleActive: { border: "1.5px solid #6366f1", backgroundColor: "#eef2ff", color: "#4338ca" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 20px" },
  field: { marginBottom: 16 },
  label: { display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: .6 },
  req: { color: "#ef4444" },
  input: { width: "100%", padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: 10, fontSize: 14, color: "#111827", backgroundColor: "#fff", transition: "all .2s" },
  selectField: { width: "100%" }, // minimal inline — actual styles via className
  inputErr: { borderColor: "#ef4444", backgroundColor: "#fff5f5" },
  err: { fontSize: 11, color: "#ef4444", marginTop: 4, display: "block" },
  footer: { display: "flex", justifyContent: "flex-end", gap: 12, padding: "18px 32px", backgroundColor: "#fafafa", borderTop: "1px solid #e5e7eb" },
  btnPrimary: { padding: "11px 26px", background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, boxShadow: "0 4px 14px rgba(99,102,241,.35)" },
  btnSecondary: { padding: "11px 20px", backgroundColor: "#fff", color: "#374151", border: "1.5px solid #d1d5db", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  successWrap: { padding: "60px 32px", textAlign: "center" },
  successRing: { width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 8px 24px rgba(16,185,129,.4)" },
  successCheck: { fontSize: 36, color: "#ea9c9c", fontWeight: 700 },
  successTitle: { fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 8px" },
  successSub: { color: "#6b7280", marginBottom: 28, fontSize: 14 },
};
