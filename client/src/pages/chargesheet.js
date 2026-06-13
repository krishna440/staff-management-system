import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  loadTaskRates,
  TASK_RATES_CHANGED_EVENT,
  teachingRateDefaults,
} from "../utils/taskRates";
import { loadSubjectCatalog } from "../utils/subjectCatalogStorage";

const EXAM_OPTIONS = [
  {
    key: "FY_SEM_I_ESE",
    label: "FY Sem I - ESE",
    academicYear: "FY",
    semester: "Sem I",
    examType: "ESE",
    month: "January 2026",
    period: "05/01/2026 to 19/01/2026",
    color: "#6366f1",
  },
  {
    key: "FY_SEM_I_RE_ESE",
    label: "FY Sem I - Re-ESE",
    academicYear: "FY",
    semester: "Sem I",
    examType: "Re-ESE",
    month: "February 2026",
    period: "09/02/2026 to 13/02/2026",
    color: "#f59e0b",
  },
  {
    key: "SY_SEM_III_ESE",
    label: "SY Sem III - ESE",
    academicYear: "SY",
    semester: "Sem III",
    examType: "ESE",
    month: "December 2026",
    period: "December 2026",
    color: "#10b981",
  },
  {
    key: "SY_SEM_III_RE_ESE",
    label: "SY Sem III - Re-ESE",
    academicYear: "SY",
    semester: "Sem III",
    examType: "Re-ESE",
    month: "January 2026",
    period: "21/01/2026 to 27/01/2026",
    color: "#f43f5e",
  },
  {
    key: "FY_SEM_II_ESE",
    label: "FY Sem II - ESE",
    academicYear: "FY",
    semester: "Sem II",
    examType: "ESE",
    month: "May 2026",
    period: "May 2026",
    color: "#0ea5e9",
  },
  {
    key: "FY_SEM_II_RE_ESE",
    label: "FY Sem II - Re-ESE",
    academicYear: "FY",
    semester: "Sem II",
    examType: "Re-ESE",
    month: "June 2026",
    period: "June 2026",
    color: "#8b5cf6",
  },
];
const DEFAULT_EXAM_YEAR = 2026;
const EXAM_YEAR_OPTIONS = Array.from(
  { length: Math.max(6, new Date().getFullYear() - DEFAULT_EXAM_YEAR + 6) },
  (_, index) => DEFAULT_EXAM_YEAR + index
);

function replaceYearInText(value, year) {
  return String(value || "").replace(/\b2026\b/g, String(year));
}

function examOptionForYear(option, year) {
  const examYear = Number(year) || DEFAULT_EXAM_YEAR;
  return {
    ...option,
    month: replaceYearInText(option.month, examYear),
    period: replaceYearInText(option.period, examYear),
    storageKey: `${option.key}_${examYear}`,
  };
}

const COURSE_CATALOG = {
  "Sem I": [
    { code: "R5MC5011S", title: "Management Information System" },
    { code: "R5MC5012T", title: "Software Engineering & Project Management" },
    { code: "R5MC5013T", title: "Operating System" },
    { code: "R5MC5013P", title: "Operating System Lab", kind: "lab" },
    { code: "R5MC5014S", title: "Mathematical and Statistical Foundations 1" },
    { code: "R5MC5015S", title: "Accounting and Finance(MOOC)" },
    { code: "R5MC5016L", title: "Business English" },
    { code: "R5MC5017L", title: "Mobile Computing Lab", kind: "lab" },
    { code: "R5MC5018L", title: "Web Technology Lab (Node Js, Angular Js, React, Flutter)", kind: "lab" },
    { code: "R5MC5019D", title: "Mini Project I (Based on SSAD, OOAD and User Experience Design Principles)", kind: "lab" },
  ],
  "Sem II": [
    { code: "R5MC5021T", title: "Data Mining" },
    { code: "R5MC5022T", title: "Design and Analysis of Algorithm" },
    { code: "R5MC5023S", title: "Mathematical and Statistical Foundation II" },
    { code: "R5MC5027T", title: "Professional Communication" },
    { code: "R5MC5111S", title: "Computer Graphics & Animation" },
    { code: "R5MC5112S", title: "Digital Forensics" },
    { code: "R5MC5113S", title: "Cloud Computing" },
    { code: "R5MC5114S", title: "Data Warehousing" },
    { code: "R5MC5115S", title: "Entrepreneurship Management and IPR" },
    { code: "R5MC5121T", title: "Multimedia System" },
    { code: "R5MC5122T", title: "Image Processing" },
    { code: "R5MC5123T", title: "Software Design and Pattern" },
    { code: "R5MC5124T", title: "Ethical Hacking" },
    { code: "R5MC5125T", title: "Internet of Things" },
    { code: "R5MC5121P", title: "Multimedia System Lab", kind: "lab" },
    { code: "R5MC5122P", title: "Image Processing Lab", kind: "lab" },
    { code: "R5MC5123P", title: "Software Design and Pattern Lab", kind: "lab" },
    { code: "R5MC5124P", title: "Ethical Hacking Lab", kind: "lab" },
    { code: "R5MC5125P", title: "Internet of Things Lab", kind: "lab" },
    { code: "R5MC5021P", title: "Data Mining Lab", kind: "lab" },
    { code: "R5MC5022P", title: "Design and Analysis of Algorithm Lab", kind: "lab" },
    { code: "R5MC5025L", title: "Java and Python Lab", kind: "lab" },
    { code: "R5MC5026D", title: "Mini Project 2 (Based on RDBMS and User Experience Design Principles)", kind: "lab" },
  ],
  "Sem III": [
    { code: "R5MC6011T", title: "Big Data Analytics and Visualization" },
    { code: "R5MC6011P", title: "Big Data Analytics and Visualization Lab", kind: "lab" },
    { code: "R5MC6012T", title: "Artificial Intelligence and Machine learning" },
    { code: "R5MC6012P", title: "Artificial Intelligence and Machine learning Lab", kind: "lab" },
    { code: "R5MC6013S", title: "Data Science" },
    { code: "R5MC6014T", title: "Information and network security" },
    { code: "R5MC6014P", title: "Information and network security Lab", kind: "lab" },
    { code: "R5MC6111T", title: "Geographic Information Systems" },
    { code: "R5MC6111P", title: "Geographic Information Systems Lab", kind: "lab" },
    { code: "R5MC6112T", title: "Gaming Technology" },
    { code: "R5MC6112P", title: "Gaming Technology Lab", kind: "lab" },
    { code: "R5MC6113T", title: "Robotics" },
    { code: "R5MC6113P", title: "Robotics Lab", kind: "lab" },
    { code: "R5MC6115T", title: "Deep learning" },
    { code: "R5MC6115P", title: "Deep learning Lab", kind: "lab" },
  ],
};

const STATIC_FORM_FIELDS = {
  staffId: "",
  staffName: "",
  designation: "",
  courseKey: "",
  courseCode: "",
  courseTitle: "",
  paperSets: 0,
  assessments: 0,
  examConduction: 0,
  invigilation: 0,
  dutyRole: "",
  dutyDates: "",
  dutyDays: 0,
  dutyRate: 0,
};

const RELIEVER_ROOMS = ["AL301", "AL207"];
const EXAM_PERIOD_STORAGE_KEY = "mca_exam_period_ranges_v1";
const LAB_EXAM_PERIOD_STORAGE_KEY = "mca_lab_exam_period_ranges_v1";

function assessmentAmountForEntry(entry) {
  const assessments = Number(entry.assessments || 0);
  const amount = assessments * Number(entry.assessmentRate || 0);
  if (assessments > 0 && entry.examType === "Re-ESE") {
    return Math.max(amount, 200);
  }
  return amount;
}

function paperSettingAmountForEntry(entry) {
  return Number(entry.paperSets || 0) * Number(entry.paperSetRate || 0);
}

