/**
 * Central configuration for exam remuneration rates (charge sheet + workbook fallbacks).
 * Persisted in localStorage; survives refresh. Other tabs sync via "storage" events.
 */

export const TASK_RATES_STORAGE_KEY = "mca_task_rates_v1";
export const TASK_RATES_CHANGED_EVENT = "mca-task-rates-changed";

export const DEFAULT_DUTY_ROLES = [
  { key: "reliever", label: "Reliever", rate: 100 },
  { key: "dept_exam_coordinator", label: "Dept Exam Coordinator", rate: 200 },
  { key: "dept_clerk", label: "Dept Clerk", rate: 100 },
  { key: "dept_peon", label: "Dept Peon", rate: 50 },
  { key: "lab_attendant", label: "Lab Attendant", rate: 50 },
  { key: "lab_assistant", label: "Lab Assistant", rate: 100 },
  { key: "invigilator", label: "Invigilator", rate: 100 },
  { key: "hod", label: "HOD", rate: 200 },
];

export const DEFAULT_TASK_RATES = {
  paperSettingPerSet: 1000,
  assessmentPerPaper: 20,
  duties: DEFAULT_DUTY_ROLES.map(({ key, label, rate }) => ({ key, label, rate })),
};

function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_TASK_RATES));
}

export function normalizeTaskRates(raw) {
  const base = cloneDefaults();
  const paper = Math.max(
    0,
    Number(
      raw?.paperSettingPerSet ?? raw?.paperSetRate ?? base.paperSettingPerSet
    )
  );
  const assess = Math.max(
    0,
    Number(
      raw?.assessmentPerPaper ?? raw?.assessmentRate ?? base.assessmentPerPaper
    )
  );
  const stored = Array.isArray(raw?.duties) ? raw.duties : [];
  const byKey = new Map(stored.map((d) => [d.key, d]));
  const duties = base.duties.map((d) => {
    const o = byKey.get(d.key);
    const label =
      typeof o?.label === "string" && o.label.trim() ? o.label.trim() : d.label;
    const rate = Math.max(0, Number(o?.rate ?? d.rate));
    return { key: d.key, label, rate };
  });
  return { paperSettingPerSet: paper, assessmentPerPaper: assess, duties };
}

export function loadTaskRates() {
  try {
    const json = localStorage.getItem(TASK_RATES_STORAGE_KEY);
    if (!json) return cloneDefaults();
    return normalizeTaskRates(JSON.parse(json));
  } catch {
    return cloneDefaults();
  }
}

export function saveTaskRates(partial) {
  const current = loadTaskRates();
  const merged = normalizeTaskRates({
    ...current,
    ...partial,
    duties: partial?.duties !== undefined ? partial.duties : current.duties,
  });
  localStorage.setItem(TASK_RATES_STORAGE_KEY, JSON.stringify(merged));
  window.dispatchEvent(new Event(TASK_RATES_CHANGED_EVENT));
  return merged;
}

export function resetTaskRatesToDefaults() {
  localStorage.removeItem(TASK_RATES_STORAGE_KEY);
  window.dispatchEvent(new Event(TASK_RATES_CHANGED_EVENT));
  return cloneDefaults();
}

/** Fields merged into charge sheet form defaults. */
export function teachingRateDefaults() {
  const r = loadTaskRates();
  return {
    paperSetRate: r.paperSettingPerSet,
    assessmentRate: r.assessmentPerPaper,
  };
}
