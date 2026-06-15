import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCourse, getCoursesForSemester, SEMESTERS } from "../utils/courseCatalog";
import { addVjtiLogoToPdf } from "../utils/logo";
import API from "../services/api";

const EXAM_TYPES = [
  { value: "MST", label: "MST", color: "#0ea5e9" },
  { value: "ESE", label: "End Semester", color: "#6366f1" },
  { value: "Re-ESE", label: "Re-ESE", color: "#f59e0b" },
];

const DEFAULT_THEORY_ROW = {
  id: 1,
  date: "",
  time: "01:15 PM - 4:15 PM",
  courseCode: "",
  courseTitle: "",
  courseCode2: "",
  courseTitle2: "",
  hasSecondSubject: false,
  roomA: "",
  roomB: "",
  reliever: "",
};

const DEFAULT_LAB_ROW = {
  id: 1,
  date: "",
  dayDate: "",
  slots: {},
};

const DEFAULT_LAB_SLOTS = [
  { id: "slot1", label: "9.30 AM to 11.00 AM" },
  { id: "slot2", label: "11.30 AM to 01.00 PM" },
  { id: "slot3", label: "1.30 PM to 3.00 PM" },
  { id: "slot4", label: "3.30 PM to 5.00 PM" },
];

function getLoggedInUser() {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "null")?.user || null;
  } catch {
    return null;
  }
}

