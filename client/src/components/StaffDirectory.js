import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addVjtiLogoToPdf } from "../utils/logo";

const EMPTY_FORM = {
  name: "",
  empId: "",
  phone: "",
  email: "",
  department: "",
  designation: "",
};

// ─── Palette tokens ────────────────────────────────────────────────
const TOKEN = {
  teaching: {
    grad: "linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%)",
    accent: "#2563eb",
    soft: "#eff6ff",
    ring: "rgba(37,99,235,0.18)",
    badge: "#dbeafe",
    badgeTxt: "#1d4ed8",
    avatarBg: "#1e3a5f",
    avatarTxt: "#93c5fd",
  },
  nonteaching: {
    grad: "linear-gradient(135deg,#14532d 0%,#16a34a 100%)",
    accent: "#16a34a",
    soft: "#f0fdf4",
    ring: "rgba(22,163,74,0.18)",
    badge: "#dcfce7",
    badgeTxt: "#15803d",
    avatarBg: "#14532d",
    avatarTxt: "#86efac",
  },
};

// ─── Helpers ───────────────────────────────────────────────────────
const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

const fieldIcon = {
  empId: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="18" rx="2"/><path d="M8 7h8M8 11h5"/>
    </svg>
  ),
  department: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    </svg>
  ),
  phone: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
    </svg>
  ),
  email: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
};

