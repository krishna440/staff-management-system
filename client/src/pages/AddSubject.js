import React, { useMemo, useState } from "react";
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

const AddSubject = () => {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState(() => loadSubjectCatalog(COURSE_CATALOG));
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const semesters = useMemo(() => Object.keys(catalog), [catalog]);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setMessage("");
  };

  const persist = (next) => {
    const saved = saveSubjectCatalog(next);
    setCatalog(saved);
    window.dispatchEvent(new Event(SUBJECT_CATALOG_CHANGED_EVENT));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const saveSubject = () => {
    const semester = form.semester;
    const code = form.code.trim().toUpperCase();
    const title = form.title.trim();

    if (!semester || !code || !title) {
      setMessage("Please select semester and enter subject code and name.");
      return;
    }

    const nextCourse = {
      code,
      title,
      ...(form.kind === "lab" ? { kind: "lab" } : {}),
    };

    const next = { ...catalog };
    if (editing && editing.semester !== semester) {
      next[editing.semester] = (next[editing.semester] || []).filter((course) => course.code !== editing.code);
    }
    next[semester] = [
      ...(next[semester] || []).filter((course) => course.code !== (editing?.code || code)),
      nextCourse,
    ];

    persist(next);
    resetForm();
    setMessage(editing ? "Subject updated." : "Subject added.");
  };

  const editSubject = (semester, course) => {
    setEditing({ semester, code: course.code });
    setForm({
      semester,
      code: course.code,
      title: course.title,
      kind: course.kind === "lab" ? "lab" : "theory",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMessage("");
  };

  const deleteSubject = (semester, course) => {
    if (!window.confirm(`Delete ${course.code} ${course.title}?`)) return;
    const next = {
      ...catalog,
      [semester]: (catalog[semester] || []).filter((item) => item.code !== course.code),
    };
    persist(next);
    if (editing?.semester === semester && editing?.code === course.code) resetForm();
    setMessage("Subject deleted.");
  };

  return (
    <div className="as-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .as-root { min-height: 100vh; background: #f6f8fc; color: #0f172a; font-family: 'Inter', system-ui, sans-serif; }
        .as-top { position: sticky; top: 0; z-index: 10; background: #0f172a; color: #fff; padding: 16px 28px; display: flex; justify-content: space-between; align-items: center; gap: 14px; box-shadow: 0 10px 30px rgba(15,23,42,.18); }
        .as-top h1 { margin: 0; font-size: 18px; font-weight: 800; }
        .as-top p { margin: 4px 0 0; color: rgba(255,255,255,.72); font-size: 12px; }
        .as-back { border: 1px solid rgba(255,255,255,.25); background: rgba(255,255,255,.08); color: #fff; border-radius: 10px; padding: 9px 14px; font-weight: 700; cursor: pointer; }
        .as-wrap { max-width: 1180px; margin: 0 auto; padding: 28px 22px 70px; }
        .as-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 12px 28px rgba(15,23,42,.06); margin-bottom: 22px; overflow: hidden; }
        .as-card-head { padding: 16px 18px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .as-card-head h2 { margin: 0; font-size: 16px; font-weight: 800; }
        .as-card-body { padding: 18px; }
        .as-form { display: grid; grid-template-columns: 150px minmax(140px, 1fr) minmax(240px, 2fr) 140px auto; gap: 12px; align-items: end; }
        .as-field { display: flex; flex-direction: column; gap: 6px; }
        .as-field label { font-size: 12px; font-weight: 800; color: #475569; }
        .as-input, .as-select { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 11px; font: inherit; font-size: 13px; outline: none; background: #fff; }
        .as-input:focus, .as-select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
        .as-actions { display: flex; gap: 8px; }
        .as-btn { border: 0; border-radius: 8px; padding: 10px 14px; font-weight: 800; cursor: pointer; font: inherit; font-size: 13px; white-space: nowrap; }
        .as-btn-primary { background: #2563eb; color: #fff; }
        .as-btn-muted { background: #e2e8f0; color: #334155; }
        .as-message { margin-top: 12px; color: #2563eb; font-size: 13px; font-weight: 700; }
        .as-semester { padding: 18px; border-top: 1px solid #edf2f7; }
        .as-semester:first-child { border-top: 0; }
        .as-semester-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .as-semester-title h3 { margin: 0; font-size: 15px; font-weight: 800; }
        .as-count { color: #64748b; font-size: 12px; font-weight: 700; }
        .as-table { width: 100%; border-collapse: collapse; }
        .as-table th, .as-table td { border-top: 1px solid #e2e8f0; text-align: left; padding: 10px 8px; font-size: 13px; vertical-align: top; }
        .as-table th { color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; background: #f8fafc; }
        .as-code { font-weight: 800; color: #1d4ed8; white-space: nowrap; }
        .as-type { display: inline-flex; border-radius: 999px; padding: 4px 8px; background: #eef2ff; color: #3730a3; font-size: 11px; font-weight: 800; }
        .as-row-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .as-link-btn { border: 1px solid #cbd5e1; background: #fff; color: #334155; border-radius: 8px; padding: 7px 10px; font-weight: 800; cursor: pointer; font-size: 12px; }
        .as-link-btn.danger { color: #b91c1c; border-color: #fecaca; }
        @media (max-width: 820px) {
          .as-top { align-items: flex-start; flex-direction: column; }
          .as-form { grid-template-columns: 1fr; }
          .as-actions { justify-content: flex-start; }
          .as-table { display: block; overflow-x: auto; white-space: nowrap; }
        }
      `}</style>

      <div className="as-top">
        <div>
          <h1>Add Subject</h1>
          <p>Add, edit, and delete MCA subjects semester wise.</p>
        </div>
        <button className="as-back" onClick={() => navigate("/")}>Back to Dashboard</button>
      </div>

      <div className="as-wrap">
        <div className="as-card">
          <div className="as-card-head">
            <h2>{editing ? "Edit Subject" : "New Subject"}</h2>
          </div>
          <div className="as-card-body">
            <div className="as-form">
              <div className="as-field">
                <label>Semester</label>
                <select className="as-select" value={form.semester} onChange={(e) => updateForm("semester", e.target.value)}>
                  {semesters.map((sem) => <option key={sem} value={sem}>{sem}</option>)}
                </select>
              </div>
              <div className="as-field">
                <label>Course code</label>
                <input className="as-input" value={form.code} onChange={(e) => updateForm("code", e.target.value)} placeholder="R5MC5021P" />
              </div>
              <div className="as-field">
                <label>Subject name</label>
                <input className="as-input" value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="Subject name" />
              </div>
              <div className="as-field">
                <label>Type</label>
                <select className="as-select" value={form.kind} onChange={(e) => updateForm("kind", e.target.value)}>
                  <option value="theory">Theory</option>
                  <option value="lab">Lab</option>
                </select>
              </div>
              <div className="as-actions">
                <button type="button" className="as-btn as-btn-primary" onClick={saveSubject}>{editing ? "Update" : "Add"}</button>
                {editing && <button type="button" className="as-btn as-btn-muted" onClick={resetForm}>Cancel</button>}
              </div>
            </div>
            {message && <div className="as-message">{message}</div>}
          </div>
        </div>

        <div className="as-card">
          <div className="as-card-head">
            <h2>All Subjects</h2>
          </div>
          {semesters.map((semester) => (
            <div key={semester} className="as-semester">
              <div className="as-semester-title">
                <h3>{semester}</h3>
                <span className="as-count">{(catalog[semester] || []).length} subjects</span>
              </div>
              <table className="as-table">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Subject Name</th>
                    <th>Type</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(catalog[semester] || []).map((course) => (
                    <tr key={`${semester}-${course.code}`}>
                      <td className="as-code">{course.code}</td>
                      <td>{course.title}</td>
                      <td><span className="as-type">{course.kind === "lab" ? "Lab" : "Theory"}</span></td>
                      <td>
                        <div className="as-row-actions">
                          <button className="as-link-btn" onClick={() => editSubject(semester, course)}>Edit</button>
                          <button className="as-link-btn danger" onClick={() => deleteSubject(semester, course)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AddSubject;
