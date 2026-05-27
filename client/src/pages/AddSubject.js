import React, { useMemo, useState } from "react";
import { COURSE_CATALOG } from "../utils/courseCatalog";
import { loadSubjectCatalog, saveSubjectCatalog } from "../utils/subjectCatalogStorage";

const SUBJECT_CATALOG_CHANGED_EVENT = "mca-subject-catalog-changed";

const emptyForm = {
  semester: "Sem I",
  code: "",
  title: "",
  kind: "theory",
};

const AddSubject = () => {
  const [catalog, setCatalog] = useState(() => loadSubjectCatalog(COURSE_CATALOG));
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [activeSem, setActiveSem] = useState("Sem I");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const semesters = useMemo(() => Object.keys(catalog), [catalog]);
  const subjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (catalog[activeSem] || []).filter((subject) => {
      if (!term) return true;
      return `${subject.code} ${subject.title} ${subject.kind || "theory"}`.toLowerCase().includes(term);
    });
  }, [catalog, activeSem, search]);
  const totals = useMemo(() => {
    const all = Object.values(catalog).flat();
    return {
      total: all.length,
      labs: all.filter((subject) => subject.kind === "lab").length,
      theory: all.filter((subject) => subject.kind !== "lab").length,
    };
  }, [catalog]);

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const persist = (next) => {
    const saved = saveSubjectCatalog(next);
    setCatalog(saved);
    window.dispatchEvent(new Event(SUBJECT_CATALOG_CHANGED_EVENT));
  };
  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };
  const flash = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2200);
  };

  const saveSubject = () => {
    const semester = form.semester;
    const code = form.code.trim().toUpperCase();
    const title = form.title.trim();
    if (!semester || !code || !title) {
      flash("Please fill semester, course code, and subject name.");
      return;
    }

    const nextCourse = { code, title, ...(form.kind === "lab" ? { kind: "lab" } : {}) };
    const next = { ...catalog };
    if (editing && editing.semester !== semester) {
      next[editing.semester] = (next[editing.semester] || []).filter((item) => item.code !== editing.code);
    }
    next[semester] = [
      ...(next[semester] || []).filter((item) => item.code !== (editing?.code || code)),
      nextCourse,
    ];
    persist(next);
    setActiveSem(semester);
    resetForm();
    flash(editing ? "Subject updated successfully." : "Subject added successfully.");
  };

  const editSubject = (semester, subject) => {
    setEditing({ semester, code: subject.code });
    setForm({
      semester,
      code: subject.code,
      title: subject.title,
      kind: subject.kind === "lab" ? "lab" : "theory",
    });
  };

  const deleteSubject = (semester, subject) => {
    if (!window.confirm(`Delete ${subject.code} - ${subject.title}?`)) return;
    persist({
      ...catalog,
      [semester]: (catalog[semester] || []).filter((item) => item.code !== subject.code),
    });
    if (editing?.semester === semester && editing?.code === subject.code) resetForm();
    flash("Subject deleted.");
  };

  return (
    <div className="subject-page">
      <style>{css}</style>
      <div className="subject-head">
        <div>
          <div className="eyebrow">MCA Curriculum</div>
          <h1>Subject Manager</h1>
        </div>
        <div className="metric-row">
          <Metric label="Total" value={totals.total} />
          <Metric label="Theory" value={totals.theory} />
          <Metric label="Lab" value={totals.labs} />
        </div>
      </div>

      {message && <div className="notice">{message}</div>}

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{editing ? "Edit Subject" : "Add Subject"}</h2>
            <p>{editing ? `Editing ${editing.code}` : "Create a subject entry for chargesheets and timetables."}</p>
          </div>
          {editing && <button className="btn secondary" onClick={resetForm}>Cancel</button>}
        </div>
        <div className="form-grid">
          <Field label="Semester">
            <select value={form.semester} onChange={(e) => updateForm("semester", e.target.value)}>
              {semesters.map((sem) => <option key={sem}>{sem}</option>)}
            </select>
          </Field>
          <Field label="Course Code">
            <input value={form.code} onChange={(e) => updateForm("code", e.target.value)} placeholder="R5MC5021T" />
          </Field>
          <Field label="Subject Name">
            <input value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="Subject title" />
          </Field>
          <Field label="Type">
            <select value={form.kind} onChange={(e) => updateForm("kind", e.target.value)}>
              <option value="theory">Theory</option>
              <option value="lab">Lab</option>
            </select>
          </Field>
          <button className="btn primary" onClick={saveSubject}>{editing ? "Update" : "Add Subject"}</button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Subjects</h2>
            <p>Manage existing semester-wise subjects.</p>
          </div>
          <input className="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subjects" />
        </div>
        <div className="tabs">
          {semesters.map((sem) => (
            <button key={sem} className={activeSem === sem ? "active" : ""} onClick={() => setActiveSem(sem)}>
              {sem} <span>{(catalog[sem] || []).length}</span>
            </button>
          ))}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Code</th>
                <th>Subject</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.length === 0 ? (
                <tr><td colSpan="5" className="empty">No subjects found.</td></tr>
              ) : subjects.map((subject, index) => (
                <tr key={`${activeSem}-${subject.code}`}>
                  <td>{index + 1}</td>
                  <td className="code">{subject.code}</td>
                  <td>{subject.title}</td>
                  <td><span className={`badge ${subject.kind === "lab" ? "lab" : ""}`}>{subject.kind === "lab" ? "Lab" : "Theory"}</span></td>
                  <td className="actions">
                    <button onClick={() => editSubject(activeSem, subject)}>Edit</button>
                    <button className="danger" onClick={() => deleteSubject(activeSem, subject)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

const css = `
  .subject-page { min-height: 100vh; padding: 28px; background: #f0f2f8; color: #0f172a; font-family: 'DM Sans', system-ui, sans-serif; }
  .subject-head { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; margin-bottom: 18px; }
  .eyebrow { font-size: 12px; font-weight: 800; letter-spacing: .08em; color: #3b82f6; text-transform: uppercase; }
  h1 { margin: 4px 0 0; font-size: 28px; }
  h2 { margin: 0; font-size: 16px; }
  p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
  .metric-row { display: flex; gap: 10px; flex-wrap: wrap; }
  .metric { min-width: 92px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; }
  .metric strong { display: block; font-size: 24px; }
  .metric span { color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .07em; }
  .notice { margin-bottom: 14px; background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; border-radius: 10px; padding: 12px 14px; font-weight: 700; font-size: 13px; }
  .panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; margin-bottom: 18px; }
  .panel-head { padding: 16px 18px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; gap: 14px; align-items: center; }
  .form-grid { padding: 18px; display: grid; grid-template-columns: minmax(140px,.8fr) minmax(150px,.8fr) minmax(220px,1.4fr) minmax(140px,.7fr) auto; gap: 14px; align-items: end; }
  .field { display: flex; flex-direction: column; gap: 7px; }
  .field span { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: .07em; }
  input, select { width: 100%; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 11px 12px; font: inherit; outline: none; background: #fff; }
  input:focus, select:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.12); }
  .btn { border: 0; border-radius: 10px; padding: 11px 16px; font-weight: 800; cursor: pointer; font: inherit; }
  .btn.primary { background: #3C3489; color: #fff; }
  .btn.secondary { background: #f1f5f9; color: #334155; }
  .search { max-width: 280px; }
  .tabs { display: flex; gap: 8px; padding: 12px 18px; border-bottom: 1px solid #e2e8f0; overflow-x: auto; }
  .tabs button { border: 1px solid #e2e8f0; background: #fff; border-radius: 999px; padding: 8px 12px; cursor: pointer; font-weight: 800; color: #475569; white-space: nowrap; }
  .tabs button.active { background: #eef2ff; border-color: #c7d2fe; color: #3730a3; }
  .tabs span { margin-left: 6px; color: #64748b; }
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 12px 14px; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .07em; background: #f8fafc; }
  td { padding: 13px 14px; border-top: 1px solid #f1f5f9; }
  .code { font-weight: 800; }
  .badge { display: inline-flex; border-radius: 999px; padding: 4px 10px; background: #eef2ff; color: #3730a3; font-size: 11px; font-weight: 800; text-transform: uppercase; }
  .badge.lab { background: #ecfdf5; color: #065f46; }
  .actions { text-align: right; white-space: nowrap; }
  .actions button { border: 0; border-radius: 8px; padding: 7px 10px; margin-left: 6px; cursor: pointer; font-weight: 800; background: #eef2ff; color: #3730a3; }
  .actions button.danger { background: #fef2f2; color: #b91c1c; }
  .empty { text-align: center; color: #94a3b8; padding: 34px; }
  @media (max-width: 980px) { .form-grid { grid-template-columns: 1fr 1fr; } .btn.primary { grid-column: 1 / -1; } }
`;

export default AddSubject;