const SortIcon = ({ active, dir }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={active ? "currentColor" : "#cbd5e1"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {dir === 1 || !active ? <path d="M12 5v14M5 12l7-7 7 7" opacity={active && dir === 1 ? 1 : 0.35}/> : null}
    {dir === -1 && active ? <path d="M12 19V5M5 12l7 7 7-7"/> : null}
    {!active && <><path d="M12 5v14" opacity="0.3"/><path d="M8 9l4-4 4 4M8 15l4 4 4-4" opacity="0.3"/></>}
  </svg>
);

// ─── Main Component ────────────────────────────────────────────────
export default function StaffDirectory({ type, title, subtitle, pdfName }) {
  const tok = type?.toLowerCase() === "teaching" ? TOKEN.teaching : TOKEN.nonteaching;
  const isTeaching = type?.toLowerCase() === "teaching";

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [sortCol, setSortCol] = useState("name");
  const [sortDir, setSortDir] = useState(1);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("table"); // "table" | "grid"
  const [animIn, setAnimIn] = useState(false);

  const user = JSON.parse(sessionStorage.getItem("user") || "null");
  const userRole = (user?.user?.role || user?.user?.type || "").toUpperCase();
  const canManage = userRole === "ADMIN" || userRole === "HOD";

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("https://staff-management-system-eluv.onrender.com/api/staff");
      setStaff(
        (res.data || []).filter(
          (s) => String(s.type || "").toLowerCase() === type.toLowerCase()
        )
      );
      setTimeout(() => setAnimIn(true), 60);
    } catch {
      setError("Failed to load staff data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const departments = useMemo(
    () => [...new Set(staff.map((s) => s.department).filter(Boolean))].sort(),
    [staff]
  );

  const filtered = useMemo(() => {
    let data = staff;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      data = data.filter((s) =>
        [s.name, s.empId, s.phone, s.email, s.designation, s.department].some((v) =>
          String(v || "").toLowerCase().includes(q)
        )
      );
    }
    if (deptFilter) data = data.filter((s) => s.department === deptFilter);
    if (sortCol) {
      data = [...data].sort((a, b) => {
        const av = String(a[sortCol] || "").toLowerCase();
        const bv = String(b[sortCol] || "").toLowerCase();
        return av < bv ? -sortDir : av > bv ? sortDir : 0;
      });
    }
    return data;
  }, [staff, searchQ, deptFilter, sortCol, sortDir]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => d * -1);
    else { setSortCol(col); setSortDir(1); }
  };

  const openEdit = (member) => {
    setEditing(member);
    setEditForm({
      name: member.name || "",
      empId: member.empId || "",
      phone: member.phone || "",
      email: member.email || "",
      department: member.department || "",
      designation: member.designation || "",
    });
    setError(null);
  };
  const closeEdit = () => { setEditing(null); setEditForm(EMPTY_FORM); };
  const updateEditField = (field, value) => setEditForm((p) => ({ ...p, [field]: value }));

  const saveEdit = async () => {
    if (!editing) return;
    if (!editForm.name.trim() || !editForm.empId.trim() || !editForm.phone.trim()) {
      setError("Name, Employee ID, and Phone are required.");
      return;
    }
    try {
      setSaving(true);
      await axios.put(`https://staff-management-system-eluv.onrender.com/api/staff/${editing._id}`, { ...editForm, type });
      closeEdit();
      await fetchStaff();
    } catch {
      setError("Failed to update staff member.");
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = async (member) => {
    if (!window.confirm(`Delete ${member.name} from ${title}?`)) return;
    try {
      await axios.delete(`https://staff-management-system-eluv.onrender.com/api/staff/${member._id}`);
      await fetchStaff();
    } catch {
      setError("Failed to delete staff member.");
    }
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    await addVjtiLogoToPdf(doc, { x: 14, y: 6, width: 20, height: 20 });
    doc.setFontSize(16);
    doc.text(`${title} Report`, 40, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 22);
    autoTable(doc, {
      head: [["Name", "Employee ID", "Phone", "Email", "Department", "Designation"]],
      body: filtered.map((s) => [s.name || "", s.empId || "", s.phone || "", s.email || "", s.department || "", s.designation || ""]),
      startY: 34,
      styles: { fontSize: 8, overflow: "linebreak" },
    });
    doc.text(`Total: ${filtered.length} staff`, 14, doc.lastAutoTable.finalY + 10);
    doc.save(pdfName);
  };

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="sd-root">
        <style>{css}</style>
        <div className="sd-loading">
          <div className="sd-spinner" style={{ "--clr": tok.accent }} />
          <p>Loading {title.toLowerCase()}…</p>
        </div>
      </div>
    );
  }

  const cols = [
    { key: "name", label: "Name" },
    { key: "department", label: "Department" },
    { key: "designation", label: "Designation" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
  ];

  return (
    <div className={`sd-root ${animIn ? "sd-anim-in" : ""}`}>
      <style>{css}</style>

      {/* ── Hero Banner ── */}
      <div className="sd-hero" style={{ background: tok.grad }}>
        <div className="sd-hero-inner">
          <div className="sd-hero-badge" style={{ background: "rgba(255,255,255,0.15)" }}>
            {isTeaching ? "Teaching" : "Non-Teaching"}
          </div>
          <h1 className="sd-hero-title">{title}</h1>
          <p className="sd-hero-sub">{subtitle}</p>
          <div className="sd-hero-stats">
            <div className="sd-hero-stat">
              <span className="sd-hero-stat-val">{staff.length}</span>
              <span className="sd-hero-stat-lbl">Total Staff</span>
            </div>
            <div className="sd-hero-divider" />
            <div className="sd-hero-stat">
              <span className="sd-hero-stat-val">{departments.length}</span>
              <span className="sd-hero-stat-lbl">Departments</span>
            </div>
            <div className="sd-hero-divider" />
            <div className="sd-hero-stat">
              <span className="sd-hero-stat-val">{filtered.length}</span>
              <span className="sd-hero-stat-lbl">Showing</span>
            </div>
          </div>
        </div>
        <div className="sd-hero-deco" />
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="sd-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{error}</span>
          <button onClick={() => setError(null)}>Close</button>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="sd-toolbar">
        <div className="sd-search-wrap">
          <svg className="sd-search-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="sd-search"
            type="text"
            placeholder="Search name, ID, phone, email, designation…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            style={{ "--ring": tok.ring, "--acc": tok.accent }}
          />
          {searchQ && (
            <button className="sd-search-clear" onClick={() => setSearchQ("")}>Close</button>
          )}
        </div>

        <select
          className="sd-select"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          style={{ "--ring": tok.ring, "--acc": tok.accent }}
        >
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        <div className="sd-view-toggle">
          {["table", "grid"].map((v) => (
            <button
              key={v}
              className={`sd-view-btn ${view === v ? "active" : ""}`}
              onClick={() => setView(v)}
              style={view === v ? { background: tok.accent, color: "#fff" } : {}}
              title={v === "table" ? "Table View" : "Card View"}
            >
              {v === "table" ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              )}
            </button>
          ))}
        </div>

        <button className="sd-pdf-btn" onClick={generatePDF} style={{ background: tok.grad }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          Export PDF
        </button>
      </div>

      {/* ── Dept Chips ── */}
      {departments.length > 0 && (
        <div className="sd-chips">
          <button
            className={`sd-chip ${deptFilter === "" ? "active" : ""}`}
            onClick={() => setDeptFilter("")}
            style={deptFilter === "" ? { background: tok.accent, color: "#fff", borderColor: tok.accent } : { "--acc": tok.accent }}
          >
            All
          </button>
          {departments.map((d) => (
            <button
              key={d}
              className={`sd-chip ${deptFilter === d ? "active" : ""}`}
              onClick={() => setDeptFilter(deptFilter === d ? "" : d)}
              style={deptFilter === d ? { background: tok.accent, color: "#fff", borderColor: tok.accent } : { "--acc": tok.accent }}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {/* ── Grid View ── */}
      {view === "grid" && (
        <div className="sd-grid">
          {filtered.length === 0 ? (
            <div className="sd-empty-full">
              <div className="sd-empty-ico">🔍</div>
              <p>No staff found matching your filters.</p>
            </div>
          ) : (
            filtered.map((s, i) => (
              <article
                key={s._id}
                className="sd-card"
                style={{ "--delay": `${i * 40}ms`, "--ring": tok.ring }}
              >
                <div className="sd-card-top" style={{ background: tok.grad }}>
                  <div className="sd-card-avatar" style={{ background: tok.avatarBg, color: tok.avatarTxt }}>
                    {initials(s.name)}
                  </div>
                  <div className="sd-card-badge" style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
                    {s.designation || "Staff"}
                  </div>
                </div>
                <div className="sd-card-body">
                  <h3 className="sd-card-name">{s.name || "Unnamed"}</h3>
                  <div className="sd-card-meta">
                    {[
                      { icon: fieldIcon.empId, val: s.empId, fallback: "—" },
                      { icon: fieldIcon.department, val: s.department, fallback: "—" },
                      { icon: fieldIcon.phone, val: s.phone, fallback: "—" },
                      { icon: fieldIcon.email, val: s.email, fallback: "—" },
                    ].map(({ icon, val, fallback }, idx) => (
                      <div key={idx} className="sd-card-row">
                        <span className="sd-card-row-ico" style={{ color: tok.accent }}>{icon}</span>
                        <span className="sd-card-row-val">{val || fallback}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {canManage && (
                  <div className="sd-card-actions">
                    <button
                      className="sd-btn-edit"
                      style={{ color: tok.accent, borderColor: tok.soft, background: tok.soft }}
                      onClick={() => openEdit(s)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                    </button>
                    <button className="sd-btn-del" onClick={() => deleteMember(s)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                      Delete
                    </button>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      )}

      {/* ── Table View ── */}
      {view === "table" && (
        <div className="sd-table-wrap">
          <table className="sd-table">
            <thead>
              <tr>
                {cols.map(({ key, label }) => (
                  <th key={key} onClick={() => handleSort(key)} className={sortCol === key ? "sd-th-active" : ""} style={{ "--acc": tok.accent }}>
                    <div className="sd-th-inner">
                      {label}
                      <SortIcon active={sortCol === key} dir={sortDir} />
                    </div>
                  </th>
                ))}
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="sd-empty">
                    <div className="sd-empty-ico">🔍</div>
                    <p>No staff found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => (
                  <tr key={s._id} className="sd-tr" style={{ "--delay": `${i * 25}ms` }}>
                    <td>
                      <div className="sd-person">
                        <div className="sd-avatar" style={{ background: tok.soft, color: tok.accent }}>
                          {initials(s.name)}
                        </div>
                        <div>
                          <div className="sd-person-name">{s.name}</div>
                          <div className="sd-person-id">{s.empId || "No ID"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {s.department ? (
                        <span className="sd-dept-chip" style={{ background: tok.badge, color: tok.badgeTxt }}>
                          {s.department}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="sd-desig">{s.designation || "—"}</td>
                    <td className="sd-contact">{s.phone || "—"}</td>
                    <td className="sd-contact sd-email">{s.email || "—"}</td>
                    {canManage && (
                      <td>
                        <div className="sd-row-actions">
                          <button
                            className="sd-btn-edit"
                            style={{ color: tok.accent, borderColor: tok.soft, background: tok.soft }}
                            onClick={() => openEdit(s)}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Edit
                          </button>
                          <button className="sd-btn-del" onClick={() => deleteMember(s)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="sd-table-foot">
            <span>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
            <span style={{ color: tok.accent, fontWeight: 600 }}>{title}</span>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editing && (
        <div className="sd-backdrop" onClick={(e) => e.target === e.currentTarget && closeEdit()}>
          <div className="sd-modal" style={{ "--acc": tok.accent, "--ring": tok.ring }}>
            <div className="sd-modal-head" style={{ background: tok.grad }}>
              <div className="sd-modal-avatar" style={{ background: "rgba(255,255,255,0.15)" }}>
                {initials(editing.name)}
              </div>
              <div>
                <div className="sd-modal-title">Edit Staff Member</div>
                <div className="sd-modal-sub">{editing.name}</div>
              </div>
              <button className="sd-modal-close" onClick={closeEdit}>Close</button>
            </div>

            {error && (
              <div className="sd-modal-error">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <div className="sd-modal-body">
              {[
                { key: "name", label: "Full Name", placeholder: "e.g. Dr. Anita Sharma", required: true },
                { key: "empId", label: "Employee ID", placeholder: "e.g. EMP-2024-001", required: true },
                { key: "phone", label: "Phone Number", placeholder: "e.g. +91 98765 43210", required: true },
                { key: "email", label: "Email Address", placeholder: "e.g. anita@vjti.ac.in" },
                { key: "department", label: "Department", placeholder: "e.g. Computer Engineering" },
                { key: "designation", label: "Designation", placeholder: "e.g. Associate Professor" },
                
              ].map(({ key, label, placeholder, required }) => (
                <label key={key} className="sd-field">
                  <span className="sd-field-label">
                    {label}
                    {required && <em>*</em>}
                  </span>
                  <input
                    className="sd-field-input"
                    value={editForm[key]}
                    placeholder={placeholder}
                    onChange={(e) => updateEditField(key, e.target.value)}
                  />
                </label>
              ))}
            </div>

            <div className="sd-modal-foot">
              <button className="sd-btn-cancel" onClick={closeEdit}>Cancel</button>
              <button
                className="sd-btn-save"
                style={{ background: tok.grad }}
                onClick={saveEdit}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="sd-mini-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CSS ────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .sd-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    min-height: 100vh;
    background: #f8fafc;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.4s ease, transform 0.4s ease;
  }
  .sd-root.sd-anim-in {
    opacity: 1;
    transform: translateY(0);
  }

  /* Loading */
  .sd-loading {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 16px; padding: 6rem 2rem;
    color: #64748b; font-size: 14px;
  }
  .sd-spinner {
    width: 36px; height: 36px; border-radius: 50%;
    border: 3px solid #e2e8f0;
    border-top-color: var(--clr);
    animation: sd-spin 0.75s linear infinite;
  }
  @keyframes sd-spin { to { transform: rotate(360deg); } }

  /* Hero */
  .sd-hero {
    position: relative; overflow: hidden;
    padding: 2.5rem 2rem 2rem;
    border-radius: 0 0 24px 24px;
    margin-bottom: 1.5rem;
    color: #fff;
  }
  .sd-hero-inner { position: relative; z-index: 1; }
  .sd-hero-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; border-radius: 20px;
    font-size: 12px; font-weight: 700; letter-spacing: 0.4px;
    margin-bottom: 10px;
  }
  .sd-hero-title {
    margin: 0 0 4px; font-size: 26px; font-weight: 800;
    letter-spacing: -0.5px; line-height: 1.2;
  }
  .sd-hero-sub {
    margin: 0 0 20px; font-size: 14px; opacity: 0.8;
  }
  .sd-hero-stats {
    display: flex; align-items: center; gap: 0;
    background: rgba(255,255,255,0.12); backdrop-filter: blur(6px);
    border-radius: 14px; padding: 14px 20px;
    width: fit-content; gap: 24px;
  }
  .sd-hero-stat { text-align: center; }
  .sd-hero-stat-val { display: block; font-size: 22px; font-weight: 800; line-height: 1; }
  .sd-hero-stat-lbl { display: block; font-size: 11px; opacity: 0.75; margin-top: 3px; font-weight: 500; }
  .sd-hero-divider { width: 1px; height: 32px; background: rgba(255,255,255,0.25); }
  .sd-hero-deco {
    position: absolute; right: -60px; top: -60px;
    width: 280px; height: 280px; border-radius: 50%;
    background: rgba(255,255,255,0.07);
  }

  /* Error */
  .sd-error {
    display: flex; align-items: center; gap: 10px;
    margin: 0 1.5rem 1rem; padding: 12px 16px;
    border-radius: 12px; border: 1px solid #fca5a5;
    background: #fff1f1; color: #b91c1c; font-size: 13px;
  }
  .sd-error button {
    margin-left: auto; background: none; border: none;
    color: #b91c1c; font-weight: 700; cursor: pointer; font-size: 14px;
  }

  /* Toolbar */
  .sd-toolbar {
    display: flex; align-items: center; gap: 10px;
    padding: 0 1.5rem 1rem; flex-wrap: wrap;
  }
  .sd-search-wrap {
    flex: 1; min-width: 240px; position: relative; display: flex; align-items: center;
  }
  .sd-search-ico {
    position: absolute; left: 12px; color: #94a3b8; pointer-events: none;
  }
  .sd-search {
    width: 100%; padding: 10px 36px 10px 36px; font-size: 13px;
    border: 1.5px solid #e2e8f0; border-radius: 10px; outline: none;
    background: #fff; font-family: inherit; color: #1e293b;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .sd-search:focus {
    border-color: var(--acc);
    box-shadow: 0 0 0 3px var(--ring);
  }
  .sd-search-clear {
    position: absolute; right: 10px; background: none; border: none;
    color: #94a3b8; cursor: pointer; font-size: 13px; line-height: 1; padding: 2px 4px;
  }
  .sd-search-clear:hover { color: #475569; }
  .sd-select {
    padding: 10px 12px; font-size: 13px; font-family: inherit;
    border: 1.5px solid #e2e8f0; border-radius: 10px;
    background: #fff; color: #1e293b; cursor: pointer; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .sd-select:focus {
    border-color: var(--acc);
    box-shadow: 0 0 0 3px var(--ring);
  }
  .sd-view-toggle {
    display: flex; gap: 3px; background: #f1f5f9;
    padding: 3px; border-radius: 9px;
  }
  .sd-view-btn {
    border: none; cursor: pointer; padding: 7px 9px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    background: transparent; color: #64748b;
    transition: background 0.2s, color 0.2s;
  }
  .sd-view-btn:hover:not(.active) { background: #e2e8f0; }
  .sd-pdf-btn {
    display: flex; align-items: center; gap: 7px;
    border: none; border-radius: 10px; color: #fff;
    padding: 10px 16px; font-size: 13px; font-weight: 700;
    cursor: pointer; font-family: inherit;
    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    transition: filter 0.2s, box-shadow 0.2s;
  }
  .sd-pdf-btn:hover { filter: brightness(1.1); box-shadow: 0 4px 18px rgba(0,0,0,0.22); }

  /* Dept Chips */
  .sd-chips {
    display: flex; gap: 7px; padding: 0 1.5rem 1.25rem; flex-wrap: wrap;
  }
  .sd-chip {
    padding: 5px 13px; border-radius: 20px; font-size: 12px; font-weight: 600;
    border: 1.5px solid #e2e8f0; background: #fff; color: #475569;
    cursor: pointer; font-family: inherit;
    transition: all 0.18s ease;
  }
  .sd-chip:hover:not(.active) {
    border-color: var(--acc); color: var(--acc);
  }

  /* Grid */
  .sd-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px; padding: 0 1.5rem 2rem;
  }
  .sd-empty-full {
    grid-column: 1/-1; text-align: center; padding: 4rem 2rem;
    color: #94a3b8;
  }
  .sd-empty-ico { font-size: 2rem; margin-bottom: 8px; }
  .sd-empty-full p { font-size: 14px; margin: 0; }

  /* Card */
  .sd-card {
    border-radius: 16px; overflow: hidden; background: #fff;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 12px rgba(15,23,42,0.06);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    animation: sd-fadeslide 0.35s ease both;
    animation-delay: var(--delay, 0ms);
  }
  @keyframes sd-fadeslide {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .sd-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 28px rgba(15,23,42,0.12), 0 0 0 2px var(--ring);
  }
  .sd-card-top {
    position: relative; padding: 20px 16px 14px;
    display: flex; flex-direction: column; align-items: flex-start; gap: 10px;
  }
  .sd-card-avatar {
    width: 52px; height: 52px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 16px;
    border: 3px solid rgba(255,255,255,0.3);
  }
  .sd-card-badge {
    font-size: 11px; font-weight: 700; padding: 3px 9px;
    border-radius: 6px; letter-spacing: 0.3px;
  }
  .sd-card-body { padding: 12px 16px 4px; }
  .sd-card-name {
    margin: 0 0 10px; font-size: 15px; font-weight: 700; color: #0f172a;
  }
  .sd-card-meta { display: flex; flex-direction: column; gap: 7px; }
  .sd-card-row {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; color: #475569;
  }
  .sd-card-row-ico { flex-shrink: 0; }
  .sd-card-row-val {
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    font-weight: 500;
  }
  .sd-card-actions {
    display: flex; gap: 8px; padding: 12px 16px 14px;
    border-top: 1px solid #f1f5f9; margin-top: 8px;
  }

  /* Table */
  .sd-table-wrap {
    margin: 0 1.5rem 2rem; border: 1px solid #e2e8f0;
    border-radius: 16px; overflow: hidden; background: #fff;
    box-shadow: 0 2px 12px rgba(15,23,42,0.05);
  }
  .sd-table {
    width: 100%; border-collapse: collapse; table-layout: auto;
  }
  .sd-table th {
    padding: 11px 16px; font-size: 11px; font-weight: 700;
    color: #64748b; text-align: left; background: #f8fafc;
    border-bottom: 1px solid #e2e8f0; cursor: pointer;
    user-select: none; white-space: nowrap;
    letter-spacing: 0.5px; text-transform: uppercase;
  }
  .sd-table th:hover { background: #f1f5f9; }
  .sd-th-active { color: var(--acc) !important; }
  .sd-th-inner { display: flex; align-items: center; gap: 6px; }
  .sd-table td {
    padding: 12px 16px; font-size: 13px; color: #334155;
    border-bottom: 1px solid #f1f5f9; vertical-align: middle;
  }
  .sd-tr { animation: sd-fadeslide 0.3s ease both; animation-delay: var(--delay,0ms); }
  .sd-table tbody tr:hover td { background: #fafbff; }
  .sd-table tbody tr:last-child td { border-bottom: none; }

  .sd-person { display: flex; align-items: center; gap: 10px; }
  .sd-avatar {
    width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800;
  }
  .sd-person-name { font-weight: 700; font-size: 13px; color: #0f172a; }
  .sd-person-id { font-size: 11px; color: #94a3b8; margin-top: 1px; }
  .sd-dept-chip {
    font-size: 11px; font-weight: 700; padding: 3px 9px;
    border-radius: 6px; white-space: nowrap;
  }
  .sd-desig { font-weight: 500; white-space: nowrap; }
  .sd-contact { color: #475569; }
  .sd-email { color: #475569; font-size: 12px; }
  .sd-row-actions { display: flex; gap: 6px; }

  /* Shared Buttons */
  .sd-btn-edit {
    display: flex; align-items: center; gap: 5px;
    padding: 6px 11px; font-size: 12px; font-weight: 700;
    border-radius: 7px; border: 1px solid; cursor: pointer;
    font-family: inherit; transition: filter 0.15s;
    white-space: nowrap;
  }
  .sd-btn-edit:hover { filter: brightness(0.94); }
  .sd-btn-del {
    display: flex; align-items: center; gap: 5px;
    padding: 6px 11px; font-size: 12px; font-weight: 700;
    border-radius: 7px; border: 1px solid #fca5a5;
    background: #fff1f1; color: #dc2626;
    cursor: pointer; font-family: inherit; white-space: nowrap;
    transition: filter 0.15s;
  }
  .sd-btn-del:hover { filter: brightness(0.96); }
  .sd-empty td {
    text-align: center; padding: 3rem 2rem !important;
    color: #94a3b8 !important; font-size: 14px !important;
  }
  .sd-empty { text-align: center; padding: 3rem 2rem !important; color: #94a3b8; }
  .sd-table-foot {
    display: flex; justify-content: space-between; padding: 10px 16px;
    font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;
    background: #fafbfc;
  }

  /* Modal */
  .sd-backdrop {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(15,23,42,0.55); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    padding: 1.5rem;
    animation: sd-bdfade 0.2s ease;
  }
  @keyframes sd-bdfade { from { opacity: 0; } to { opacity: 1; } }
  .sd-modal {
    width: min(700px,100%); max-height: 92vh; overflow-y: auto;
    background: #fff; border-radius: 20px; overflow: hidden;
    box-shadow: 0 32px 80px rgba(15,23,42,0.35);
    animation: sd-modalin 0.25s cubic-bezier(0.34,1.56,0.64,1);
    overflow-y: auto;
  }
  @keyframes sd-modalin {
    from { opacity: 0; transform: scale(0.93) translateY(16px); }
    to   { opacity: 1; transform: scale(1)    translateY(0); }
  }
  .sd-modal-head {
    display: flex; align-items: center; gap: 14px;
    padding: 20px 22px; color: #fff;
  }
  .sd-modal-avatar {
    width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; font-weight: 800;
  }
  .sd-modal-title { font-size: 16px; font-weight: 800; }
  .sd-modal-sub { font-size: 12px; opacity: 0.8; margin-top: 1px; }
  .sd-modal-close {
    margin-left: auto; background: rgba(255,255,255,0.2); border: none;
    color: #fff; width: 30px; height: 30px; border-radius: 8px;
    cursor: pointer; font-size: 14px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s;
  }
  .sd-modal-close:hover { background: rgba(255,255,255,0.35); }
  .sd-modal-error {
    display: flex; align-items: center; gap: 8px;
    margin: 16px 22px 0; padding: 10px 14px; border-radius: 10px;
    background: #fff1f1; border: 1px solid #fca5a5;
    color: #b91c1c; font-size: 13px;
  }
  .sd-modal-body {
    padding: 20px 22px;
    display: grid; grid-template-columns: repeat(2,minmax(0,1fr));
    gap: 16px;
  }
  .sd-field { display: flex; flex-direction: column; gap: 6px; }
  .sd-field-label {
    font-size: 11px; font-weight: 800; color: #64748b;
    text-transform: uppercase; letter-spacing: 0.6px;
  }
  .sd-field-label em {
    font-style: normal; color: #ef4444; margin-left: 3px;
  }
  .sd-field-input {
    border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 13px;
    font-size: 13px; font-family: inherit; color: #0f172a; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .sd-field-input:focus {
    border-color: var(--acc);
    box-shadow: 0 0 0 3px var(--ring);
  }
  .sd-modal-foot {
    padding: 16px 22px; border-top: 1px solid #f1f5f9;
    display: flex; justify-content: flex-end; gap: 10px; background: #fafbfc;
  }
  .sd-btn-cancel {
    padding: 10px 18px; border-radius: 10px; border: 1.5px solid #e2e8f0;
    background: #fff; color: #475569; font-size: 13px; font-weight: 700;
    cursor: pointer; font-family: inherit; transition: border-color 0.2s;
  }
  .sd-btn-cancel:hover { border-color: #94a3b8; }
  .sd-btn-save {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 10px; border: none; color: #fff;
    font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit;
    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    transition: filter 0.2s;
  }
  .sd-btn-save:disabled { opacity: 0.65; cursor: wait; }
  .sd-btn-save:not(:disabled):hover { filter: brightness(1.1); }
  .sd-mini-spin {
    display: inline-block; width: 13px; height: 13px;
    border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff;
    border-radius: 50%; animation: sd-spin 0.65s linear infinite;
  }

  /* Responsive */
  @media (max-width: 860px) {
    .sd-hero { border-radius: 0 0 16px 16px; padding: 1.75rem 1.25rem 1.5rem; }
    .sd-hero-title { font-size: 20px; }
    .sd-hero-stats { gap: 14px; padding: 10px 14px; }
    .sd-toolbar { padding: 0 1rem 1rem; }
    .sd-chips { padding: 0 1rem 1rem; }
    .sd-grid { padding: 0 1rem 1.5rem; grid-template-columns: 1fr 1fr; }
    .sd-table-wrap { margin: 0 1rem 1.5rem; overflow-x: auto; }
    .sd-table { min-width: 740px; }
    .sd-modal-body { grid-template-columns: 1fr; }
  }
  @media (max-width: 560px) {
    .sd-grid { grid-template-columns: 1fr; }
    .sd-hero-stats { gap: 10px; }
  }
`;
