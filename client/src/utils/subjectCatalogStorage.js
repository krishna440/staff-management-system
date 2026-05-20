export const SUBJECT_CATALOG_STORAGE_KEY = "mcaSubjectCatalog";
const LEGACY_CUSTOM_COURSES_KEY = "customCourses";

export function loadSubjectCatalog(defaultCatalog) {
  try {
    const stored = JSON.parse(localStorage.getItem(SUBJECT_CATALOG_STORAGE_KEY) || "null");
    if (stored && typeof stored === "object") {
      return normalizeCatalog(stored);
    }
  } catch {
    localStorage.removeItem(SUBJECT_CATALOG_STORAGE_KEY);
  }

  const merged = normalizeCatalog(defaultCatalog);
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_CUSTOM_COURSES_KEY) || "{}");
    Object.entries(legacy || {}).forEach(([semester, courses]) => {
      const existing = merged[semester] || [];
      const byCode = new Map(existing.map((course) => [course.code, course]));
      (Array.isArray(courses) ? courses : []).forEach((course) => {
        if (course?.code && course?.title) byCode.set(course.code, normalizeCourse(course));
      });
      merged[semester] = Array.from(byCode.values());
    });
  } catch {
    localStorage.removeItem(LEGACY_CUSTOM_COURSES_KEY);
  }

  saveSubjectCatalog(merged);
  return merged;
}

export function saveSubjectCatalog(catalog) {
  const normalized = normalizeCatalog(catalog);
  localStorage.setItem(SUBJECT_CATALOG_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

function normalizeCatalog(catalog) {
  return Object.fromEntries(
    Object.entries(catalog || {}).map(([semester, courses]) => [
      semester,
      (Array.isArray(courses) ? courses : [])
        .filter((course) => course?.code && course?.title)
        .map(normalizeCourse),
    ])
  );
}

function normalizeCourse(course) {
  return {
    code: String(course.code || "").trim().toUpperCase(),
    title: String(course.title || "").trim(),
    ...(course.kind === "lab" ? { kind: "lab" } : {}),
  };
}
