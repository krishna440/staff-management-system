import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { COURSE_CATALOG } from "../utils/courseCatalog";
import { loadSubjectCatalog, saveSubjectCatalog } from "../utils/subjectCatalogStorage";

const SUBJECT_CATALOG_CHANGED_EVENT = "mca-subject-catalog-changed";

const emptyForm = {
  semester: "Sem I",
  code: "",
  title: "",
  kind: "theory",
};

// ─── Tiny toast ──────────────────────────────────────────────────────────────
const Toast = ({ message, type, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [message, onDone]);
  if (!message) return null;
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      display: "flex", alignItems: "center", gap: 10,
      background: type === "error" ? "#450a0a" : "#052e16",
      color: type === "error" ? "#fca5a5" : "#86efac",
      border: `1px solid ${type === "error" ? "#7f1d1d" : "#14532d"}`,
      borderRadius: 14, padding: "13px 20px", fontSize: 13, fontWeight: 600,
      boxShadow: "0 20px 60px rgba(0,0,0,.55)",
      animation: "slideUp .25s cubic-bezier(.16,1,.3,1)",
    }}>
      <span style={{ fontSize: 16 }}>{type === "error" ? "⚠" : "✓"}</span>
      {message}
    </div>
  );
};

// ─── Stat pill ────────────────────────────────────────────────────────────────
const StatPill = ({ label, value, accent }) => (
  <div style={{
    display: "flex", flexDirection: "column", gap: 3,
    background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 12, padding: "10px 16px", minWidth: 80,
  }}>
    <span style={{ fontSize: 22, fontWeight: 800, color: accent, fontFamily: "'DM Mono', monospace, sans-serif", lineHeight: 1 }}>{value}</span>
    <span style={{ fontSize: 11, color: "rgba(255,255,255,.44)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</span>
  </div>
);

// ─── Field wrapper ────────────────────────────────────────────────────────────
const Field = ({ label, children, col }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 7, gridColumn: col }}>
    <label style={{
      fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
      color: "rgba(255,255,255,.45)",
    }}>{label}</label>
    {children}
  </div>
);

const inputStyle = {
  background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 10, padding: "11px 14px", fontSize: 13.5, color: "#fff",
  fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box",
  transition: "border-color .18s, box-shadow .18s",
};

const InputEl = ({ style, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        ...inputStyle,
        ...(focused ? {
          borderColor: "rgba(139,92,246,.7)",
          boxShadow: "0 0 0 3px rgba(139,92,246,.18)",
        } : {}),
        ...style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
    />
  );
};

const SelectEl = ({ style, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      style={{
        ...inputStyle,
        cursor: "pointer",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 7L11 1' stroke='rgba(255,255,255,.4)' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "calc(100% - 12px) center",
        paddingRight: 36,
        ...(focused ? {
          borderColor: "rgba(139,92,246,.7)",
          boxShadow: "0 0 0 3px rgba(139,92,246,.18)",
        } : {}),
        ...style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
    />
  );
};

// ─── Kind toggle ──────────────────────────────────────────────────────────────
const KindToggle = ({ value, onChange }) => (
  <div style={{
    display: "flex", background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, overflow: "hidden",
    height: 44,
  }}>
    {["theory", "lab"].map((k) => (
      <button
        key={k}
        type="button"
        onClick={() => onChange(k)}
        style={{
          flex: 1, border: 0, cursor: "pointer", fontFamily: "inherit",
          fontSize: 13, fontWeight: 700, transition: "all .2s",
          background: value === k
            ? k === "lab" ? "rgba(52,211,153,.18)" : "rgba(139,92,246,.22)"
            : "transparent",
          color: value === k
            ? k === "lab" ? "#34d399" : "#a78bfa"
            : "rgba(255,255,255,.35)",
          borderRight: k === "theory" ? "1px solid rgba(255,255,255,.08)" : 0,
          textTransform: "capitalize",
          letterSpacing: ".04em",
        }}
      >{k}</button>
    ))}
  </div>
);

// ─── Row chip (type badge) ─────────────────────────────────────────────────────
const TypeBadge = ({ kind }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em",
    padding: "4px 10px", borderRadius: 999,
    background: kind === "lab" ? "rgba(52,211,153,.12)" : "rgba(139,92,246,.12)",
    color: kind === "lab" ? "#34d399" : "#a78bfa",
    border: `1px solid ${kind === "lab" ? "rgba(52,211,153,.25)" : "rgba(139,92,246,.25)"}`,
  }}>
    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", flexShrink: 0 }} />
    {kind === "lab" ? "Lab" : "Theory"}
  </span>
);