export default function Timetable() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [settings, setSettings] = useState({
    semester: "Sem II",
    examType: "ESE",
    month: "May",
    year: "2026",
    academicYear: "2025-26",
    term: "Even Term",
    noticeDate: todayInput(),
    labNote: "Students must bring their own laptop for Lab Exam",
  });
  const [theoryRows, setTheoryRows] = useState([DEFAULT_THEORY_ROW]);
  const [labRows, setLabRows] = useState([DEFAULT_LAB_ROW]);
  const [labSlots, setLabSlots] = useState(DEFAULT_LAB_SLOTS);
  const [activeTab, setActiveTab] = useState("theory");
  const [downloading, setDownloading] = useState("");
  const [savedTimetables, setSavedTimetables] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState("");
  const [previewTimetable, setPreviewTimetable] = useState(null);
  const loggedInUser = getLoggedInUser();

  const courses = useMemo(
    () => getCoursesForSemester(settings.semester),
    [settings.semester]
  );

  const labCourses = useMemo(
    () => courses.filter((course) => course.kind === "lab"),
    [courses]
  );

  const teachingStaff = useMemo(
    () => staff.filter((s) => String(s.type || "").toLowerCase() === "teaching"),
    [staff]
  );

  const selectedExamType = useMemo(
    () => EXAM_TYPES.find((t) => t.value === settings.examType) || EXAM_TYPES[0],
    [settings.examType]
  );

  useEffect(() => {
    fetchStaff();
    fetchSavedTimetables();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await axios.get("https://staff-management-system-eluv.onrender.com/api/staff");
      setStaff(res.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchSavedTimetables = async () => {
    const user = getLoggedInUser();
    if (!user?.id) {
      setSavedError("Login again to load saved timetables.");
      return;
    }

    try {
      setSavedLoading(true);
      setSavedError("");
      const res = await API.get("/timetable-drafts", { params: { userId: user.id } });
      setSavedTimetables(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setSavedError(err.response?.data?.message || "Unable to load saved timetables.");
    } finally {
      setSavedLoading(false);
    }
  };

  const updateSetting = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    if (field === "semester") {
      setTheoryRows((prev) => prev.map((row) => ({
        ...row,
        courseCode: "",
        courseTitle: "",
        courseCode2: "",
        courseTitle2: "",
        hasSecondSubject: false,
      })));
      setLabRows((prev) => prev.map((row) => ({ ...row, slots: {} })));
    }
  };

  const updateTheoryRow = (id, field, value) => {
    setTheoryRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const selectTheoryCourse = (id, code, second = false) => {
    const course = courses.find((item) => item.code === code);
    setTheoryRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? second
            ? { ...row, courseCode2: course?.code || "", courseTitle2: course?.title || "" }
            : { ...row, courseCode: course?.code || "", courseTitle: course?.title || "" }
          : row
      )
    );
  };

  const toggleSecondTheoryCourse = (id, enabled) => {
    setTheoryRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              hasSecondSubject: enabled,
              ...(!enabled ? { courseCode2: "", courseTitle2: "" } : {}),
            }
          : row
      )
    );
  };

  const addTheoryRow = () => {
    setTheoryRows((prev) => [
      ...prev,
      {
        ...DEFAULT_THEORY_ROW,
        id: Date.now(),
        time: prev[prev.length - 1]?.time || DEFAULT_THEORY_ROW.time,
      },
    ]);
  };

  const removeTheoryRow = (id) => {
    setTheoryRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.id !== id)));
  };

  const updateLabRow = (id, field, value) => {
    setLabRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const updateLabDate = (id, value) => {
    setLabRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, date: value, dayDate: formatLabDate(value) } : row
      )
    );
  };

  const updateLabSlotCell = (rowId, slotId, field, value) => {
    setLabRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              slots: {
                ...(row.slots || {}),
                [slotId]: {
                  ...normalizeLabSlotValue(row.slots?.[slotId]),
                  [field]: value,
                },
              },
            }
          : row
      )
    );
  };

  const updateLabSlotLabel = (slotId, label) => {
    setLabSlots((prev) => prev.map((slot) => (slot.id === slotId ? { ...slot, label } : slot)));
  };

  const addLabSlot = () => {
    setLabSlots((prev) => [...prev, { id: `slot${Date.now()}`, label: "New Time Slot" }]);
  };

  const removeLabSlot = (slotId) => {
    setLabSlots((prev) => (prev.length === 1 ? prev : prev.filter((slot) => slot.id !== slotId)));
    setLabRows((prev) =>
      prev.map((row) => {
        const nextSlots = { ...(row.slots || {}) };
        delete nextSlots[slotId];
        return { ...row, slots: nextSlots };
      })
    );
  };

  const addLabRow = () => {
    setLabRows((prev) => [...prev, { ...DEFAULT_LAB_ROW, id: Date.now() }]);
  };

  const addLabRowBelow = (id) => {
    setLabRows((prev) => {
      const index = prev.findIndex((row) => row.id === id);
      const source = prev[index] || DEFAULT_LAB_ROW;
      const nextRow = {
        ...DEFAULT_LAB_ROW,
        id: Date.now(),
        date: source.date || "",
        dayDate: labDateLabel(source),
      };
      const rows = [...prev];
      rows.splice(index + 1, 0, nextRow);
      return rows;
    });
  };

  const removeLabRow = (id) => {
    setLabRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.id !== id)));
  };

  const currentTimetable = () => ({
    id: editingDraftId || Date.now(),
    name: `${settings.examType} ${settings.semester} ${settings.month} ${settings.year}`,
    updatedAt: new Date().toISOString(),
    settings,
    theoryRows,
    labRows,
    labSlots,
  });

  const timetableDraftPayload = (item) => ({
    userId: loggedInUser?.id,
    userEmail: loggedInUser?.email,
    name: item.name,
    settings: item.settings,
    theoryRows: item.theoryRows,
    labRows: item.labRows,
    labSlots: item.labSlots,
  });

  const saveCurrentTimetable = async () => {
    if (!loggedInUser?.id) {
      setSavedError("Login again before saving a timetable.");
      return;
    }

    const item = currentTimetable();
    try {
      setSavingDraft(true);
      setSavedError("");
      const payload = timetableDraftPayload(item);
      const res = editingDraftId
        ? await API.put(`/timetable-drafts/${editingDraftId}`, payload)
        : await API.post("/timetable-drafts", payload);
      const saved = res.data;
      setEditingDraftId(saved.id || saved._id);
      setSavedTimetables((prev) => [
        saved,
        ...prev.filter((draft) => String(draft.id || draft._id) !== String(saved.id || saved._id)),
      ]);
      setPreviewTimetable(saved);
    } catch (err) {
      console.error(err);
      setSavedError(err.response?.data?.message || "Unable to save timetable.");
    } finally {
      setSavingDraft(false);
    }
  };

  const editSavedTimetable = (item) => {
    const draftId = item.id || item._id;
    setSettings(item.settings);
    setTheoryRows(item.theoryRows?.length ? item.theoryRows : [DEFAULT_THEORY_ROW]);
    setLabRows(item.labRows?.length ? item.labRows : [DEFAULT_LAB_ROW]);
    setLabSlots(item.labSlots?.length ? item.labSlots : DEFAULT_LAB_SLOTS);
    setEditingDraftId(draftId);
    setPreviewTimetable(null);
    setActiveTab("theory");
  };

  const deleteSavedTimetable = async (id) => {
    if (!loggedInUser?.id) {
      setSavedError("Login again before deleting a timetable.");
      return;
    }

    try {
      setSavedError("");
      await API.delete(`/timetable-drafts/${id}`, { params: { userId: loggedInUser.id } });
      setSavedTimetables((prev) => prev.filter((item) => String(item.id || item._id) !== String(id)));
      if (String(previewTimetable?.id || previewTimetable?._id) === String(id)) setPreviewTimetable(null);
      if (String(editingDraftId) === String(id)) setEditingDraftId("");
    } catch (err) {
      console.error(err);
      setSavedError(err.response?.data?.message || "Unable to delete timetable.");
    }
  };

  const downloadTheoryPdf = async (source = currentTimetable()) => {
    const s = source.settings;
    const rows = source.theoryRows || [];
    const docTitle = timetableTitle(s);
    const docSemLabel = s.semester.replace("Sem ", "Sem-");
    setDownloading("theory");
    const doc = makeDoc("p");
    await drawHeader(doc, s, docTitle);
    doc.setFontSize(12);
    doc.text(`Date: ${displayDate(s.noticeDate)}`, 472, 150, { align: "right" });
    autoTable(doc, {
      startY: 158,
      margin: { left: 54, right: 54 },
      theme: "grid",
      head: [["Day and Date", "Time of Exam", `Course code and Course name for ${classLabel(s.semester)}`]],
      body: rows.map((row) => [displayDate(row.date), row.time, courseLine(row)]),
      styles: tableStyles(10),
      headStyles: headStyles(),
      columnStyles: { 0: { cellWidth: 120, halign: "center" }, 1: { cellWidth: 120, halign: "center" }, 2: { cellWidth: 280 } },
    });
    drawTheoryFooter(doc);
    doc.save(`MCA_${s.examType}_${docSemLabel}_Timetable.pdf`);
    setTimeout(() => setDownloading(""), 600);
  };

  const downloadSupervisionPdf = async (source = currentTimetable()) => {
    const s = source.settings;
    const rows = source.theoryRows || [];
    const docTitle = timetableTitle(s);
    const docSemLabel = s.semester.replace("Sem ", "Sem-");
    setDownloading("supervision");
    const doc = makeDoc("l");
    await drawHeader(doc, s, docTitle, { showSupervision: true });
    doc.setFontSize(12);
    doc.text(`Date: ${displayDate(s.noticeDate)}`, 770, 150, { align: "right" });
    autoTable(doc, {
      startY: 158,
      margin: { left: 54, right: 54 },
      theme: "grid",
      head: [["Day and Date", "Time of Exam", `Course code and Course Name for ${classLabel(s.semester)}`, "AL301", "AL207", "Reliever Duties"]],
      body: rows.map((row) => [displayDate(row.date), row.time, courseLine(row), row.roomA || "", row.roomB || "", row.reliever || ""]),
      styles: tableStyles(10),
      headStyles: headStyles(),
      columnStyles: {
        0: { cellWidth: 86, halign: "center" }, 1: { cellWidth: 92, halign: "center" }, 2: { cellWidth: 230 },
        3: { cellWidth: 110, halign: "center" }, 4: { cellWidth: 110, halign: "center" }, 5: { cellWidth: 120, halign: "center" },
      },
    });
    drawWideFooter(doc);
    doc.save(`MCA_${s.examType}_${docSemLabel}_Supervision_Duties.pdf`);
    setTimeout(() => setDownloading(""), 600);
  };

  const downloadTheoryDutySheetPdf = async (source = currentTimetable()) => {
    const s = source.settings;
    const rows = (source.theoryRows || []).filter(
      (row) => row.date || row.courseCode || row.courseTitle || row.courseCode2 || row.courseTitle2 || row.roomA || row.roomB || row.reliever
    );
    const docSemLabel = s.semester.replace("Sem ", "Sem-");
    setDownloading("duty-sheet");
    const doc = makeDoc("l");
    const width = doc.internal.pageSize.getWidth();

    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text(timetableTitle(s).toUpperCase(), width / 2, 34, { align: "center" });

    autoTable(doc, {
      startY: 48,
      margin: { left: 22, right: 22 },
      theme: "grid",
      head: [[
        "Date",
        "Subject",
        "Classroom",
        "Supervision\nDuty",
        "Sign",
        "Reliever",
        "Sign",
        "Subject\nTeacher",
        "Absent\nStudents",
        "Total Answer\nSheets",
        "Faculty Sign\nwith Date",
        "Peon\nSign",
        "Clerk\nSign",
      ]],
      body: theoryDutySheetBody(rows),
      styles: {
        ...tableStyles(7),
        cellPadding: 3,
        minCellHeight: 34,
        overflow: "linebreak",
      },
      headStyles: {
        ...headStyles(),
        fontSize: 7,
        minCellHeight: 36,
      },
      columnStyles: theoryDutySheetColumnStyles(),
    });

    doc.save(`MCA_${s.examType}_${docSemLabel}_Theory_Duty_Sheet.pdf`);
    setTimeout(() => setDownloading(""), 600);
  };

  const downloadLabPdf = async (source = currentTimetable()) => {
    const s = source.settings;
    const rows = source.labRows || [];
    const slots = source.labSlots || DEFAULT_LAB_SLOTS;
    const docSemLabel = s.semester.replace("Sem ", "Sem-");
    setDownloading("lab");
    const doc = makeDoc("l");
    await addVjtiLogoToPdf(doc, { x: 68, y: 28, width: 42, height: 42 });
    doc.setFont("times", "bold"); doc.setFontSize(14);
    doc.text("Veermata Jijabai Technological Institute, Mumbai", 421, 42, { align: "center" });
    doc.setFontSize(10); doc.setFont("times", "bolditalic");
    doc.text("Master of Computer Application", 421, 56, { align: "center" });
    doc.setFont("times", "normal"); doc.setFontSize(11);
    doc.text(`Date: ${displayDate(s.noticeDate)}`, 728, 82, { align: "right" });
    doc.setFont("times", "bold"); doc.setFontSize(12);
    doc.text(
      `Time table for ${labExamLabel(s)} Lab Examination, ${labTermLabel(s.term)} semester of AY ${s.academicYear}, ${labSemesterLabel(s.semester)}, ${s.month} ${s.year}`,
      421, 114, { align: "center" }
    );
    autoTable(doc, {
      startY: 132,
      margin: { left: 54, right: 54 },
      theme: "grid",
      head: [
        [
          { content: "Date & Date" },
          { content: "Details of Examination", colSpan: labSlots.length },
        ],
        ["Time", ...slots.map((slot) => slot.label)],
      ],
      body: labTableBody(rows, slots),
      styles: tableStyles(8.5),
      headStyles: headStyles(),
      columnStyles: labColumnStyles(slots.length),
    });
    const afterTableY = doc.lastAutoTable.finalY + 14;
    doc.setFont("times", "bold");
    doc.text(`Note: ${s.labNote}`, 421, afterTableY, { align: "center" });
    doc.setFont("times", "normal");
    doc.text("Exam Coordinator", 92, afterTableY + 48);
    doc.text("Head of Department", 664, afterTableY + 48);
    doc.text("Copy to,", 54, afterTableY + 82);
    doc.text("1. Students through proper media", 72, afterTableY + 100);
    doc.text("2. Department notice board", 72, afterTableY + 116);
    doc.save(`MCA_${s.examType}_${docSemLabel}_Lab_Timetable.pdf`);
    setTimeout(() => setDownloading(""), 600);
  };

  const downloadSavedTimetable = async (item) => {
    await downloadTheoryPdf(item);
    await downloadSupervisionPdf(item);
    await downloadTheoryDutySheetPdf(item);
    await downloadLabPdf(item);
  };

  const title = timetableTitle(settings);

  const completionStats = useMemo(() => {
    const filledTheory = theoryRows.filter((r) => r.date && r.courseCode).length;
    const filledLab = labRows.filter((r) => labDateLabel(r) && labSlots.some((slot) => labSlotText(r.slots?.[slot.id]))).length;
    return { theoryTotal: theoryRows.length, theoryFilled: filledTheory, labTotal: labRows.length, labFilled: filledLab };
  }, [theoryRows, labRows, labSlots]);

  return (
    <div className="tt-root">
      <style>{css}</style>

      {/* TOP BAR */}
      <div className="tt-topbar">
        <div className="tt-topbar-left">
          <div className="tt-logo">TT</div>
          <div className="tt-brand">
            <div className="tt-brand-sub">VJTI - MCA Department</div>
            <div className="tt-brand-title">Examination Timetable Builder</div>
          </div>
        </div>
        <div className="tt-topbar-right">
          <div className="tt-info-pill">
            <span className="tt-pill-dot" style={{ background: selectedExamType.color }} />
            {selectedExamType.label} - {settings.semester}
          </div>
          <button className="tt-back-btn" onClick={() => navigate("/")}>Dashboard</button>
        </div>
      </div>

      <main className="tt-main">
        {/* Ã¢â€â‚¬Ã¢â€â‚¬ EXAM DETAILS PANEL Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <section className="tt-card">
          <div className="tt-card-header">
            <div className="tt-card-icon" style={{ background: "#ede9fe" }}>CFG</div>
            <h2>Exam Configuration</h2>
            <span className="tt-card-badge" style={{ background: selectedExamType.color + "1a", color: selectedExamType.color }}>
            {selectedExamType.label} - {settings.semester}
            </span>
          </div>
          <div className="tt-card-body">
            {/* Exam Type Chips */}
            <div className="tt-section-divider"><span>Exam type</span></div>
            <div className="tt-chips" style={{ marginBottom: 22 }}>
              {EXAM_TYPES.map((t) => {
                const active = settings.examType === t.value;
                return (
                  <button
                    key={t.value}
                    className="tt-chip"
                    style={{
                      background: active ? t.color : "#f1f5f9",
                      color: active ? "#fff" : "#475569",
                      borderColor: active ? t.color : "transparent",
                      boxShadow: active ? `0 4px 14px ${t.color}44` : "none",
                    }}
                    onClick={() => updateSetting("examType", t.value)}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="tt-section-divider"><span>Schedule details</span></div>
            <div className="tt-grid">
              <Field label="Semester">
                <select value={settings.semester} onChange={(e) => updateSetting("semester", e.target.value)}>
                  {SEMESTERS.map((sem) => <option key={sem}>{sem}</option>)}
                </select>
              </Field>
              <Field label="Term">
                <select value={settings.term} onChange={(e) => updateSetting("term", e.target.value)}>
                  <option>Odd Term</option>
                  <option>Even Term</option>
                </select>
              </Field>
              <Field label="Month">
                <input value={settings.month} onChange={(e) => updateSetting("month", e.target.value)} placeholder="May" />
              </Field>
              <Field label="Year">
                <input value={settings.year} onChange={(e) => updateSetting("year", e.target.value)} placeholder="2026" />
              </Field>
              <Field label="Academic Year">
                <input value={settings.academicYear} onChange={(e) => updateSetting("academicYear", e.target.value)} placeholder="2025-26" />
              </Field>
              <Field label="Notice Date">
                <input type="date" value={settings.noticeDate} onChange={(e) => updateSetting("noticeDate", e.target.value)} />
              </Field>
              <Field label="Lab Note">
                <input value={settings.labNote} onChange={(e) => updateSetting("labNote", e.target.value)} placeholder="Students must bring their own laptop for Lab Exam" />
              </Field>
              <div className="tt-preview-tile" style={{ borderColor: selectedExamType.color + "33", background: selectedExamType.color + "08" }}>
                <span className="tt-preview-label" style={{ color: selectedExamType.color }}>Document Title Preview</span>
                <span className="tt-preview-val">{title}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ TABS Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <div className="tt-tabs">
          <button
            className={`tt-tab ${activeTab === "theory" ? "active" : ""}`}
            onClick={() => setActiveTab("theory")}
          >

            <span>Theory / MST</span>
            <span className="tt-tab-count">{completionStats.theoryFilled}/{completionStats.theoryTotal}</span>
          </button>
          <button
            className={`tt-tab ${activeTab === "lab" ? "active" : ""}`}
            onClick={() => setActiveTab("lab")}
          >

            <span>Lab Timetable</span>
            <span className="tt-tab-count">{completionStats.labFilled}/{completionStats.labTotal}</span>
          </button>
        </div>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ THEORY Ã¢â€â‚¬Ã¢â€â‚¬ */}
        {activeTab === "theory" && (
          <section className="tt-card">
            <div className="tt-card-header">
              <div className="tt-card-icon" style={{ background: "#dbeafe" }}>TH</div>
              <h2>Theory / MST Timetable</h2>
              <span className="tt-card-badge" style={{ background: "#dbeafe", color: "#1e40af" }}>
                {theoryRows.length} {theoryRows.length === 1 ? "row" : "rows"}
              </span>
              <button className="tt-add-btn" onClick={addTheoryRow}>Add Row</button>
            </div>
            <div className="tt-card-body" style={{ padding: 0 }}>
              <div className="tt-table-wrap">
                <table className="tt-table">
                  <thead>
                    <tr>
                      <th>Sr.No</th>
                      <th>Day & Date</th>
                      <th>Time</th>
                      <th>Subject</th>
                      <th>Code</th>
                      <th>AL301</th>
                      <th>AL207</th>
                      <th>Reliever</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {theoryRows.map((row, idx) => (
                      <tr key={row.id}>
                        <td><div className="tt-row-num">{idx + 1}</div></td>
                        <td><input type="date" value={row.date} onChange={(e) => updateTheoryRow(row.id, "date", e.target.value)} /></td>
                        <td><input value={row.time} onChange={(e) => updateTheoryRow(row.id, "time", e.target.value)} /></td>
                        <td>
                          <select value={row.courseCode} onChange={(e) => selectTheoryCourse(row.id, e.target.value)}>
                            <option value="">-</option>
                            {courses.map((course) => (
                              <option key={course.code} value={course.code}>{course.title}</option>
                            ))}
                          </select>
                          {(row.hasSecondSubject || row.courseCode2) ? (
                            <>
                              <select
                                value={row.courseCode2 || ""}
                                onChange={(e) => selectTheoryCourse(row.id, e.target.value, true)}
                                style={{ marginTop: 6 }}
                              >
                                <option value="">Second elective subject</option>
                                {courses.map((course) => (
                                  <option key={course.code} value={course.code}>{course.title}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className="tt-inline-course-btn remove"
                                onClick={() => toggleSecondTheoryCourse(row.id, false)}
                              >
                                Remove elective
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="tt-inline-course-btn"
                              onClick={() => toggleSecondTheoryCourse(row.id, true)}
                            >
                              + Add elective
                            </button>
                          )}
                        </td>
                        <td>
                          <input className="tt-readonly" value={row.courseCode} readOnly placeholder="Auto" />
                          {(row.hasSecondSubject || row.courseCode2) && (
                            <input
                              className="tt-readonly"
                              value={row.courseCode2 || ""}
                              readOnly
                              placeholder="Second code"
                              style={{ marginTop: 6 }}
                            />
                          )}
                        </td>
                        <td><StaffSelect value={row.roomA} staff={teachingStaff} onChange={(v) => updateTheoryRow(row.id, "roomA", v)} /></td>
                        <td><StaffSelect value={row.roomB} staff={teachingStaff} onChange={(v) => updateTheoryRow(row.id, "roomB", v)} /></td>
                        <td><StaffSelect value={row.reliever} staff={teachingStaff} onChange={(v) => updateTheoryRow(row.id, "reliever", v)} /></td>
                        <td>
                          <button
                            className="tt-icon-btn"
                            onClick={() => removeTheoryRow(row.id)}
                            disabled={theoryRows.length === 1}
                            title="Remove row"
                          >X</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ LAB Ã¢â€â‚¬Ã¢â€â‚¬ */}
        {activeTab === "lab" && (
          <section className="tt-card">
            <div className="tt-card-header">
              <div className="tt-card-icon" style={{ background: "#dcfce7" }}>LAB</div>
              <h2>Lab Timetable</h2>
              <span className="tt-card-badge" style={{ background: "#dcfce7", color: "#166534" }}>
                {labRows.length} {labRows.length === 1 ? "slot" : "slots"}
              </span>
              <button className="tt-add-btn muted" onClick={addLabSlot}>Add Time Slot</button>
              <button className="tt-add-btn" onClick={addLabRow}>Add Lab Row</button>
            </div>
            <div className="tt-card-body">
              <div className="tt-section-divider"><span>Lab time slots</span></div>
              <div className="tt-lab-slot-editor">
                {labSlots.map((slot, idx) => (
                  <div key={slot.id} className="tt-lab-slot-edit">
                    <span>Slot {idx + 1}</span>
                    <input value={slot.label} onChange={(e) => updateLabSlotLabel(slot.id, e.target.value)} />
                    <button
                      className="tt-icon-btn"
                      onClick={() => removeLabSlot(slot.id)}
                      disabled={labSlots.length === 1}
                      title="Remove time slot"
                    >X</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="tt-card-body" style={{ padding: 0 }}>
              <div className="tt-table-wrap">
                <table className="tt-table lab" style={{ minWidth: `${360 + labSlots.length * 220}px` }}>
                  <thead>
                    <tr>
                      <th></th>
                      <th>Day & Date</th>
                      {labSlots.map((slot, slotIdx) => (
                        <th key={slot.id}>
                          <span className="tt-slot-pill" style={{ background: slotColor(slotIdx).bg, color: slotColor(slotIdx).fg }}>
                            Slot {slotIdx + 1}
                          </span>
                          {slot.label}
                        </th>
                      ))}
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {labRows.map((row, idx) => (
                      <tr key={row.id}>
                        <td><div className="tt-row-num">{idx + 1}</div></td>
                        <td>
                          <div className="tt-lab-date-cell">
                            <input
                              type="date"
                              value={row.date || ""}
                              onChange={(e) => updateLabDate(row.id, e.target.value)}
                            />
                            <span>{labDateLabel(row) || "Select date"}</span>
                            <textarea
                              value={row.dayDate}
                              onChange={(e) => updateLabRow(row.id, "dayDate", e.target.value)}
                              placeholder="Or type custom day/date"
                            />
                          </div>
                        </td>
                        {labSlots.map((slot) => (
                          <td key={slot.id}>
                            <div className="tt-lab-slot-cell">
                              <select
                                value={normalizeLabSlotValue(row.slots?.[slot.id]).subject}
                                onChange={(e) => updateLabSlotCell(row.id, slot.id, "subject", e.target.value)}
                              >
                                <option value="">Select lab subject</option>
                                {legacyLabSlotSubject(row.slots?.[slot.id]) && !labCourses.some((course) => formatCourse(course) === legacyLabSlotSubject(row.slots?.[slot.id])) && (
                                  <option value={legacyLabSlotSubject(row.slots?.[slot.id])}>{legacyLabSlotSubject(row.slots?.[slot.id])}</option>
                                )}
                                {labCourses.map((course) => {
                                  const label = formatCourse(course);
                                  return <option key={course.code} value={label}>{label}</option>;
                                })}
                              </select>
                              <input
                                value={normalizeLabSlotValue(row.slots?.[slot.id]).rollNo}
                                onChange={(e) => updateLabSlotCell(row.id, slot.id, "rollNo", e.target.value)}
                                placeholder="Roll No (1-10)"
                              />
                            </div>
                          </td>
                        ))}
                        <td>
                          <button
                            className="tt-mini-action"
                            onClick={() => addLabRowBelow(row.id)}
                            title="Add another batch row for this date"
                          >Add below</button>
                          <button
                            className="tt-icon-btn"
                            onClick={() => removeLabRow(row.id)}
                            disabled={labRows.length === 1}
                          >X</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ EXPORT ACTIONS Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <section className="tt-card">
          <div className="tt-card-header">
            <div className="tt-card-icon" style={{ background: "#e0f2fe" }}>SV</div>
            <h2>Saved Time Table</h2>
            <span className="tt-card-badge" style={{ background: "#e0f2fe", color: "#0369a1" }}>
              {savedTimetables.length} saved
            </span>
            <button className="tt-add-btn" onClick={saveCurrentTimetable} disabled={savingDraft}>
              {savingDraft ? "Saving..." : editingDraftId ? "Update Time Table" : "Save Time Table"}
            </button>
          </div>
          <div className="tt-card-body">
            {savedError && <div className="tt-empty-saved" style={{ color: "#b91c1c" }}>{savedError}</div>}
            {savedLoading ? (
              <div className="tt-empty-saved">Loading saved timetables...</div>
            ) : savedTimetables.length === 0 ? (
              <div className="tt-empty-saved">No saved timetable yet.</div>
            ) : (
              <div className="tt-saved-list">
                {savedTimetables.map((item) => (
                  <div key={item.id || item._id} className="tt-saved-row">
                    <div>
                      <div className="tt-saved-title">{item.name}</div>
                      <div className="tt-saved-meta">
                        {item.theoryRows?.length || 0} theory rows - {item.labRows?.length || 0} lab rows - {new Date(item.updatedAt).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="tt-saved-actions">
                      <button className="tt-mini-action" onClick={() => setPreviewTimetable(item)}>Preview</button>
                      <button className="tt-mini-action" onClick={() => editSavedTimetable(item)}>Edit</button>
                      <button className="tt-mini-action" onClick={() => downloadTheoryDutySheetPdf(item)}>Duty Sheet</button>
                      <button className="tt-mini-action" onClick={() => downloadSavedTimetable(item)}>Download</button>
                      <button className="tt-icon-btn" onClick={() => deleteSavedTimetable(item.id || item._id)} title="Delete saved timetable">X</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {previewTimetable && (
              <div className="tt-preview-panel">
                <div className="tt-section-divider"><span>{previewTimetable.name} preview</span></div>
                <div className="tt-preview-table-wrap">
                  <table className="tt-preview-table">
                    <thead>
                      <tr><th>Date</th><th>Time</th><th>Course</th><th>AL301</th><th>AL207</th><th>Reliever</th></tr>
                    </thead>
                    <tbody>
                      {(previewTimetable.theoryRows || []).map((row) => (
                        <tr key={row.id}>
                          <td>{displayDate(row.date)}</td>
                          <td>{row.time}</td>
                          <td>{courseLine(row)}</td>
                          <td>{row.roomA}</td>
                          <td>{row.roomB}</td>
                          <td>{row.reliever}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="tt-preview-lab">
                  {(previewTimetable.labRows || []).slice(0, 4).map((row) => (
                    <div key={row.id} className="tt-preview-lab-row">
                      <strong>{labDateLabel(row) || "Lab row"}</strong>
                      <span>{(previewTimetable.labSlots || []).map((slot) => labSlotText(row.slots?.[slot.id])).filter(Boolean).join(" | ") || "No lab slots filled"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="tt-card">
          <div className="tt-card-header">
            <div className="tt-card-icon" style={{ background: "#fee2e2" }}>PDF</div>
            <h2>Export PDF Documents</h2>
          </div>
          <div className="tt-card-body">
            <div className="tt-export-grid">
              <ExportCard
                icon="TT"
                color="#6366f1"
                title="Theory Timetable"
                desc="Standard examination schedule (portrait)"
                loading={downloading === "theory"}
                onClick={() => downloadTheoryPdf()}
              />
              <ExportCard
                icon="SD"
                color="#10b981"
                title="Supervision Duties"
                desc="Includes invigilator assignments (landscape)"
                loading={downloading === "supervision"}
                onClick={() => downloadSupervisionPdf()}
              />
              <ExportCard
                icon="DS"
                color="#0f766e"
                title="Theory Duty Sheet"
                desc="Classroom duty register with blank signature columns"
                loading={downloading === "duty-sheet"}
                onClick={() => downloadTheoryDutySheetPdf()}
              />
              <ExportCard
                icon="LAB"
                color="#f59e0b"
                title="Lab Timetable"
                desc="Practical exam slots (landscape)"
                loading={downloading === "lab"}
                onClick={() => downloadLabPdf()}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <label className="tt-field">
      <span>{icon && <i>{icon}</i>} {label}</span>
      {children}
    </label>
  );
}

function StaffSelect({ value, staff, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">-</option>
      {staff.map((m) => (<option key={m._id} value={m.name}>{m.name}</option>))}
    </select>
  );
}

function ExportCard({ icon, color, title, desc, loading, onClick }) {
  return (
    <button className="tt-export-card" onClick={onClick} disabled={loading} style={{ borderColor: color + "33" }}>
      <div className="tt-export-icon" style={{ background: color + "1a", color }}>{icon}</div>
      <div className="tt-export-info">
        <div className="tt-export-title">{title}</div>
        <div className="tt-export-desc">{desc}</div>
      </div>
      <div className="tt-export-action" style={{ background: color }}>
        {loading ? <div className="tt-spinner" /> : "PDF"}
      </div>
    </button>
  );
}

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ PDF Helpers (unchanged) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
function makeDoc(orientation) { const doc = new jsPDF(orientation, "pt", "a4"); doc.setFont("times", "normal"); return doc; }
async function drawHeader(doc, settings, title, options = {}) {
  const width = doc.internal.pageSize.getWidth();
  await addVjtiLogoToPdf(doc, { x: 54, y: 30, width: 42, height: 42 });
  doc.setFont("times", "bold"); doc.setFontSize(12);
  doc.text("VEERMATA JIJABAI TECHNOLOGICAL INSTITUTE", width / 2, 46, { align: "center" });
  doc.setFontSize(8);
  doc.text("MATUNGA, MUMBAI - 400019", width / 2, 58, { align: "center" });
  doc.setFontSize(10);
  doc.text("DEPARTMENT OF MASTER OF COMPUTER APPLICATIONS (MCA)", width / 2, 78, { align: "center" });
  if (options.showSupervision) {
    doc.setTextColor(255, 0, 0);
    doc.text("Supervision Duties", width / 2, 94, { align: "center" });
    doc.setTextColor(0, 0, 0);
  }
  doc.setFontSize(16);
  doc.text(title, width / 2, options.showSupervision ? 126 : 112, { align: "center" });
}
function drawTheoryFooter(doc) {
  const baseY = Math.max(doc.lastAutoTable.finalY + 54, 360);
  doc.setFont("times", "normal"); doc.setFontSize(11);
  doc.text("Exam Coordinator", 104, baseY);
  doc.text("Head of Department", 370, baseY);
  doc.text("To,", 104, baseY + 64);
  doc.text("The Dean AP", 104, baseY + 80);
  doc.text("For approval", 104, baseY + 96);
}
function drawWideFooter(doc) {
  const height = doc.internal.pageSize.getHeight();
  doc.setFont("times", "normal"); doc.setFontSize(11);
  doc.text("Exam Coordinator", 54, height - 40);
  doc.text("Head of Department", 680, height - 40);
}
function timetableTitle(s) {
  const semLabel = s.semester.replace("Sem ", "Sem-");
  const examLabel = s.examType === "MST" ? "Mid Semester Examination" : s.examType === "Re-ESE" ? "Re-End Semester Examination" : "End Semester Examination";
  return `${examLabel} ${s.month} ${s.year} (${s.term}- ${semLabel})`;
}
function labExamLabel(s) {
  if (s.examType === "MST") return "Mid Semester";
  if (s.examType === "Re-ESE") return "Re-End Semester";
  return "End Semester";
}
function labTermLabel(term) {
  return String(term || "").toUpperCase().replace(" TERM", "");
}
function labSemesterLabel(sem) {
  const value = String(sem || "").match(/[IVX]+$/)?.[0] || "";
  const romanToNumber = { I: "1", II: "2", III: "3", IV: "4" };
  return value ? `Sem-${romanToNumber[value] || value}` : String(sem || "").replace("Sem ", "Sem-");
}
function classLabel(sem) { return (sem === "Sem I" || sem === "Sem II") ? "FYMCA" : "SYMCA"; }
function courseLine(row) {
  return [
    [row.courseCode, row.courseTitle].filter(Boolean).join(" "),
    [row.courseCode2, row.courseTitle2].filter(Boolean).join(" "),
  ].filter(Boolean).join("\n");
}
function displayDate(value) {
  if (!value) return "";
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}
function formatLabDate(value) {
  if (!value) return "";
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  const date = new Date(y, m - 1, d);
  const day = date.toLocaleDateString("en-US", { weekday: "long" });
  return `${day}\n${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}
function labDateLabel(row) {
  return row?.dayDate || formatLabDate(row?.date);
}
function labTableBody(rows, slots) {
  return rows.map((row, idx) => {
    const currentDate = labDateLabel(row);
    const previousDate = idx > 0 ? labDateLabel(rows[idx - 1]) : "";
    const isFirstInGroup = currentDate !== previousDate;
    const slotCells = slots.map((slot) => labSlotText(row.slots?.[slot.id]));

    if (!isFirstInGroup) return slotCells;

    let groupSize = 1;
    for (let nextIdx = idx + 1; nextIdx < rows.length; nextIdx += 1) {
      if (labDateLabel(rows[nextIdx]) !== currentDate) break;
      groupSize += 1;
    }

    return [
      { content: currentDate, rowSpan: groupSize, styles: { halign: "center", valign: "middle" } },
      ...slotCells,
    ];
  });
}
function theoryDutySheetBody(rows) {
  return rows.flatMap((row) => {
    const sharedCellStyles = { halign: "center", valign: "middle" };
    return [
      [
        { content: displayDate(row.date), rowSpan: 2, styles: sharedCellStyles },
        { content: courseLine(row), rowSpan: 2, styles: { valign: "middle" } },
        "AL301",
        row.roomA || "",
        "",
        row.reliever || "",
        { content: "", rowSpan: 2 },
        { content: "", rowSpan: 2 },
        { content: "", rowSpan: 2 },
        { content: "", rowSpan: 2 },
        { content: "", rowSpan: 2 },
        { content: "", rowSpan: 2 },
        { content: "", rowSpan: 2 },
      ],
      ["AL207", row.roomB || "", "", ""],
    ];
  });
}
function theoryDutySheetColumnStyles() {
  const widths = [58, 122, 44, 72, 46, 68, 46, 68, 48, 54, 66, 48, 48];
  return widths.reduce((styles, cellWidth, index) => {
    styles[index] = {
      cellWidth,
      halign: index === 1 || index === 3 ? "left" : "center",
    };
    return styles;
  }, {});
}
function todayInput() { return new Date().toISOString().slice(0, 10); }
function tableStyles(fs) { return { font: "times", fontSize: fs, textColor: [0,0,0], lineColor: [0,0,0], lineWidth: 0.35, cellPadding: 5, valign: "middle" }; }
function headStyles() { return { fillColor: [255,255,255], textColor: [0,0,0], fontStyle: "bold", halign: "center" }; }
function labColumnStyles(slotCount) {
  const usableWidth = 734;
  const dateWidth = 78;
  const slotWidth = (usableWidth - dateWidth) / Math.max(slotCount, 1);
  return Array.from({ length: slotCount + 1 }).reduce((styles, _, idx) => {
    styles[idx] = idx === 0
      ? { cellWidth: dateWidth, halign: "center" }
      : { cellWidth: slotWidth };
    return styles;
  }, {});
}
function normalizeLabSlotValue(value) {
  if (!value) return { subject: "", rollNo: "" };
  if (typeof value === "string") return { subject: value, rollNo: "" };
  return {
    subject: value.subject || "",
    rollNo: value.rollNo || "",
  };
}
function legacyLabSlotSubject(value) {
  return normalizeLabSlotValue(value).subject;
}
function labSlotText(value) {
  const slot = normalizeLabSlotValue(value);
  return [slot.subject, slot.rollNo].filter(Boolean).join("\n");
}
function slotColor(idx) {
  const colors = [
    { bg: "#dbeafe", fg: "#1e40af" },
    { bg: "#fef3c7", fg: "#92400e" },
    { bg: "#fce7f3", fg: "#9d174d" },
    { bg: "#dcfce7", fg: "#166534" },
    { bg: "#ede9fe", fg: "#5b21b6" },
    { bg: "#e0f2fe", fg: "#075985" },
  ];
  return colors[idx % colors.length];
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }

  .tt-root {
    min-height: 100vh;
    background: #f0f4ff;
    color: #0f172a;
    font-family: 'Inter', Arial, sans-serif;
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ TOP BAR Ã¢â€â‚¬Ã¢â€â‚¬ */
  .tt-topbar {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%);
    padding: 0 32px;
    min-height: 72px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 4px 24px rgba(67,56,202,.35);
  }
  .tt-topbar-left { display: flex; align-items: center; gap: 16px; }
  .tt-logo {
    width: 44px; height: 44px;
    background: rgba(255,255,255,.15);
    border: 1px solid rgba(255,255,255,.2);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
    backdrop-filter: blur(8px);
  }
  .tt-brand { color: #fff; }
  .tt-brand-sub { font-size: 11px; font-weight: 500; color: rgba(255,255,255,.65); letter-spacing: .5px; }
  .tt-brand-title { font-size: 18px; font-weight: 700; }
  .tt-topbar-right { display: flex; align-items: center; gap: 10px; }
  .tt-info-pill {
    display: flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.2);
    color: #fff;
    padding: 8px 14px;
    border-radius: 20px;
    font-size: 12px; font-weight: 600;
    backdrop-filter: blur(8px);
  }
  .tt-pill-dot { width: 8px; height: 8px; border-radius: 50%; }
  .tt-back-btn {
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.2);
    color: #fff;
    padding: 9px 16px;
    border-radius: 10px;
    font-size: 13px; font-weight: 600;
    cursor: pointer;
    transition: all .2s;
    backdrop-filter: blur(8px);
    font-family: inherit;
  }
  .tt-back-btn:hover { background: rgba(255,255,255,.22); transform: translateX(-2px); }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ MAIN Ã¢â€â‚¬Ã¢â€â‚¬ */
  .tt-main {
    padding: 28px 32px 48px;
    max-width: 1400px;
    margin: 0 auto;
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ CARDS Ã¢â€â‚¬Ã¢â€â‚¬ */
  .tt-card {
    background: #fff;
    border: 1px solid #e2e8f4;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 20px;
    box-shadow: 0 1px 8px rgba(0,0,0,.05), 0 4px 16px rgba(67,56,202,.04);
    transition: box-shadow .2s;
  }
  .tt-card:hover { box-shadow: 0 2px 16px rgba(0,0,0,.08), 0 6px 24px rgba(67,56,202,.07); }
  .tt-card-header {
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
    background: linear-gradient(135deg, #fafbff 0%, #f8faff 100%);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .tt-card-icon {
    width: 34px; height: 34px;
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 17px;
    flex-shrink: 0;
  }
  .tt-card-header h2 {
    margin: 0;
    font-size: 14px; font-weight: 700;
    color: #1e293b;
    flex: 1;
  }
  .tt-card-badge {
    font-size: 11px; font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;
  }
  .tt-card-body { padding: 22px; }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ SECTION DIVIDERS Ã¢â€â‚¬Ã¢â€â‚¬ */
  .tt-section-divider {
    display: flex; align-items: center; gap: 10px;
    margin: 0 0 14px;
  }
  .tt-section-divider span {
    font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .6px;
    color: #94a3b8; white-space: nowrap;
  }
  .tt-section-divider::before, .tt-section-divider::after {
    content: ''; flex: 1; height: 1px; background: #e2e8f0;
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ CHIPS Ã¢â€â‚¬Ã¢â€â‚¬ */
  .tt-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .tt-chip {
    padding: 9px 16px;
    border-radius: 24px;
    font-size: 13px; font-weight: 600;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all .18s;
    font-family: inherit;
    display: flex; align-items: center; gap: 6px;
  }
  .tt-chip:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.1); }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ GRID Ã¢â€â‚¬Ã¢â€â‚¬ */
  .tt-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ FIELD Ã¢â€â‚¬Ã¢â€â‚¬ */
  .tt-field { display: flex; flex-direction: column; gap: 6px; }
  .tt-field span {
    font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .6px;
    color: #64748b;
    display: flex; align-items: center; gap: 4px;
  }
  .tt-field span i { font-style: normal; font-size: 13px; }
  .tt-field input,
  .tt-field select {
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    padding: 11px 14px;
    font-size: 14px;
    font-family: inherit;
    background: #fff;
    color: #0f172a;
    outline: none;
    transition: border-color .2s, box-shadow .2s;
  }
  .tt-field input:focus, .tt-field select:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,.12);
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ PREVIEW TILE Ã¢â€â‚¬Ã¢â€â‚¬ */
  .tt-preview-tile {
    border: 1.5px solid;
    border-radius: 12px;
    padding: 12px 14px;
    display: flex; flex-direction: column; gap: 4px;
    grid-column: span 1;
  }
  .tt-preview-label {
    font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .5px;
  }
  .tt-preview-val {
    font-size: 12px; font-weight: 700;
    color: #1e293b;
    line-height: 1.4;
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ TABS Ã¢â€â‚¬Ã¢â€â‚¬ */
  .tt-tabs {
    display: flex;
    gap: 4px;
    background: #fff;
    border: 1px solid #e2e8f4;
    border-radius: 12px;
    padding: 4px;
    margin-bottom: 20px;
    box-shadow: 0 1px 8px rgba(0,0,0,.04);
  }
  .tt-tab {
    flex: 1;
    border: none;
    background: transparent;
    padding: 12px 16px;
    border-radius: 9px;
    font-size: 14px; font-weight: 600;
    color: #64748b;
    cursor: pointer;
    transition: all .2s;
    font-family: inherit;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .tt-tab:hover { background: #f8fafc; color: #1e293b; }
  .tt-tab.active {
    background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%);
    color: #fff;
    box-shadow: 0 4px 12px rgba(99,102,241,.3);
  }

  .tt-tab-count {
    background: rgba(0,0,0,.08);
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
  }
  .tt-tab.active .tt-tab-count { background: rgba(255,255,255,.25); }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ ADD BUTTON Ã¢â€â‚¬Ã¢â€â‚¬ */
  .tt-add-btn {
    background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%);
    color: #fff;
    border: none;
    padding: 8px 14px;
    border-radius: 9px;
    font-size: 12px; font-weight: 700;
    cursor: pointer;
    transition: all .2s;
    box-shadow: 0 2px 8px rgba(99,102,241,.3);
    font-family: inherit;
  }
  .tt-add-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(99,102,241,.4); }
  .tt-add-btn.muted {
    background: #eef2ff;
    color: #4338ca;
    box-shadow: none;
  }
  .tt-add-btn.muted:hover { box-shadow: 0 4px 12px rgba(67,56,202,.15); }

  .tt-lab-slot-editor {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 10px;
  }
  .tt-lab-slot-edit {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 8px;
    background: #f8fafc;
  }
  .tt-lab-slot-edit span {
    font-size: 11px;
    font-weight: 800;
    color: #475569;
    text-transform: uppercase;
  }
  .tt-lab-slot-edit input {
    width: 100%;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 13px;
    font-family: inherit;
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ TABLE Ã¢â€â‚¬Ã¢â€â‚¬ */
  .tt-table-wrap { overflow-x: auto; }
  .tt-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    min-width: 1100px;
  }
  .tt-table th {
    background: #f8fafc;
    color: #475569;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .5px;
    padding: 12px 10px;
    text-align: left;
    border-bottom: 2px solid #e2e8f0;
    white-space: nowrap;
  }
  .tt-table td {
    padding: 10px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: top;
  }
  .tt-table tbody tr { transition: background .15s; }
  .tt-table tbody tr:hover { background: #fafbff; }
  .tt-table input, .tt-table select, .tt-table textarea {
    width: 100%;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 13px;
    font-family: inherit;
    background: #fff;
    color: #0f172a;
    outline: none;
    transition: border-color .15s, box-shadow .15s;
  }
  .tt-table input:focus, .tt-table select:focus, .tt-table textarea:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,.1);
  }
  .tt-table .tt-readonly { background: #f8fafc; color: #64748b; cursor: default; }
  .tt-inline-course-btn {
    margin-top: 6px;
    border: 0;
    background: transparent;
    color: #4338ca;
    font: inherit;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    padding: 2px 0;
  }
  .tt-inline-course-btn.remove { color: #b91c1c; }
  .tt-inline-course-btn:hover { text-decoration: underline; }
  .tt-table textarea {
    min-height: 80px;
    resize: vertical;
    font-family: inherit;
  }
  .tt-table.lab { min-width: 1000px; }
  .tt-lab-date-cell {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 160px;
  }
  .tt-lab-date-cell span {
    font-size: 12px;
    font-weight: 700;
    color: #475569;
    white-space: pre-line;
    line-height: 1.35;
  }
  .tt-lab-date-cell textarea {
    min-height: 54px;
  }
  .tt-lab-slot-cell {
    display: grid;
    gap: 8px;
    min-width: 220px;
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ ROW NUMBER Ã¢â€â‚¬Ã¢â€â‚¬ */
  .tt-row-num {
    width: 26px; height: 26px;
    border-radius: 7px;
    background: linear-gradient(135deg, #ede9fe, #e0e7ff);
    color: #4338ca;
    font-size: 12px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ SLOT PILL Ã¢â€â‚¬Ã¢â€â‚¬ */
  .tt-slot-pill {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 10px; font-weight: 700;
    margin-right: 6px;
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ ICON BUTTON Ã¢â€â‚¬Ã¢â€â‚¬ */
  .tt-icon-btn {
    width: 32px; height: 32px;
    border: none;
    border-radius: 8px;
    background: #fef2f2;
    color: #dc2626;
    cursor: pointer;
    font-size: 13px; font-weight: 700;
    transition: all .15s;
    font-family: inherit;
  }
  .tt-icon-btn:hover:not(:disabled) {
    background: #fee2e2;
    transform: scale(1.05);
  }
  .tt-icon-btn:disabled {
    opacity: .35;
    cursor: not-allowed;
  }
  .tt-mini-action {
    display: block;
    width: 78px;
    border: none;
    border-radius: 8px;
    background: #eef2ff;
    color: #4338ca;
    cursor: pointer;
    font-size: 11px;
    font-weight: 800;
    padding: 7px 8px;
    margin-bottom: 8px;
    font-family: inherit;
  }
  .tt-mini-action:hover {
    background: #e0e7ff;
  }

  .tt-empty-saved {
    padding: 18px;
    border: 1px dashed #cbd5e1;
    border-radius: 10px;
    color: #64748b;
    font-size: 13px;
    text-align: center;
  }
  .tt-saved-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .tt-saved-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    padding: 14px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #fff;
  }
  .tt-saved-title {
    font-size: 14px;
    font-weight: 800;
    color: #0f172a;
  }
  .tt-saved-meta {
    margin-top: 4px;
    font-size: 12px;
    color: #64748b;
  }
  .tt-saved-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .tt-preview-panel {
    margin-top: 18px;
    border-top: 1px solid #e2e8f0;
    padding-top: 16px;
  }
  .tt-preview-table-wrap {
    overflow-x: auto;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
  }
  .tt-preview-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 720px;
    font-size: 12px;
  }
  .tt-preview-table th,
  .tt-preview-table td {
    padding: 10px;
    border-bottom: 1px solid #e2e8f0;
    text-align: left;
  }
  .tt-preview-table th {
    background: #f8fafc;
    color: #334155;
    font-weight: 800;
  }
  .tt-preview-lab {
    display: grid;
    gap: 8px;
    margin-top: 12px;
  }
  .tt-preview-lab-row {
    display: grid;
    gap: 4px;
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #f8fafc;
    font-size: 12px;
    color: #475569;
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ EXPORT GRID Ã¢â€â‚¬Ã¢â€â‚¬ */
  .tt-export-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 14px;
  }
  .tt-export-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    background: #fff;
    border: 1.5px solid;
    border-radius: 12px;
    cursor: pointer;
    transition: all .2s;
    text-align: left;
    font-family: inherit;
  }
  .tt-export-card:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,.08);
  }
  .tt-export-card:disabled { opacity: .7; cursor: wait; }
  .tt-export-icon {
    width: 44px; height: 44px;
    border-radius: 11px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
  }
  .tt-export-info { flex: 1; min-width: 0; }
  .tt-export-title {
    font-size: 14px; font-weight: 700;
    color: #1e293b;
    margin-bottom: 2px;
  }
  .tt-export-desc {
    font-size: 12px;
    color: #64748b;
    line-height: 1.4;
  }
  .tt-export-action {
    width: 36px; height: 36px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    font-size: 18px; font-weight: 700;
    flex-shrink: 0;
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ SPINNER Ã¢â€â‚¬Ã¢â€â‚¬ */
  .tt-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: tt-spin .6s linear infinite;
  }
  @keyframes tt-spin { to { transform: rotate(360deg); } }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ RESPONSIVE Ã¢â€â‚¬Ã¢â€â‚¬ */
  @media (max-width: 960px) {
    .tt-main { padding: 16px; }
    .tt-topbar { padding: 12px 16px; flex-direction: column; align-items: flex-start; gap: 10px; }
    .tt-topbar-right { width: 100%; justify-content: space-between; }
    .tt-grid { grid-template-columns: 1fr; }
    .tt-tabs { flex-wrap: wrap; }
  }
`;