function emptyChargeForm() {
  const first = EXAM_OPTIONS[0];
  const range = examRangeFor(first);
  const labRange = labExamRangeFor(first);
  return {
    ...STATIC_FORM_FIELDS,
    examKey: first.key,
    examStartDate: range.start,
    examEndDate: range.end,
    examPeriod: examPeriodText(range, first.period),
    examMonth: monthLabelFromDateKey(range.start, first.month),
    labExamStartDate: labRange.start,
    labExamEndDate: labRange.end,
    labExamPeriod: examPeriodText(labRange, ""),
    ...teachingRateDefaults(),
  };
}

function formatDdMmYyyyFromKey(dateKey) {
  const parts = dateKey.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return "";
  const [y, m, d] = parts;
  return [
    String(d).padStart(2, "0"),
    String(m).padStart(2, "0"),
    y,
  ].join(".");
}

function dateKeyFromDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function dateFromDateKey(dateKey) {
  const parts = String(dateKey || "").split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function monthLabelFromDateKey(dateKey, fallback = "") {
  const date = dateFromDateKey(dateKey);
  return date ? date.toLocaleString("en-IN", { month: "long", year: "numeric" }) : fallback;
}

function parseDateText(value) {
  const match = String(value || "").match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (!match) return null;
  const [, day, month, year] = match.map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function parseMonthText(value) {
  const date = new Date(`1 ${String(value || "").trim()}`);
  if (Number.isNaN(date.getTime())) return null;
  return {
    start: new Date(date.getFullYear(), date.getMonth(), 1),
    end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
  };
}

function examDateBounds(period, month) {
  const dateMatches = String(period || "").match(/\d{1,2}[./-]\d{1,2}[./-]\d{4}/g) || [];
  if (dateMatches.length >= 2) {
    const start = parseDateText(dateMatches[0]);
    const end = parseDateText(dateMatches[1]);
    if (start && end) return start <= end ? { start, end } : { start: end, end: start };
  }
  return parseMonthText(period) || parseMonthText(month);
}

function loadStoredExamPeriods() {
  try {
    const stored = JSON.parse(localStorage.getItem(EXAM_PERIOD_STORAGE_KEY) || "{}");
    return stored && typeof stored === "object" ? stored : {};
  } catch {
    return {};
  }
}

function saveStoredExamPeriod(examKey, range) {
  const stored = loadStoredExamPeriods();
  stored[examKey] = range;
  localStorage.setItem(EXAM_PERIOD_STORAGE_KEY, JSON.stringify(stored));
}

function loadStoredLabExamPeriods() {
  try {
    const stored = JSON.parse(localStorage.getItem(LAB_EXAM_PERIOD_STORAGE_KEY) || "{}");
    return stored && typeof stored === "object" ? stored : {};
  } catch {
    return {};
  }
}

function saveStoredLabExamPeriod(examKey, range) {
  const stored = loadStoredLabExamPeriods();
  stored[examKey] = range;
  localStorage.setItem(LAB_EXAM_PERIOD_STORAGE_KEY, JSON.stringify(stored));
}

function storedPeriodKey(exam) {
  return exam.storageKey || exam.key;
}

function defaultExamRange(exam) {
  const bounds = examDateBounds(exam.period, exam.month);
  return {
    start: bounds?.start ? dateKeyFromDate(bounds.start) : "",
    end: bounds?.end ? dateKeyFromDate(bounds.end) : "",
  };
}

function examRangeFor(exam) {
  const stored = loadStoredExamPeriods()[storedPeriodKey(exam)];
  if (stored?.start && stored?.end) return stored;
  return defaultExamRange(exam);
}

function labExamRangeFor(exam) {
  const stored = loadStoredLabExamPeriods()[storedPeriodKey(exam)];
  if (stored?.start && stored?.end) return stored;
  return { start: "", end: "" };
}

function examPeriodText(range, fallback = "") {
  return range?.start && range?.end
    ? `${formatDdMmYyyyFromKey(range.start)} to ${formatDdMmYyyyFromKey(range.end)}`
    : fallback;
}

/** Monday-first weekday index (0 = Monday, 6 = Sunday). */
function mondayWeekdayIndex(dayOfWeekSundayZero) {
  return (dayOfWeekSundayZero + 6) % 7;
}

function DutyExamCalendar({ value, onChange, accent, bounds }) {
  const selected = useMemo(() => new Set(value), [value]);
  const minKey = bounds?.start ? dateKeyFromDate(bounds.start) : "";
  const maxKey = bounds?.end ? dateKeyFromDate(bounds.end) : "";
  const startYear = bounds?.start?.getFullYear();
  const startMonth = bounds?.start?.getMonth();

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  useEffect(() => {
    if (startYear === undefined || startMonth === undefined) return;
    setCursor({ year: startYear, month: startMonth });
  }, [startYear, startMonth]);

  const monthMeta = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const last = new Date(cursor.year, cursor.month + 1, 0);
    const daysInMonth = last.getDate();
    const pad = mondayWeekdayIndex(first.getDay());
    return { daysInMonth, pad, monthLabel: first.toLocaleString("en-IN", { month: "long", year: "numeric" }) };
  }, [cursor.year, cursor.month]);

  const padCells = [];
  const dayCells = [];
  for (let i = 0; i < monthMeta.pad; i += 1) padCells.push(null);
  for (let day = 1; day <= monthMeta.daysInMonth; day += 1) dayCells.push(day);

  const toggle = (day) => {
    const key = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if ((minKey && key < minKey) || (maxKey && key > maxKey)) return;
    const next = new Set(value);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(Array.from(next).sort());
  };

  const shiftMonth = (delta) => {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="cs-duty-cal">
      <div className="cs-duty-cal-head">
        <button type="button" className="cs-duty-cal-nav" onClick={() => shiftMonth(-1)} aria-label="Previous month">
          &lt;
        </button>
        <span className="cs-duty-cal-title">{monthMeta.monthLabel}</span>
        <button type="button" className="cs-duty-cal-nav" onClick={() => shiftMonth(1)} aria-label="Next month">
          &gt;
        </button>
      </div>
      <div className="cs-duty-cal-weekdays">
        {WEEK_DAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="cs-duty-cal-grid">
        {padCells.map((_, idx) => (
          <span key={`p-${idx}`} className="cs-duty-cal-cell cs-duty-cal-muted" />
        ))}
        {dayCells.map((day) => {
          const key = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const active = selected.has(key);
          const blocked = (minKey && key < minKey) || (maxKey && key > maxKey);
          return (
            <button
              key={key}
              type="button"
              className={`cs-duty-cal-cell cs-duty-cal-day${active ? " is-selected" : ""}${blocked ? " is-disabled" : ""}`}
              style={active ? { background: accent, borderColor: accent, color: "#fff" } : undefined}
              disabled={blocked}
              onClick={() => toggle(day)}
            >
              {day}
            </button>
          );
        })}
      </div>
      <p className="cs-duty-cal-hint">
        Select dates within the exam period
        {bounds?.start && bounds?.end ? ` (${formatDdMmYyyyFromKey(minKey)} to ${formatDdMmYyyyFromKey(maxKey)}).` : "."}
      </p>
    </div>
  );
}

function ExamPeriodRangeCalendar({ value, onChange, accent, fallbackMonth }) {
  const fallbackCursor = useMemo(() => {
    const date = parseMonthText(fallbackMonth)?.start || new Date();
    return { year: date.getFullYear(), month: date.getMonth() };
  }, [fallbackMonth]);
  const activeCursor = useMemo(() => {
    const startDate = dateFromDateKey(value?.start);
    return startDate
      ? { year: startDate.getFullYear(), month: startDate.getMonth() }
      : fallbackCursor;
  }, [value?.start, fallbackCursor]);
  const [cursor, setCursor] = useState(activeCursor);

  useEffect(() => {
    setCursor(activeCursor);
  }, [activeCursor]);

  const monthMeta = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const last = new Date(cursor.year, cursor.month + 1, 0);
    const daysInMonth = last.getDate();
    const pad = mondayWeekdayIndex(first.getDay());
    return { daysInMonth, pad, monthLabel: first.toLocaleString("en-IN", { month: "long", year: "numeric" }) };
  }, [cursor.year, cursor.month]);

  const selectDay = (day) => {
    const key = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (!value?.start || (value.start && value.end)) {
      onChange({ start: key, end: "" });
      return;
    }

    onChange(key < value.start ? { start: key, end: value.start } : { start: value.start, end: key });
  };

  const shiftMonth = (delta) => {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const padCells = Array.from({ length: monthMeta.pad }, () => null);
  const dayCells = Array.from({ length: monthMeta.daysInMonth }, (_, index) => index + 1);

  return (
    <div className="cs-duty-cal cs-range-cal">
      <div className="cs-duty-cal-head">
        <button type="button" className="cs-duty-cal-nav" onClick={() => shiftMonth(-1)} aria-label="Previous month">
          &lt;
        </button>
        <span className="cs-duty-cal-title">{monthMeta.monthLabel}</span>
        <button type="button" className="cs-duty-cal-nav" onClick={() => shiftMonth(1)} aria-label="Next month">
          &gt;
        </button>
      </div>
      <div className="cs-duty-cal-weekdays">
        {WEEK_DAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="cs-duty-cal-grid">
        {padCells.map((_, idx) => (
          <span key={`p-${idx}`} className="cs-duty-cal-cell cs-duty-cal-muted" />
        ))}
        {dayCells.map((day) => {
          const key = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isEndpoint = key === value?.start || key === value?.end;
          const inRange = value?.start && value?.end && key > value.start && key < value.end;
          return (
            <button
              key={key}
              type="button"
              className={`cs-duty-cal-cell cs-duty-cal-day${isEndpoint ? " is-selected" : ""}${inRange ? " is-range" : ""}`}
              style={isEndpoint ? { background: accent, borderColor: accent, color: "#fff" } : undefined}
              onClick={() => selectDay(day)}
            >
              {day}
            </button>
          );
        })}
      </div>
      <p className="cs-duty-cal-hint">Click the start date, then click the end date. Selecting again starts a new range.</p>
    </div>
  );
}

const Chargesheet = () => {
  const [staff, setStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [saving, setSaving] = useState(false);  
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => emptyChargeForm());
  const [examYear, setExamYear] = useState(() => {
    const startDate = dateFromDateKey(emptyChargeForm().examStartDate);
    return startDate?.getFullYear() || DEFAULT_EXAM_YEAR;
  });
  const [taskRateConfig, setTaskRateConfig] = useState(() => loadTaskRates());
  const [subjectCatalog, setSubjectCatalog] = useState(() => loadSubjectCatalog(COURSE_CATALOG));
  const navigate = useNavigate();
  const [dutyDateKeys, setDutyDateKeys] = useState([]);
  const [relieverRoomsByDate, setRelieverRoomsByDate] = useState({});

  const dutySortedKeys = useMemo(() => [...dutyDateKeys].sort(), [dutyDateKeys]);
  const dutyDatesJoined = useMemo(
    () => dutySortedKeys.map(formatDdMmYyyyFromKey).filter(Boolean).join(", "),
    [dutySortedKeys]
  );
  const dutyDaysFromCalendar = dutySortedKeys.length;

  const dutyRoleOptions = taskRateConfig.duties;

  const selectedDutyRole = useMemo(
    () => dutyRoleOptions.find((o) => o.label === form.dutyRole),
    [dutyRoleOptions, form.dutyRole]
  );
  const isRelieverDuty = selectedDutyRole?.key === "reliever";

  const examOptionsForYear = useMemo(
    () => EXAM_OPTIONS.map((option) => examOptionForYear(option, examYear)),
    [examYear]
  );

  const selectedExam = useMemo(
    () => examOptionsForYear.find((o) => o.key === form.examKey) || examOptionsForYear[0],
    [examOptionsForYear, form.examKey]
  );
  const selectedExamRange = useMemo(
    () => ({ start: form.examStartDate || "", end: form.examEndDate || "" }),
    [form.examStartDate, form.examEndDate]
  );
  const selectedLabExamRange = useMemo(
    () => ({ start: form.labExamStartDate || "", end: form.labExamEndDate || "" }),
    [form.labExamStartDate, form.labExamEndDate]
  );

  const dutyDateBounds = useMemo(
    () => examDateBounds(form.examPeriod || selectedExam.period, form.examMonth || selectedExam.month),
    [form.examPeriod, form.examMonth, selectedExam.period, selectedExam.month]
  );

  const selectedCourses = useMemo(
    () => subjectCatalog[selectedExam.semester] || [],
    [selectedExam.semester, subjectCatalog]
  );

  const selectedCourse = useMemo(
    () => selectedCourses.find((c) => c.code === form.courseKey || c.code === form.courseCode),
    [selectedCourses, form.courseKey, form.courseCode]
  );

  const isLabCourse = selectedCourse?.kind === "lab";
  const [showExamPeriodPicker, setShowExamPeriodPicker] = useState(false);
  const [showLabExamPeriodPicker, setShowLabExamPeriodPicker] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (!dutyDateBounds?.start || !dutyDateBounds?.end) return;
    const minKey = dateKeyFromDate(dutyDateBounds.start);
    const maxKey = dateKeyFromDate(dutyDateBounds.end);
    setDutyDateKeys((prev) => prev.filter((key) => key >= minKey && key <= maxKey));
  }, [dutyDateBounds]);

  useEffect(() => {
    setRelieverRoomsByDate((prev) => {
      const selected = new Set(dutyDateKeys);
      return Object.fromEntries(
        Object.entries(prev).filter(([dateKey]) => selected.has(dateKey))
      );
    });
  }, [dutyDateKeys]);

  useEffect(() => {
    const syncSubjects = () => setSubjectCatalog(loadSubjectCatalog(COURSE_CATALOG));
    window.addEventListener("storage", syncSubjects);
    window.addEventListener("mca-subject-catalog-changed", syncSubjects);
    return () => {
      window.removeEventListener("storage", syncSubjects);
      window.removeEventListener("mca-subject-catalog-changed", syncSubjects);
    };
  }, []);

  useEffect(() => {
    const syncRates = () => {
      const r = loadTaskRates();
      setTaskRateConfig(r);
      setForm((p) => {
        const duty = r.duties.find((d) => d.label === p.dutyRole);
        return {
          ...p,
          paperSetRate: r.paperSettingPerSet,
          assessmentRate: r.assessmentPerPaper,
          ...(duty ? { dutyRate: duty.rate } : {}),
        };
      });
    };
    window.addEventListener(TASK_RATES_CHANGED_EVENT, syncRates);
    window.addEventListener("storage", syncRates);
    return () => {
      window.removeEventListener(TASK_RATES_CHANGED_EVENT, syncRates);
      window.removeEventListener("storage", syncRates);
    };
  }, []);

  const fetchStaff = async () => {
    try {
      setLoadingStaff(true);
      const res = await axios.get("https://staff-management-system-eluv.onrender.com/api/staff");
      setStaff(res.data);
    } catch {
      setError("Failed to load staff list.");
    } finally {
      setLoadingStaff(false);
    }
  };

  const applyExamSelection = (nextExam) => {
    const range = examRangeFor(nextExam);
    const labRange = labExamRangeFor(nextExam);
    setForm((p) => ({
      ...p,
      examKey: nextExam.key,
      examStartDate: range.start,
      examEndDate: range.end,
      examPeriod: examPeriodText(range, nextExam.period),
      examMonth: monthLabelFromDateKey(range.start, nextExam.month),
      labExamStartDate: labRange.start,
      labExamEndDate: labRange.end,
      labExamPeriod: examPeriodText(labRange, ""),
      courseKey: "",
      courseCode: "",
      courseTitle: "",
    }));
    setShowExamPeriodPicker(false);
    setShowLabExamPeriodPicker(false);
  };

  const handleExamYearChange = (e) => {
    const nextYear = Number(e.target.value) || DEFAULT_EXAM_YEAR;
    setExamYear(nextYear);
    const baseExam = EXAM_OPTIONS.find((o) => o.key === form.examKey) || EXAM_OPTIONS[0];
    applyExamSelection(examOptionForYear(baseExam, nextYear));
    setError("");
    setSaved(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "examKey") {
      const nextExam = examOptionsForYear.find((o) => o.key === value) || examOptionsForYear[0];
      applyExamSelection(nextExam);
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
    setError("");
    setSaved(false);
  };

  const handleExamRangeChange = (range) => {
    setForm((p) => ({
      ...p,
      examStartDate: range.start || "",
      examEndDate: range.end || "",
      examPeriod: examPeriodText(range, selectedExam.period),
      examMonth: monthLabelFromDateKey(range.start, selectedExam.month),
    }));
    if (range.start && range.end) {
      saveStoredExamPeriod(storedPeriodKey(selectedExam), range);
      setShowExamPeriodPicker(false);
    }
    setDutyDateKeys([]);
    setRelieverRoomsByDate({});
    setError("");
    setSaved(false);
  };

  const handleLabExamRangeChange = (range) => {
    setForm((p) => ({
      ...p,
      labExamStartDate: range.start || "",
      labExamEndDate: range.end || "",
      labExamPeriod: examPeriodText(range, ""),
    }));
    if (range.start && range.end) {
      saveStoredLabExamPeriod(storedPeriodKey(selectedExam), range);
      setShowLabExamPeriodPicker(false);
    }
    setError("");
    setSaved(false);
  };

  const handleCourseSelect = (e) => {
    const selected = selectedCourses.find((c) => c.code === e.target.value);
    setForm((p) => ({
      ...p,
      courseKey: selected?.code || "",
      courseCode: selected?.code || "",
      courseTitle: selected?.title || "",
      paperSets: selected?.kind === "lab" ? 0 : p.paperSets,
    }));
    setError("");
    setSaved(false);
  };

  const handleStaffSelect = (e) => {
    const selected = staff.find((s) => s._id === e.target.value);
    if (!selected) {
      setForm((p) => ({ ...p, staffId: "", staffName: "", designation: "" }));
      return;
    }
    setForm((p) => ({
      ...p,
      staffId: selected._id,
      staffName: selected.name,
      designation: selected.type.toLowerCase(),
    }));
  };

  const setCount = (field, delta) => {
    setForm((p) => ({ ...p, [field]: Math.max(0, Number(p[field] || 0) + delta) }));
    setSaved(false);
  };

  const setCountValue = (field, value) => {
    const numericValue = value === "" ? "" : Math.max(0, Number(value || 0));
    setForm((p) => ({ ...p, [field]: numericValue }));
    setSaved(false);
  };

  const toggleRelieverRoom = (dateKey, room) => {
    setRelieverRoomsByDate((prev) => {
      const rooms = new Set(prev[dateKey] || []);
      if (rooms.has(room)) {
        rooms.delete(room);
      } else {
        rooms.add(room);
      }

      const next = { ...prev };
      if (rooms.size) {
        next[dateKey] = Array.from(rooms);
      } else {
        delete next[dateKey];
      }
      return next;
    });
    setSaved(false);
    setError("");
  };

  const handleSubmit = async () => {
    if (!form.staffId) { setError("Please select a staff member before saving."); return; }
    if (!form.examStartDate || !form.examEndDate) {
      setError("Please select both start and end dates for the exam period.");
      return;
    }
    const teachingWorkload =
      Number(form.paperSets || 0) > 0 || Number(form.assessments || 0) > 0;
    if (
      form.designation === "teaching" &&
      teachingWorkload &&
      (!form.courseCode.trim() || !form.courseTitle.trim())
    ) {
      setError("Please select a subject when entering paper setting or assessment amounts.");
      return;
    }
    if (isRelieverDuty) {
      if (relieverSessionCount === 0) {
        setError("Please select at least one classroom for reliever duty.");
        return;
      }
      if (relieverSessionCount % 2 !== 0) {
        setError("Reliever classroom selections must be even because 2 reliever sessions = 1 paid day.");
        return;
      }
    }
    try {
      setSaving(true);
      setError("");
      await axios.post("https://staff-management-system-eluv.onrender.com/api/chargesheet", {
        ...form,
        dutyDates: dutyDatesJoined,
        dutyDays: dutyDaysFromCalendar,
        payableDutyDays,
        relieverAssignments: isRelieverDuty ? relieverAssignments : [],
        relieverSessionCount: isRelieverDuty ? relieverSessionCount : 0,
        paperSets: isLabCourse ? 0 : form.paperSets,
        academicYear: selectedExam.academicYear,
        semester: selectedExam.semester,
        examType: selectedExam.examType,
        examMonth: form.examMonth || selectedExam.month,
        examPeriod: form.examPeriod || selectedExam.period,
        labExamStartDate: form.labExamStartDate || "",
        labExamEndDate: form.labExamEndDate || "",
        labExamPeriod: form.labExamPeriod || "",
        examLabel: selectedExam.label,
        month: form.examMonth || selectedExam.month,
      });
      setSaved(true);
      navigate("/");
    } catch {
      setError("Failed to save exam sheet. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(emptyChargeForm());
    setDutyDateKeys([]);
    setRelieverRoomsByDate({});
    setShowExamPeriodPicker(false);
    setShowLabExamPeriodPicker(false);
    setSaved(false);
    setError("");
  };

  const handleDutyRoleChange = (e) => {
    const opt = dutyRoleOptions.find((o) => o.key === e.target.value);
    setForm((p) => ({
      ...p,
      dutyRole: opt?.label || "",
      dutyRate: opt ? opt.rate : 0,
    }));
    if (opt?.key !== "reliever") setRelieverRoomsByDate({});
    setSaved(false);
    setError("");
  };

  const fmt = (val) => Number(val || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const paperAmt = isLabCourse ? 0 : paperSettingAmountForEntry({
    ...form,
    examType: selectedExam.examType,
  });
  const assessmentAmt = assessmentAmountForEntry({
    ...form,
    examType: selectedExam.examType,
  });
  const relieverAssignments = dutySortedKeys
    .map((dateKey) => ({
      date: formatDdMmYyyyFromKey(dateKey),
      rooms: relieverRoomsByDate[dateKey] || [],
    }))
    .filter((assignment) => assignment.rooms.length > 0);
  const relieverSessionCount = relieverAssignments.reduce(
    (total, assignment) => total + assignment.rooms.length,
    0
  );
  const payableDutyDays = isRelieverDuty ? relieverSessionCount / 2 : dutyDaysFromCalendar;
  const dutyAmount = payableDutyDays * Number(form.dutyRate || 0);

  const completionPercent = useMemo(() => {
    let steps = 0, done = 0;
    steps++; if (form.staffId) done++;
    steps++; if (form.examKey) done++;
    if (form.designation === "teaching") {
      steps++; if (form.courseCode) done++;
    }
    return Math.round((done / steps) * 100);
  }, [form]);

  return (
    <div className="cs-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .cs-root {
          min-height: 100vh;
          background: #f0f4ff;
          font-family: 'Inter', Arial, sans-serif;
          color: #0f172a;
        }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ TOP BAR ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .cs-topbar {
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%);
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 72px;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 4px 24px rgba(67,56,202,.35);
        }
        .cs-topbar-left { display: flex; align-items: center; gap: 16px; }
        .cs-logo {
          width: 44px; height: 44px;
          background: rgba(255,255,255,.15);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,.2);
        }
        .cs-brand { color: #fff; }
        .cs-brand-sub {
          font-size: 11px; font-weight: 500;
          color: rgba(255,255,255,.65);
          letter-spacing: .5px;
        }
        .cs-brand-title { font-size: 18px; font-weight: 700; }
        .cs-topbar-right { display: flex; align-items: center; gap: 10px; }
        .cs-back-btn {
          display: flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,.12);
          border: 1px solid rgba(255,255,255,.2);
          color: #fff;
          border-radius: 10px;
          padding: 9px 16px;
          font-size: 13px; font-weight: 600;
          cursor: pointer;
          transition: all .2s;
          backdrop-filter: blur(8px);
        }
        .cs-back-btn:hover { background: rgba(255,255,255,.22); transform: translateX(-2px); }
        .cs-progress-pill {
          background: rgba(255,255,255,.12);
          border: 1px solid rgba(255,255,255,.2);
          border-radius: 20px;
          padding: 6px 14px;
          color: #fff;
          font-size: 12px; font-weight: 600;
          display: flex; align-items: center; gap: 8px;
        }
        .cs-progress-bar-mini {
          width: 60px; height: 6px;
          background: rgba(255,255,255,.2);
          border-radius: 3px; overflow: hidden;
        }
        .cs-progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #a5f3fc, #6366f1);
          border-radius: 3px;
          transition: width .4s ease;
        }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ BODY ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .cs-body {
          padding: 28px 32px;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 24px;
          max-width: 1120px;
          margin: 0 auto;
          padding-bottom: 104px;
        }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ CARDS ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .cs-card {
          background: #fff;
          border: 1px solid #e2e8f4;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 20px;
          box-shadow: 0 1px 8px rgba(0,0,0,.05), 0 4px 16px rgba(67,56,202,.04);
          transition: box-shadow .2s;
        }
        .cs-card:hover { box-shadow: 0 2px 16px rgba(0,0,0,.08), 0 6px 24px rgba(67,56,202,.07); }
        .cs-card-header {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex; align-items: center; gap: 10px;
          background: linear-gradient(135deg, #fafbff 0%, #f8faff 100%);
        }
        .cs-card-icon {
          width: 34px; height: 34px;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px;
        }
        .cs-card-header h3 {
          font-size: 14px; font-weight: 700;
          color: #1e293b; flex: 1;
        }
        .cs-card-badge {
          font-size: 11px; font-weight: 600;
          padding: 3px 10px;
          border-radius: 20px;
        }
        .cs-card-body { padding: 20px; }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ GRID ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .cs-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .cs-grid1 { display: grid; grid-template-columns: 1fr; gap: 16px; }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ FORM FIELDS ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .cs-field { display: flex; flex-direction: column; gap: 6px; }
        .cs-label {
          font-size: 11px; font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .6px;
          color: #64748b;
        }
        .cs-label span { color: #ef4444; margin-left: 2px; }
        .cs-select, .cs-input {
          width: 100%;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          background: #fff;
          color: #0f172a;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
          appearance: none;
          -webkit-appearance: none;
        }
        .cs-select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 38px; }
        .cs-select:focus, .cs-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,.12);
        }
        .cs-input[readonly] {
          background: #f8fafc;
          color: #64748b;
          cursor: default;
        }
        .cs-select:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ INFO TILES ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .cs-info-tile {
          border-radius: 12px;
          padding: 14px 16px;
          display: flex; flex-direction: column; gap: 4px;
          border: 1.5px solid;
        }
        .cs-info-tile-label {
          font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: .5px;
        }
        .cs-info-tile-val { font-size: 15px; font-weight: 700; }
        .cs-info-tile-sub { font-size: 12px; margin-top: 1px; }
        .cs-inline-edit {
          width: 100%;
          border: 1.5px solid #e2e8f0;
          border-radius: 9px;
          background: #fff;
          color: #0f172a;
          font-size: 14px;
          font-weight: 700;
          padding: 9px 10px;
          outline: none;
          font-family: inherit;
        }
        .cs-inline-edit.small {
          font-size: 12px;
          font-weight: 600;
          margin-top: 8px;
        }
        .cs-inline-edit:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,.12);
        }
        .cs-lab-subjects {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 10px;
          margin-bottom: 20px;
        }
        .cs-lab-subject {
          border: 1px solid #dbeafe;
          background: #f8fbff;
          border-radius: 10px;
          padding: 10px 12px;
        }
        .cs-lab-code {
          display: block;
          color: #1d4ed8;
          font-size: 11px;
          font-weight: 800;
          margin-bottom: 4px;
        }
        .cs-lab-title {
          color: #1e293b;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.35;
        }
        .cs-lab-note {
          border: 1px solid #bbf7d0;
          background: #f0fdf4;
          color: #166534;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 14px;
        }
        .cs-subject-builder {
          display: grid;
          grid-template-columns: 160px minmax(140px, 1fr) minmax(220px, 2fr) 140px auto;
          gap: 10px;
          align-items: end;
        }
        .cs-subject-builder .cs-field { gap: 5px; }
        .cs-subject-add {
          border: none;
          border-radius: 10px;
          background: #4338ca;
          color: #fff;
          padding: 11px 16px;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          font-family: inherit;
        }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ EXAM SELECTOR CHIPS ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .cs-exam-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .cs-exam-chip {
          padding: 8px 14px;
          border-radius: 24px;
          font-size: 13px; font-weight: 600;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all .18s;
          white-space: nowrap;
        }
        .cs-exam-chip:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.1); }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ WORK TILES ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .cs-work-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .cs-work-tile {
          border: 1.5px solid #e8edf7;
          border-radius: 14px;
          padding: 18px;
          background: linear-gradient(135deg, #fafbff 0%, #fff 100%);
          transition: all .2s;
        }
        .cs-work-tile:hover {
          border-color: #c7d2fe;
          box-shadow: 0 4px 16px rgba(99,102,241,.1);
          transform: translateY(-1px);
        }
        .cs-work-title { font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 2px; }
        .cs-work-rate {
          font-size: 12px; color: #64748b;
          margin-bottom: 14px;
        }
        .cs-work-amount {
          font-size: 18px; font-weight: 800;
          color: #4338ca;
          margin-bottom: 14px;
        }
        .cs-counter {
          display: flex; align-items: center; gap: 0;
          background: #f1f5f9;
          border-radius: 10px;
          overflow: hidden;
          width: fit-content;
        }
        .cs-counter-btn {
          width: 36px; height: 36px;
          border: none;
          background: transparent;
          font-size: 18px; font-weight: 700;
          cursor: pointer;
          color: #475569;
          transition: all .15s;
          display: flex; align-items: center; justify-content: center;
        }
        .cs-counter-btn:hover { background: #e2e8f0; color: #1e293b; }
        .cs-counter-btn:active { background: #cbd5e1; transform: scale(.92); }
        .cs-counter-input {
          min-width: 44px;
          width: 76px;
          border: none;
          background: #fff;
          text-align: center;
          font-size: 16px; font-weight: 700;
          color: #1e293b;
          padding: 0 8px;
          outline: none;
          font-family: inherit;
          align-self: stretch;
        }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ AMOUNT INPUTS ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .cs-amount-field {
          position: relative;
        }
        .cs-amount-prefix {
          position: absolute;
          left: 13px; top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 13px; font-weight: 600;
          pointer-events: none;
        }
        .cs-amount-field .cs-input { padding-left: 32px; }
        .cs-duty-grid {
          display: grid;
          grid-template-columns: minmax(180px, 1.4fr) minmax(150px, .8fr) minmax(120px, .6fr) minmax(120px, .6fr);
          gap: 14px;
          align-items: end;
        }
        .cs-textarea {
          min-height: 72px;
          resize: vertical;
          line-height: 1.4;
        }
        .cs-duty-total {
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          color: #1e3a8a;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 13px;
          font-weight: 800;
        }

        .cs-duty-cal {
          margin-top: 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          padding: 14px 16px 12px;
          background: linear-gradient(135deg, #fafbff 0%, #fff 100%);
        }
        .cs-duty-cal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .cs-duty-cal-nav {
          width: 38px;
          height: 36px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: #fff;
          font-size: 20px;
          line-height: 1;
          color: #475569;
          cursor: pointer;
          font-family: inherit;
          transition: border-color .2s, background .2s;
        }
        .cs-duty-cal-nav:hover { border-color: #c7d2fe; background: #f8fafc; }
        .cs-duty-cal-title {
          font-size: 14px;
          font-weight: 800;
          color: #1e293b;
        }
        .cs-duty-cal-weekdays {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 4px;
          margin-bottom: 6px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .04em;
          color: #94a3b8;
          text-align: center;
        }
        .cs-duty-cal-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 4px;
        }
        .cs-duty-cal-cell {
          aspect-ratio: 1;
          min-height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          font-family: inherit;
          border: 1.5px solid transparent;
          background: transparent;
        }
        .cs-duty-cal-muted { visibility: hidden; pointer-events: none; }
        .cs-duty-cal-day {
          cursor: pointer;
          background: #fff;
          border-color: #e2e8f0;
          color: #334155;
          transition: transform .15s, border-color .15s, box-shadow .15s;
        }
        .cs-duty-cal-day:hover {
          border-color: #a5b4fc;
          box-shadow: 0 2px 8px rgba(99,102,241,.12);
          transform: translateY(-1px);
        }
        .cs-duty-cal-day.is-disabled {
          cursor: not-allowed;
          background: #f1f5f9;
          border-color: #e2e8f0;
          color: #cbd5e1;
          box-shadow: none;
          transform: none;
        }
        .cs-duty-cal-day.is-disabled:hover {
          border-color: #e2e8f0;
          box-shadow: none;
          transform: none;
        }
        .cs-duty-cal-day.is-selected {
          border-color: transparent;
          box-shadow: 0 4px 12px rgba(99,102,241,.35);
        }
        .cs-duty-cal-day.is-range {
          background: #dbeafe;
          border-color: #bfdbfe;
          color: #1e3a8a;
        }
        .cs-range-cal {
          margin-top: 12px;
          background: rgba(255,255,255,.72);
        }
        .cs-period-toggle {
          width: fit-content;
          border: 1px solid #c7d2fe;
          background: #fff;
          color: #4338ca;
          font-weight: 800;
          border-radius: 999px;
          padding: 8px 12px;
          cursor: pointer;
          margin-top: 10px;
        }
        .cs-duty-cal-hint {
          margin-top: 12px;
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
          line-height: 1.4;
        }
        .cs-duty-dates-readout {
          margin-top: 10px;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px dashed #cbd5e1;
          background: #f8fafc;
          line-height: 1.45;
          min-height: 44px;
        }
        .cs-duty-clear-dates {
          margin-top: 8px;
          border: none;
          background: none;
          color: #6366f1;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          font-family: inherit;
          padding: 4px 0;
        }
        .cs-duty-clear-dates:hover { text-decoration: underline; }
        .cs-reliever-room-box {
          margin-top: 12px; border: 1px solid #dbeafe; border-radius: 12px;
          background: #f8fbff; padding: 12px;
        }
        .cs-reliever-room-head {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; font-size: 12px; font-weight: 800; color: #1e3a8a;
          margin-bottom: 10px;
        }
        .cs-reliever-room-head strong { color: #0f172a; }
        .cs-reliever-room-list { display: grid; gap: 8px; }
        .cs-reliever-room-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; padding: 9px 10px; border-radius: 10px; background: #fff;
          border: 1px solid #e2e8f0; font-size: 12px; font-weight: 800;
        }
        .cs-reliever-room-row > span { color: #334155; }
        .cs-reliever-room-row > div { display: flex; flex-wrap: wrap; gap: 8px; }
        .cs-reliever-room-choice {
          display: inline-flex; align-items: center; gap: 6px; padding: 6px 9px;
          border-radius: 999px; border: 1px solid #cbd5e1; color: #0f172a;
          cursor: pointer; background: #f8fafc;
        }
        .cs-reliever-room-choice input { accent-color: #2563eb; }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ SUMMARY CARD ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .cs-summary { position: sticky; top: 88px; }
        .cs-sum-header {
          background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%);
          padding: 20px;
          color: #fff;
        }
        .cs-sum-header h3 { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
        .cs-sum-total-label { font-size: 11px; opacity: .7; text-transform: uppercase; letter-spacing: .5px; margin-top: 12px; }
        .cs-sum-total-val { font-size: 30px; font-weight: 800; margin-top: 4px; }
        .cs-sum-body { padding: 20px; }
        .cs-sum-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
        }
        .cs-sum-row:last-of-type { border-bottom: none; }
        .cs-sum-row-label { color: #64748b; font-weight: 500; display: flex; align-items: center; gap: 6px; }
        .cs-sum-row-dot {
          width: 8px; height: 8px; border-radius: 50%;
        }
        .cs-sum-row-val { font-weight: 700; color: #1e293b; }
        .cs-sum-row-val.zero { color: #cbd5e1; }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ DIVIDER ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .cs-divider { height: 1px; background: #e2e8f0; margin: 4px 0 16px; }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ STAFF BADGE ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .cs-staff-badge {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 14px;
          background: linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%);
          border: 1.5px solid #bfdbfe;
          border-radius: 12px;
          margin-top: 8px;
        }
        .cs-staff-avatar {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #6366f1, #818cf8);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 15px;
          flex-shrink: 0;
        }
        .cs-staff-name { font-size: 14px; font-weight: 700; color: #1e1b4b; }
        .cs-staff-type {
          font-size: 11px; font-weight: 600;
          padding: 2px 8px; border-radius: 20px;
          display: inline-block; margin-top: 2px;
        }
        .cs-staff-teaching { background: #dcfce7; color: #166534; }
        .cs-staff-nonteaching { background: #fef3c7; color: #92400e; }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ ALERTS ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .cs-alert {
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 16px;
          font-size: 13px; font-weight: 500;
          display: flex; align-items: center; gap: 10px;
          animation: slideDown .25s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cs-alert-error { background: #fef2f2; border: 1.5px solid #fecaca; color: #991b1b; }
        .cs-alert-success { background: #f0fdf4; border: 1.5px solid #bbf7d0; color: #166534; }
        .cs-alert-icon { font-size: 16px; flex-shrink: 0; }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ BUTTONS ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .cs-actions { display: flex; gap: 10px; margin-top: 20px; }
        .cs-fixed-actions {
          position: fixed;
          right: 32px;
          bottom: 28px;
          z-index: 90;
          display: flex;
          gap: 10px;
          padding: 10px;
          border-radius: 16px;
          background: rgba(255,255,255,.92);
          border: 1px solid #e2e8f0;
          box-shadow: 0 16px 36px rgba(15,23,42,.18);
          backdrop-filter: blur(10px);
        }
        .cs-save-btn {
          flex: 1;
          padding: 14px 20px;
          background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%);
          color: #fff;
          border: none; border-radius: 12px;
          font-size: 14px; font-weight: 700;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all .2s;
          box-shadow: 0 4px 14px rgba(99,102,241,.4);
          font-family: 'Inter', sans-serif;
        }
        .cs-save-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99,102,241,.5);
        }
        .cs-save-btn:active:not(:disabled) { transform: translateY(0); }
        .cs-save-btn:disabled { opacity: .6; cursor: not-allowed; }
        .cs-reset-btn {
          padding: 14px 18px;
          background: #f1f5f9;
          color: #475569;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px; font-weight: 700;
          cursor: pointer;
          transition: all .2s;
          font-family: 'Inter', sans-serif;
        }
        .cs-reset-btn:hover { background: #e2e8f0; border-color: #cbd5e1; }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ SPINNER ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .cs-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin .6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ SECTION DIVIDERS ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .cs-section-divider {
          display: flex; align-items: center; gap: 10px;
          margin: 0 0 14px;
        }
        .cs-section-divider span {
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: .6px;
          color: #94a3b8; white-space: nowrap;
        }
        .cs-section-divider::before,
        .cs-section-divider::after {
          content: ''; flex: 1; height: 1px; background: #e2e8f0;
        }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ RESPONSIVE ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        @media (max-width: 960px) {
          .cs-body { grid-template-columns: 1fr; padding: 16px; }
          .cs-grid2, .cs-work-grid { grid-template-columns: 1fr; }
          .cs-summary { position: static; }
          .cs-topbar { padding: 0 16px; }
          .cs-exam-chips { gap: 6px; }
        }
      `}</style>

      {/* TOP BAR */}
      <div className="cs-topbar">
        <div className="cs-topbar-left">
          <div className="cs-logo">CS</div>
          <div className="cs-brand">
            <div className="cs-brand-sub">VJTI - MCA Department</div>
            <div className="cs-brand-title">ESE / Re-ESE Charge Sheet</div>
          </div>
        </div>
        <div className="cs-topbar-right">
          <div className="cs-progress-pill">
            <div className="cs-progress-bar-mini">
              <div className="cs-progress-bar-fill" style={{ width: `${completionPercent}%` }} />
            </div>
            {completionPercent}% filled
          </div>
          <button className="cs-back-btn" onClick={() => navigate("/")}>
            Dashboard
          </button>
        </div>
      </div>

      <div className="cs-body">
        <div>
          {/* Alerts */}
          {error && (
            <div className="cs-alert cs-alert-error">
              <span className="cs-alert-icon">!</span> {error}
            </div>
          )}
          {saved && (
            <div className="cs-alert cs-alert-success">
              <span className="cs-alert-icon">OK</span> Exam sheet saved successfully!
            </div>
          )}

          {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ CARD 1: Exam Selection ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */}
          <div className="cs-card">
            <div className="cs-card-header">
              <div className="cs-card-icon" style={{ background: "#ede9fe" }}>EX</div>
              <h3>Exam Selection</h3>
              {selectedExam && (
                <span
                  className="cs-card-badge"
                  style={{ background: selectedExam.color + "1a", color: selectedExam.color }}
                >
                  {selectedExam.examType}
                </span>
              )}
            </div>
            <div className="cs-card-body">
              {/* Chips */}
              <div className="cs-section-divider"><span>Choose exam</span></div>
              <div className="cs-grid2" style={{ marginBottom: 16 }}>
                <label className="cs-field">
                  <span>Exam Year</span>
                  <select name="examYear" value={examYear} onChange={handleExamYearChange}>
                    {EXAM_YEAR_OPTIONS.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="cs-exam-chips" style={{ marginBottom: 20 }}>
                {examOptionsForYear.map((opt) => {
                  const active = form.examKey === opt.key;
                  return (
                    <button
                      key={opt.key}
                      className="cs-exam-chip"
                      style={{
                        background: active ? opt.color : "#f1f5f9",
                        color: active ? "#fff" : "#475569",
                        borderColor: active ? opt.color : "transparent",
                        boxShadow: active ? `0 4px 14px ${opt.color}44` : "none",
                      }}
                      onClick={() => handleChange({ target: { name: "examKey", value: opt.key } })}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Info tiles */}
              <div className="cs-grid2">
                <div
                  className="cs-info-tile"
                  style={{
                    borderColor: selectedExam.color + "33",
                    background: selectedExam.color + "08",
                  }}
                >
                  <span className="cs-info-tile-label" style={{ color: selectedExam.color }}>Academic Year & Semester</span>
                  <span className="cs-info-tile-val">{selectedExam.academicYear} - {selectedExam.semester}</span>
                  <span className="cs-info-tile-sub" style={{ color: "#64748b" }}>Exam type: {selectedExam.examType}</span>
                </div>
                <div
                  className="cs-info-tile"
                  style={{
                    borderColor: selectedExam.color + "33",
                    background: selectedExam.color + "08",
                  }}
                >
                  <span className="cs-info-tile-label" style={{ color: selectedExam.color }}>Exam Period</span>
                  <span className="cs-info-tile-val">{form.examPeriod || "Select start and end date"}</span>
                  <span className="cs-info-tile-sub" style={{ color: "#64748b" }}>{form.examMonth}</span>
                  <button
                    type="button"
                    className="cs-period-toggle"
                    onClick={() => setShowExamPeriodPicker((value) => !value)}
                  >
                    {showExamPeriodPicker ? "Hide calendar" : "Change dates"}
                  </button>
                  {showExamPeriodPicker && (
                    <ExamPeriodRangeCalendar
                      value={selectedExamRange}
                      onChange={handleExamRangeChange}
                      accent={selectedExam.color}
                      fallbackMonth={selectedExam.month}
                    />
                  )}
                </div>
                <div
                  className="cs-info-tile"
                  style={{
                    borderColor: "#10b98133",
                    background: "#10b98108",
                    gridColumn: "1 / -1",
                  }}
                >
                  <span className="cs-info-tile-label" style={{ color: "#059669" }}>Lab / Practical Exam Period</span>
                  <span className="cs-info-tile-val">{form.labExamPeriod || "Select practical exam start and end date"}</span>
                  <span className="cs-info-tile-sub" style={{ color: "#64748b" }}>
                    This is printed with the theory exam period on the generated sheet.
                  </span>
                  <button
                    type="button"
                    className="cs-period-toggle"
                    onClick={() => setShowLabExamPeriodPicker((value) => !value)}
                  >
                    {showLabExamPeriodPicker ? "Hide calendar" : "Change lab dates"}
                  </button>
                  {showLabExamPeriodPicker && (
                    <ExamPeriodRangeCalendar
                      value={selectedLabExamRange}
                      onChange={handleLabExamRangeChange}
                      accent="#10b981"
                      fallbackMonth={form.examMonth || selectedExam.month}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ CARD 2: Staff Member ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */}
          <div className="cs-card">
            <div className="cs-card-header">
              <div className="cs-card-icon" style={{ background: "#dbeafe" }}>ST</div>
              <h3>Staff Member</h3>
              {form.designation && (
                <span
                  className="cs-card-badge"
                  style={
                    form.designation === "teaching"
                      ? { background: "#dcfce7", color: "#166534" }
                      : { background: "#fef3c7", color: "#92400e" }
                  }
                >
                  {form.designation === "teaching" ? "Teaching" : "Non-Teaching"}
                </span>
              )}
            </div>
            <div className="cs-card-body">
              <div className="cs-field">
                <label className="cs-label">Select staff member <span>*</span></label>
                <select
                  className="cs-select"
                  value={form.staffId}
                  onChange={handleStaffSelect}
                  disabled={loadingStaff}
                >
                  <option value="">
                    {loadingStaff ? "Loading staff..." : "Choose staff member"}
                  </option>
                  {staff.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {form.staffName && (
                <div className="cs-staff-badge">
                  <div className="cs-staff-avatar">
                    {form.staffName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="cs-staff-name">{form.staffName}</div>
                    <span className={`cs-staff-type ${form.designation === "teaching" ? "cs-staff-teaching" : "cs-staff-nonteaching"}`}>
                      {form.designation === "teaching" ? "Teaching Staff" : "Non-Teaching Staff"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ CARD 3: Teaching Sheet ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */}
          {form.designation === "teaching" && (
            <div className="cs-card">
              <div className="cs-card-header">
                <div className="cs-card-icon" style={{ background: "#dcfce7" }}>TS</div>
                <h3>Teaching Exam Sheet</h3>
              </div>
              <div className="cs-card-body">
                <div className="cs-section-divider"><span>Subject selection</span></div>
                <div className="cs-grid2" style={{ marginBottom: 20 }}>
                  <div className="cs-field">
                    <label className="cs-label">Subject <span>*</span></label>
                    <select className="cs-select" value={form.courseKey} onChange={handleCourseSelect}>
                      <option value="">Select subject</option>
                      {selectedCourses.map((course) => (
                        <option key={course.code} value={course.code}>
                          {course.kind === "lab" ? "Lab - " : "Theory - "}{course.code} {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="cs-field">
                    <label className="cs-label">Course code</label>
                    <input
                      className="cs-input"
                      name="courseCode"
                      value={form.courseCode}
                      readOnly
                      placeholder="Auto-fills on subject select"
                    />
                  </div>
                </div>

                <div className="cs-section-divider"><span>Workload & remuneration</span></div>
                {isLabCourse && (
                  <div className="cs-lab-note">
                    Lab subjects do not carry paper setting charges. Enter only No. of Papers Assessed at Rs 20 per paper.
                  </div>
                )}
                <div className="cs-work-grid">
                  {!isLabCourse && (
                    <WorkTile
                      icon="PS"
                      name="Paper Setting"
                      rate={form.paperSetRate}
                      unit="per set"
                      value={form.paperSets}
                      amount={paperAmt}
                      onMinus={() => setCount("paperSets", -1)}
                      onPlus={() => setCount("paperSets", 1)}
                      onValueChange={(value) => setCountValue("paperSets", value)}
                      color="#6366f1"
                    />
                  )}
                  <WorkTile
                    icon="AS"
                    name={isLabCourse ? "No. of Papers Assessed" : "Assessment"}
                    rate={form.assessmentRate}
                    unit="per paper"
                    value={form.assessments}
                    amount={assessmentAmt}
                    onMinus={() => setCount("assessments", -1)}
                    onPlus={() => setCount("assessments", 1)}
                    onValueChange={(value) => setCountValue("assessments", value)}
                    color="#10b981"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ CARD 4: Non-Teaching Sheet ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */}
          {form.staffId && (
            <div className="cs-card">
              <div className="cs-card-header">
                <div className="cs-card-icon" style={{ background: "#dbeafe" }}>DU</div>
                <h3>Teaching / Non-Teaching Duty</h3>
                <span className="cs-card-badge" style={{ background: "#eff6ff", color: "#1d4ed8" }}>
                  Rate x Days
                </span>
              </div>
              <div className="cs-card-body">
                <div className="cs-section-divider"><span>Duty remuneration</span></div>
                <div className="cs-duty-grid">
                  <div className="cs-field">
                    <label className="cs-label">Duty / role</label>
                    <select
                      className="cs-select"
                      value={selectedDutyRole?.key || ""}
                      onChange={handleDutyRoleChange}
                    >
                      <option value="">Select duty / role</option>
                      {dutyRoleOptions.map((o) => (
                        <option key={o.key} value={o.key}>
                          {o.label} — Rs {o.rate}/session
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="cs-field">
                    <label className="cs-label">Rate per session</label>
                    <div className="cs-amount-field">
                      <span className="cs-amount-prefix">Rs</span>
                      <input
                        className="cs-input"
                        name="dutyRate"
                        type="number"
                        readOnly
                        value={selectedDutyRole ? selectedDutyRole.rate : Number(form.dutyRate || 0)}
                      />
                    </div>
                  </div>
                  <div className="cs-field">
                    <label className="cs-label">{isRelieverDuty ? "Payable days" : "Total days"}</label>
                    <input
                      className="cs-input"
                      name="dutyDays"
                      type="number"
                      readOnly
                      value={payableDutyDays}
                    />
                  </div>
                  <div className="cs-duty-total">
                    Amount<br />Rs {fmt(dutyAmount)}
                  </div>
                </div>
                <div className="cs-field" style={{ marginTop: 14 }}>
                  <label className="cs-label">Exam dates</label>
                  <DutyExamCalendar
                    value={dutyDateKeys}
                    onChange={setDutyDateKeys}
                    accent={selectedExam.color}
                    bounds={dutyDateBounds}
                  />
                  <div className="cs-duty-dates-readout">
                    {dutyDatesJoined.trim() ? dutyDatesJoined : "No dates selected yet."}
                  </div>
                  {isRelieverDuty && dutySortedKeys.length > 0 && (
                    <div className="cs-reliever-room-box">
                      <div className="cs-reliever-room-head">
                        <span>Reliever classrooms</span>
                        <strong>{relieverSessionCount} sessions = {fmt(payableDutyDays)} paid days</strong>
                      </div>
                      <div className="cs-reliever-room-list">
                        {dutySortedKeys.map((dateKey) => (
                          <div key={dateKey} className="cs-reliever-room-row">
                            <span>{formatDdMmYyyyFromKey(dateKey)}</span>
                            <div>
                              {RELIEVER_ROOMS.map((room) => (
                                <label key={room} className="cs-reliever-room-choice">
                                  <input
                                    type="checkbox"
                                    checked={(relieverRoomsByDate[dateKey] || []).includes(room)}
                                    onChange={() => toggleRelieverRoom(dateKey, room)}
                                  />
                                  {room}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="cs-duty-cal-hint">
                        Select one classroom for a half-day reliever duty, or both classrooms for one full paid day.
                      </p>
                    </div>
                  )}
                  {dutyDateKeys.length > 0 && (
                    <button
                      type="button"
                      className="cs-duty-clear-dates"
                      onClick={() => {
                        setDutyDateKeys([]);
                        setRelieverRoomsByDate({});
                        setSaved(false);
                      }}
                    >
                      Clear all dates
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {form.designation === "non-teaching" && (
            <div className="cs-card">
              <div className="cs-card-header">
                <div className="cs-card-icon" style={{ background: "#fef3c7" }}>SS</div>
                <h3>Support Staff Sheet</h3>
              </div>
              <div className="cs-card-body">
                <div className="cs-section-divider"><span>Remuneration details</span></div>
                <div className="cs-grid2">
                  <div className="cs-field">
                    <label className="cs-label">Exam conduction amount</label>
                    <div className="cs-amount-field">
                      <span className="cs-amount-prefix">Rs</span>
                      <input
                        className="cs-input"
                        name="examConduction"
                        type="number"
                        value={form.examConduction}
                        onChange={handleChange}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="cs-field">
                    <label className="cs-label">Invigilation / reliever amount</label>
                    <div className="cs-amount-field">
                      <span className="cs-amount-prefix">Rs</span>
                      <input
                        className="cs-input"
                        name="invigilation"
                        type="number"
                        value={form.invigilation}
                        onChange={handleChange}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ SIDEBAR: Summary ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */}
        <div className="cs-fixed-actions">
          <button className="cs-save-btn" onClick={handleSubmit} disabled={saving}>
            {saving ? <><div className="cs-spinner" /> Saving...</> : <>Save Sheet</>}
          </button>
          <button className="cs-reset-btn" onClick={handleReset} title="Reset form">Reset</button>
        </div>
      </div>
    </div>
  );
};

function WorkTile({ icon, name, rate, unit, value, amount, onMinus, onPlus, onValueChange, color }) {
  const fmt = (v) => Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  return (
    <div className="cs-work-tile">
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span className="cs-work-title">{name}</span>
      </div>
      <div className="cs-work-rate">Rs {fmt(rate)} {unit}</div>
      <div className="cs-work-amount" style={{ color }}>Rs {fmt(amount)}</div>
      <div className="cs-counter">
        <button className="cs-counter-btn" type="button" onClick={onMinus}>-</button>
        <input
          className="cs-counter-input"
          type="number"
          min="0"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          aria-label={`${name} count`}
        />
        <button className="cs-counter-btn" type="button" onClick={onPlus}>+</button>
      </div>
    </div>
  );
}

export default Chargesheet;