// ─── Semester tab ─────────────────────────────────────────────────────────────
const SemTab = ({ sem, active, count, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      border: 0, cursor: "pointer", fontFamily: "inherit",
      padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 700,
      background: active ? "rgba(139,92,246,.22)" : "transparent",
      color: active ? "#c4b5fd" : "rgba(255,255,255,.38)",
      transition: "all .18s",
      display: "flex", alignItems: "center", gap: 7,
      whiteSpace: "nowrap",
    }}
  >
    {sem}
    <span style={{
      fontSize: 11, fontWeight: 800, padding: "2px 7px", borderRadius: 999,
      background: active ? "rgba(167,139,250,.22)" : "rgba(255,255,255,.07)",
      color: active ? "#c4b5fd" : "rgba(255,255,255,.28)",
    }}>{count}</span>
  </button>
);

// ─── Main component ───────────────────────────────────────────────────────────
const AddSubject = () => {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState(() => loadSubjectCatalog(COURSE_CATALOG));
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [search, setSearch] = useState("");
  const [activeSem, setActiveSem] = useState("Sem I");
  const [hoveredRow, setHoveredRow] = useState(null);
  const formRef = useRef(null);

  const semesters = useMemo(() => Object.keys(catalog), [catalog]);

  const totalSubjects = useMemo(() =>
    Object.values(catalog).reduce((s, arr) => s + (arr?.length || 0), 0), [catalog]);
  const totalLabs = useMemo(() =>
    Object.values(catalog).reduce((s, arr) =>
      s + (arr?.filter(c => c.kind === "lab").length || 0), 0), [catalog]);

  const visibleCourses = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (catalog[activeSem] || []).filter((course) => {
      if (!term) return true;
      return `${course.code} ${course.title} ${course.kind === "lab" ? "lab" : "theory"}`
        .toLowerCase().includes(term);
    });
  }, [catalog, activeSem, search]);

  const updateForm = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const persist = (next) => {
    const saved = saveSubjectCatalog(next);
    setCatalog(saved);
    window.dispatchEvent(new Event(SUBJECT_CATALOG_CHANGED_EVENT));
  };

  const resetForm = () => { setForm(emptyForm); setEditing(null); };

  const showToast = (message, type = "success") => setToast({ message, type });

  const saveSubject = () => {
    const semester = form.semester;
    const code = form.code.trim().toUpperCase();
    const title = form.title.trim();
    if (!semester || !code || !title) {
      showToast("Please fill in all fields.", "error");
      return;
    }
    const nextCourse = { code, title, ...(form.kind === "lab" ? { kind: "lab" } : {}) };
    const next = { ...catalog };
    if (editing && editing.semester !== semester)
      next[editing.semester] = (next[editing.semester] || []).filter(c => c.code !== editing.code);
    next[semester] = [
      ...(next[semester] || []).filter(c => c.code !== (editing?.code || code)),
      nextCourse,
    ];
    persist(next);
    setActiveSem(semester);
    resetForm();
    showToast(editing ? "Subject updated successfully." : "Subject added.");
  };

  const editSubject = (semester, course) => {
    setEditing({ semester, code: course.code });
    setForm({ semester, code: course.code, title: course.title, kind: course.kind === "lab" ? "lab" : "theory" });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const deleteSubject = (semester, course) => {
    if (!window.confirm(`Delete "${course.code} – ${course.title}"?`)) return;
    persist({ ...catalog, [semester]: (catalog[semester] || []).filter(i => i.code !== course.code) });
    if (editing?.semester === semester && editing?.code === course.code) resetForm();
    showToast("Subject deleted.");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0b0b12",
      color: "#fff",
      fontFamily: "'Geist', 'DM Sans', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(8px);  } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::selection { background: rgba(139,92,246,.35); color: #fff; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 99px; }
        option { background: #1a1a2e; color: #fff; }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,11,18,.85)", backdropFilter: "blur(18px) saturate(1.4)",
        borderBottom: "1px solid rgba(255,255,255,.07)",
        padding: "0 32px",
        display: "flex", alignItems: "center", gap: 16, height: 62,
      }}>
        <button
          type="button"
          onClick={() => navigate("/")}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 9, padding: "7px 13px", color: "rgba(255,255,255,.7)",
            cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600,
            transition: "all .18s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.1)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.06)"}
        >
          ← Dashboard
        </button>

        <div style={{
          width: 1, height: 24, background: "rgba(255,255,255,.1)", flexShrink: 0,
        }} />

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-.02em" }}>Subject Manager</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,.35)", fontWeight: 500 }}>MCA Curriculum</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <StatPill label="Total" value={totalSubjects} accent="#a78bfa" />
          <StatPill label="Labs" value={totalLabs} accent="#34d399" />
          <StatPill label="Semesters" value={semesters.length} accent="#60a5fa" />
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 28px 80px" }}>

        {/* ── Form card ── */}
        <div
          ref={formRef}
          style={{
            background: "linear-gradient(135deg, rgba(139,92,246,.1) 0%, rgba(30,27,75,.3) 50%, rgba(11,11,18,0) 100%)",
            border: "1px solid rgba(139,92,246,.25)",
            borderRadius: 20, marginBottom: 28, overflow: "hidden",
            animation: "fadeIn .35s cubic-bezier(.16,1,.3,1)",
          }}
        >
          {/* card header */}
          <div style={{
            padding: "18px 24px 16px",
            borderBottom: "1px solid rgba(255,255,255,.06)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: editing ? "rgba(250,204,21,.15)" : "rgba(139,92,246,.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, border: `1px solid ${editing ? "rgba(250,204,21,.3)" : "rgba(139,92,246,.3)"}`,
              }}>
                {editing ? "✎" : "+"}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>
                  {editing ? "Edit Subject" : "Add New Subject"}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.38)", marginTop: 1 }}>
                  {editing ? `Editing ${editing.code}` : "Fill in the details below"}
                </div>
              </div>
            </div>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)",
                  borderRadius: 8, padding: "7px 13px", color: "rgba(255,255,255,.55)",
                  cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700,
                }}
              >✕ Cancel</button>
            )}
          </div>

          {/* form body */}
          <div style={{ padding: "22px 24px" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "minmax(140px,160px) minmax(140px,180px) 1fr minmax(140px,160px) auto",
              gap: 14, alignItems: "end",
            }}>
              <Field label="Semester">
                <SelectEl
                  value={form.semester}
                  onChange={e => updateForm("semester", e.target.value)}
                >
                  {semesters.map(s => <option key={s}>{s}</option>)}
                </SelectEl>
              </Field>

              <Field label="Course Code">
                <InputEl
                  value={form.code}
                  onChange={e => updateForm("code", e.target.value)}
                  placeholder="R5MC5021P"
                  style={{ fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}
                />
              </Field>

              <Field label="Subject Name">
                <InputEl
                  value={form.title}
                  onChange={e => updateForm("title", e.target.value)}
                  placeholder="e.g. Advanced Algorithms"
                />
              </Field>

              <Field label="Type">
                <KindToggle value={form.kind} onChange={v => updateForm("kind", v)} />
              </Field>

              <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 0 }}>
                <button
                  type="button"
                  onClick={saveSubject}
                  style={{
                    height: 44, padding: "0 22px", borderRadius: 10, border: 0,
                    fontFamily: "inherit", fontSize: 13.5, fontWeight: 800,
                    cursor: "pointer", whiteSpace: "nowrap",
                    background: editing
                      ? "linear-gradient(135deg,#facc15,#f59e0b)"
                      : "linear-gradient(135deg,#7c3aed,#4f46e5)",
                    color: "#fff",
                    boxShadow: editing
                      ? "0 4px 20px rgba(245,158,11,.3)"
                      : "0 4px 20px rgba(99,102,241,.35)",
                    transition: "opacity .18s, transform .12s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = ".88"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                  onMouseDown={e  => { e.currentTarget.style.transform = "scale(.97)"; }}
                  onMouseUp={e    => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  {editing ? "Update →" : "Add Subject →"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Subject list card ── */}
        <div style={{
          background: "rgba(255,255,255,.03)",
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 20, overflow: "hidden",
          animation: "fadeIn .45s .08s cubic-bezier(.16,1,.3,1) both",
        }}>
          {/* toolbar */}
          <div style={{
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255,255,255,.06)",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
          }}>
            <span style={{ fontSize: 15, fontWeight: 800 }}>Subjects</span>
            <InputEl
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by code, name or type…"
              style={{ maxWidth: 280 }}
            />
          </div>

          {/* semester tabs */}
          <div style={{
            display: "flex", gap: 4, padding: "12px 20px 0",
            overflowX: "auto",
            borderBottom: "1px solid rgba(255,255,255,.06)",
          }}>
            {semesters.map(sem => (
              <SemTab
                key={sem}
                sem={sem}
                active={activeSem === sem}
                count={(catalog[sem] || []).length}
                onClick={() => setActiveSem(sem)}
              />
            ))}
          </div>

          {/* table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%", borderCollapse: "collapse",
              fontSize: 13.5,
            }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                  {["#", "Code", "Subject Name", "Type", "Actions"].map((h, i) => (
                    <th key={h} style={{
                      padding: "11px 16px",
                      textAlign: i === 4 ? "right" : "left",
                      fontSize: 11, fontWeight: 700, letterSpacing: ".07em",
                      textTransform: "uppercase", color: "rgba(255,255,255,.3)",
                      background: "rgba(255,255,255,.02)",
                      whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleCourses.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{
                      padding: "48px 16px", textAlign: "center",
                      color: "rgba(255,255,255,.22)", fontSize: 14, fontWeight: 600,
                    }}>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>⊘</div>
                      No subjects found
                    </td>
                  </tr>
                ) : visibleCourses.map((course, idx) => {
                  const rowKey = `${activeSem}-${course.code}`;
                  const isHovered = hoveredRow === rowKey;
                  return (
                    <tr
                      key={rowKey}
                      onMouseEnter={() => setHoveredRow(rowKey)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,.04)",
                        background: isHovered ? "rgba(139,92,246,.06)" : "transparent",
                        transition: "background .15s",
                      }}
                    >
                      <td style={{ padding: "13px 16px", color: "rgba(255,255,255,.25)", fontWeight: 600, width: 44 }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: "13px 16px", whiteSpace: "nowrap" }}>
                        <span style={{
                          fontFamily: "'DM Mono', monospace",
                          fontWeight: 600, fontSize: 12.5,
                          color: "#a78bfa",
                          background: "rgba(139,92,246,.12)",
                          border: "1px solid rgba(139,92,246,.2)",
                          borderRadius: 7, padding: "4px 9px",
                        }}>{course.code}</span>
                      </td>
                      <td style={{ padding: "13px 16px", fontWeight: 500 }}>
                        {course.title}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <TypeBadge kind={course.kind} />
                      </td>
                      <td style={{ padding: "13px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={() => editSubject(activeSem, course)}
                            style={{
                              background: "rgba(96,165,250,.1)",
                              border: "1px solid rgba(96,165,250,.2)",
                              color: "#60a5fa",
                              borderRadius: 8, padding: "6px 13px",
                              fontSize: 12, fontWeight: 700,
                              cursor: "pointer", fontFamily: "inherit",
                              transition: "background .15s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(96,165,250,.18)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(96,165,250,.1)"}
                          >Edit</button>
                          <button
                            type="button"
                            onClick={() => deleteSubject(activeSem, course)}
                            style={{
                              background: "rgba(239,68,68,.08)",
                              border: "1px solid rgba(239,68,68,.2)",
                              color: "#f87171",
                              borderRadius: 8, padding: "6px 13px",
                              fontSize: 12, fontWeight: 700,
                              cursor: "pointer", fontFamily: "inherit",
                              transition: "background .15s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,.18)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,.08)"}
                          >Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* footer */}
          {visibleCourses.length > 0 && (
            <div style={{
              padding: "12px 24px",
              borderTop: "1px solid rgba(255,255,255,.05)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              fontSize: 12, color: "rgba(255,255,255,.28)", fontWeight: 600,
            }}>
              <span>Showing {visibleCourses.length} of {(catalog[activeSem] || []).length} subjects in {activeSem}</span>
              <span>{visibleCourses.filter(c => c.kind === "lab").length} labs · {visibleCourses.filter(c => c.kind !== "lab").length} theory</span>
            </div>
          )}
        </div>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        onDone={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
};

export default AddSubject;