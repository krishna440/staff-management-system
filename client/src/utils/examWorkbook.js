import { loadTaskRates } from "./taskRates";

function paperRateForRow(row) {
  return Number(row.paperSetRate) || loadTaskRates().paperSettingPerSet;
}

function assessmentRateForRow(row) {
  return Number(row.assessmentRate) || loadTaskRates().assessmentPerPaper;
}

function assessmentAmountForRow(row) {
  const assessments = Number(row.assessments || 0);
  const amount = assessments * assessmentRateForRow(row);
  if (assessments > 0 && row.examType === "Re-ESE") {
    return Math.max(amount, 200);
  }
  return amount;
}

function paperSettingAmountForRow(row) {
  if (row.examType === "Re-ESE") {
    return 0;
  }
  return Number(row.paperSets || 0) * paperRateForRow(row);
}

function isConductionDuty(row) {
  const role = String(row.dutyRole || "").toLowerCase();
  return role.includes("hod") || role.includes("coordinator");
}

function hasTeachingExamWork(row) {
  return Number(row.paperSets || 0) > 0 || Number(row.assessments || 0) > 0;
}

function conductionAmount(row) {
  const directConduction = Number(row.examConduction || 0);
  const duty = isConductionDuty(row) ? dutyAmount(row) : 0;
  const standaloneSupport = !hasTeachingExamWork(row) && directConduction === 0 && Number(row.invigilation || 0) >= 1000
    ? Number(row.invigilation || 0)
    : 0;
  return directConduction + duty + standaloneSupport;
}

function invigilationAmount(row) {
  const directInvigilation = Number(row.invigilation || 0);
  const standaloneMovedToConduction = !hasTeachingExamWork(row) && Number(row.examConduction || 0) === 0 && directInvigilation >= 1000;
  return (standaloneMovedToConduction ? 0 : directInvigilation) + (isConductionDuty(row) ? 0 : dutyAmount(row));
}

const EXAM_DEFINITIONS = [
  {
    label: "FY Sem I - ESE",
    shortName: "FY S1 ESE",
    academicYear: "FY",
    semester: "Sem I",
    examType: "ESE",
    month: "January 2026",
    period: "05/01/2026 to 19/01/2026",
  },
  {
    label: "FY Sem I - Re-ESE",
    shortName: "FY S1 RE",
    academicYear: "FY",
    semester: "Sem I",
    examType: "Re-ESE",
    month: "February 2026",
    period: "09/02/2026 to 13/02/2026",
  },
  {
    label: "FY Sem II - ESE",
    shortName: "FY S2 ESE",
    academicYear: "FY",
    semester: "Sem II",
    examType: "ESE",
    month: "May 2026",
    period: "May 2026",
  },
  {
    label: "FY Sem II - Re-ESE",
    shortName: "FY S2 RE",
    academicYear: "FY",
    semester: "Sem II",
    examType: "Re-ESE",
    month: "June 2026",
    period: "June 2026",
  },
  {
    label: "SY Sem III - ESE",
    shortName: "SY S3 ESE",
    academicYear: "SY",
    semester: "Sem III",
    examType: "ESE",
    month: "December 2026",
    period: "December 2026",
  },
  {
    label: "SY Sem III - Re-ESE",
    shortName: "SY S3 RE",
    academicYear: "SY",
    semester: "Sem III",
    examType: "Re-ESE",
    month: "January 2026",
    period: "21/01/2026 to 27/01/2026",
  },
];

const STYLE = {
  normal: 0,
  title: 1,
  subtitle: 2,
  statement: 3,
  label: 4,
  header: 5,
  text: 6,
  center: 7,
  amount: 8,
  total: 9,
  signature: 10,
  rightTotal: 11,
};

const TEACHING_WIDTHS = [7, 24, 42, 18, 14, 18, 14, 18];
const SUPPORT_WIDTHS = [7, 27, 20, 34, 16, 20, 16];
const TOTAL_WIDTHS = [8, 32, 22, 22, 18, 18, 22];

export async function downloadExamWorkbook(chargesheets) {
  const sheets = [];

  EXAM_DEFINITIONS.forEach((exam) => {
    const rows = chargesheets.filter((row) => matchesExam(row, exam));
    sheets.push(buildTeachingSheet(exam, rows));
    sheets.push(buildSupportSheet(exam, rows));
    sheets.push(buildTotalSheet(exam, rows));
  });

  const workbookBlob = buildXlsx(sheets);
  const url = URL.createObjectURL(workbookBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "MCA_ESE_RE_ESE_Exam_Sheets.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function matchesExam(row, exam) {
  return (
    row.examLabel === exam.label ||
    (
      row.academicYear === exam.academicYear &&
      row.semester === exam.semester &&
      row.examType === exam.examType &&
      (!row.examMonth || row.examMonth === exam.month)
    )
  );
}

function buildTeachingSheet(exam, allRows) {
  const teachingRows = allRows.filter((row) => isTeaching(row));
  const rows = commonHeadingRows(exam, 8);
  const merges = [
    "A1:H1",
    "A2:H2",
    "A4:H4",
    "A6:C6",
    "G6:H6",
  ];

  rows.push({
    cells: [
      "SR.\nNO",
      "Name of Examiner",
      "Course Code and Course Title",
      "Paper setting (No. of sets and per set Rs. 1000/-)",
      "Amount(1)",
      "No. of paper Assessed (per student Rs. 20/-)",
      "Amount(2)",
      "Grand Total\n(Per Examiner)",
    ].map((value) => ({ value, style: STYLE.header })),
    height: 44,
  });

  const grouped = groupBy(teachingRows, (row) => row.staffName || "Unknown");
  let sr = 1;

  grouped.forEach((staffRows) => {
    const startRow = rows.length + 1;
    const grandTotal = sum(staffRows, (row) => teachingAmount(row));

    staffRows.forEach((row, index) => {
      const paperSets = Number(row.paperSets || 0);
      const assessments = Number(row.assessments || 0);
      const paperAmount = paperSettingAmountForRow(row);
      const assessmentAmount = assessmentAmountForRow(row);
      rows.push({
        cells: [
          { value: sr, style: STYLE.center },
          { value: row.staffName || "", style: STYLE.text },
          { value: courseLabel(row), style: STYLE.text },
          { value: paperSets, style: STYLE.center },
          { value: paperAmount, style: STYLE.amount },
          { value: assessments, style: STYLE.center },
          { value: assessmentAmount, style: STYLE.amount },
          { value: index === 0 ? grandTotal : "", style: STYLE.total },
        ],
        height: 30,
      });
      sr += 1;
    });

    if (staffRows.length > 1) {
      merges.push(`H${startRow}:H${startRow + staffRows.length - 1}`);
    }
  });

  if (teachingRows.length === 0) {
    rows.push(blankTableRow(8, "No teaching entries for this exam."));
    merges.push(`A${rows.length}:H${rows.length}`);
  }

  addSignatureRows(rows, 8);

  return {
    name: `${exam.shortName} Teaching`,
    widths: TEACHING_WIDTHS,
    rows,
    merges,
  };
}

function buildSupportSheet(exam, allRows) {
  const supportRows = allRows.filter((row) => hasDuty(row) || !isTeaching(row));
  const rows = commonHeadingRows(exam, 7);
  const merges = [
    "A1:G1",
    "A2:G2",
    "A4:G4",
    "A6:C6",
    "F6:G6",
  ];

  rows.push({
    cells: [
      "No",
      "Name",
      "Remuneration per\nSession (I)",
      "Exam Dates",
      "Total Days (II)",
      "Remuneration Amt\n(I * II)",
      "Grand\nTotal",
    ].map((value) => ({ value, style: STYLE.header })),
    height: 38,
  });

  let sr = 1;
  supportRows.forEach((row) => {
    const supportItems = [];
    const calculatedDuty = dutyAmount(row);
    const standaloneMovedToConduction =
      !hasTeachingExamWork(row) &&
      Number(row.examConduction || 0) === 0 &&
      Number(row.invigilation || 0) >= 1000;
    const conduction = Number(row.examConduction || 0) + (standaloneMovedToConduction ? Number(row.invigilation || 0) : 0);
    const invigilation = standaloneMovedToConduction ? 0 : Number(row.invigilation || 0);

    if (calculatedDuty > 0 || row.dutyRole || row.dutyDates) {
      supportItems.push({
        name: `${isConductionDuty(row) ? "Exam Conduction" : row.dutyRole || "Exam Duty"} - ${row.staffName || ""}`,
        rate: Number(row.dutyRate || 0),
        dates: row.dutyDates || row.examPeriod || exam.period,
        days: Number(row.dutyDays || 0),
        amount: calculatedDuty,
      });
    }
    if (conduction > 0) {
      supportItems.push({
        name: `Exam Conduction - ${row.staffName || ""}`,
        rate: conduction,
        dates: row.examPeriod || exam.period,
        days: 1,
        amount: conduction,
      });
    }
    if (invigilation > 0) {
      supportItems.push({
        name: `Invigilation / Reliever - ${row.staffName || ""}`,
        rate: invigilation,
        dates: row.examPeriod || exam.period,
        days: 1,
        amount: invigilation,
      });
    }
    if (supportItems.length === 0 && Number(row.total || 0) > 0) {
      supportItems.push({
        name: row.staffName || "",
        rate: Number(row.total || 0),
        dates: row.examPeriod || exam.period,
        days: 1,
        amount: Number(row.total || 0),
      });
    }

    const startRow = rows.length + 1;
    const grandTotal = sum(supportItems, (item) => item.amount);

    supportItems.forEach((item, index) => {
      rows.push({
        cells: [
          { value: sr, style: STYLE.center },
          { value: item.name, style: STYLE.text },
          { value: item.rate, style: STYLE.amount },
          { value: item.dates, style: STYLE.center },
          { value: item.days, style: STYLE.center },
          { value: item.amount, style: STYLE.amount },
          { value: index === 0 ? grandTotal : "", style: STYLE.total },
        ],
        height: 30,
      });
      sr += 1;
    });

    if (supportItems.length > 1) {
      merges.push(`G${startRow}:G${startRow + supportItems.length - 1}`);
    }
  });

  if (supportRows.length === 0) {
    rows.push(blankTableRow(7, "No teaching/non-teaching support entries for this exam."));
    merges.push(`A${rows.length}:G${rows.length}`);
  }

  addSignatureRows(rows, 7, ["Department Exam Coordinator", "HOD"]);

  return {
    name: `${exam.shortName} Teach NonTeach`,
    widths: SUPPORT_WIDTHS,
    rows,
    merges,
  };
}

function buildTotalSheet(exam, allRows) {
  const rows = [
    mergedTitle("VEERMATA JIJABAI TECHNOLOGICAL INSTITUTE", 7, STYLE.title, 24),
    mergedTitle("MATUNGA, MUMBAI - 400 019.", 7, STYLE.subtitle, 18),
    mergedTitle("MCA Department", 7, STYLE.subtitle, 18),
    mergedTitle("Remuneration Bill", 7, STYLE.subtitle, 18),
    { cells: emptyCells(7), height: 10 },
    mergedTitle(statementText(exam), 7, STYLE.statement, 30),
    {
      cells: [
        { value: `${exam.semester} - ${exam.examType}`, style: STYLE.label },
        ...emptyCells(4),
        { value: `Date - ${formatDate(new Date())}`, style: STYLE.label },
        { value: "", style: STYLE.label },
      ],
      height: 24,
    },
  ];
  const merges = [
    "A1:G1",
    "A2:G2",
    "A3:G3",
    "A4:G4",
    "A6:G6",
    "A7:C7",
    "F7:G7",
  ];

  rows.push({
    cells: [
      "Sr..No",
      "Name of Employee",
      "Exam Conduction",
      "Invigilation / Reliever",
      "Paper Setting",
      "Assessment",
      "Amount of receivables",
    ].map((value) => ({ value, style: STYLE.header })),
    height: 38,
  });

  const grouped = groupBy(allRows, (row) => row.staffName || "Unknown");
  let sr = 1;
  let grandTotal = 0;

  grouped.forEach((staffRows, staffName) => {
    const examConduction = sum(staffRows, (row) => conductionAmount(row));
    const invigilation = sum(staffRows, (row) => invigilationAmount(row));
    const paperSetting = sum(staffRows, (row) => paperSettingAmountForRow(row));
    const assessment = sum(staffRows, (row) => assessmentAmountForRow(row));
    const receivable = examConduction + invigilation + paperSetting + assessment;
    grandTotal += receivable;

    rows.push({
      cells: [
        { value: sr, style: STYLE.center },
        { value: staffName, style: STYLE.text },
        { value: examConduction, style: STYLE.amount },
        { value: invigilation, style: STYLE.amount },
        { value: paperSetting, style: STYLE.amount },
        { value: assessment, style: STYLE.amount },
        { value: receivable, style: STYLE.total },
      ],
      height: 26,
    });
    sr += 1;
  });

  if (allRows.length === 0) {
    rows.push(blankTableRow(7, "No entries for this exam."));
    merges.push(`A${rows.length}:G${rows.length}`);
  }

  rows.push({
    cells: [
      ...emptyCells(5),
      { value: "Total", style: STYLE.rightTotal },
      { value: grandTotal, style: STYLE.total },
    ],
    height: 26,
  });
  rows.push({ cells: emptyCells(7), height: 18 });
  rows.push({
    cells: [
      { value: "Amount in word ( Total ) -", style: STYLE.label },
      ...emptyCells(2),
      { value: grandTotal, style: STYLE.label },
      ...emptyCells(3),
    ],
    height: 28,
  });
  rows.push({ cells: emptyCells(7), height: 34 });
  rows.push({
    cells: [
      { value: "Sign of Exam Coordinator", style: STYLE.text },
      ...emptyCells(3),
      { value: "Sign of HOD", style: STYLE.text },
      ...emptyCells(2),
    ],
    height: 34,
  });
  rows.push({
    cells: [
      { value: "Sign of Controller of Examination", style: STYLE.text },
      ...emptyCells(6),
    ],
    height: 34,
  });

  return {
    name: `${exam.shortName} Total`,
    widths: TOTAL_WIDTHS,
    rows,
    merges,
  };
}

function commonHeadingRows(exam, columnCount) {
  return [
    mergedTitle("VEERMATA JIJABAI TECHNOLOGICAL INSTITUTE", columnCount, STYLE.title, 24),
    mergedTitle("MATUNGA, MUMBAI - 400 019.", columnCount, STYLE.subtitle, 18),
    { cells: emptyCells(columnCount), height: 12 },
    mergedTitle(statementText(exam), columnCount, STYLE.statement, 34),
    { cells: emptyCells(columnCount), height: 10 },
    {
      cells: [
        { value: `${exam.semester} - ${exam.examType}`, style: STYLE.label },
        ...emptyCells(columnCount - 3),
        { value: `Date: ${formatDate(new Date())}`, style: STYLE.label },
        { value: "", style: STYLE.label },
      ],
      height: 24,
    },
    { cells: emptyCells(columnCount), height: 12 },
  ];
}

function statementText(exam) {
  return `Statement showing the remuneration payable to staff engaged for the M.C.A. ${exam.examType} Examinations ${exam.month} during the period from ${exam.period}`;
}

function addSignatureRows(rows, columnCount, labels = ["Department Exam Coordinator", "Head of Department", "Controller of Examination"]) {
  rows.push({ cells: emptyCells(columnCount), height: 34 });
  rows.push({ cells: emptyCells(columnCount), height: 28 });
  const cells = emptyCells(columnCount);
  const positions = labels.length === 2 ? [0, Math.max(0, columnCount - 3)] : [0, 2, 4];
  labels.forEach((label, index) => {
    cells[positions[index]] = { value: label, style: STYLE.signature };
  });
  rows.push({ cells, height: 28 });
}

function mergedTitle(value, columnCount, style, height) {
  return {
    cells: [{ value, style }, ...emptyCells(columnCount - 1)],
    height,
  };
}

function blankTableRow(columnCount, message) {
  return {
    cells: [{ value: message, style: STYLE.text }, ...emptyCells(columnCount - 1)],
    height: 28,
  };
}

function emptyCells(count) {
  return Array.from({ length: count }, () => ({ value: "", style: STYLE.normal }));
}

function courseLabel(row) {
  const code = row.courseCode || "";
  const title = row.courseTitle || "";
  return [code, title].filter(Boolean).join(" ");
}

function teachingAmount(row) {
  return (
    paperSettingAmountForRow(row) +
    assessmentAmountForRow(row)
  );
}

function hasDuty(row) {
  return Boolean(
    row.dutyRole ||
    row.dutyDates ||
    Number(row.dutyDays || 0) > 0 ||
    (Number(row.dutyRate || 0) > 0 && Number(row.dutyAmount || 0) > 0)
  );
}

function dutyAmount(row) {
  const stored = Number(row.dutyAmount || 0);
  if (stored > 0) return stored;
  return Number(row.dutyDays || 0) * Number(row.dutyRate || 0);
}

function isTeaching(row) {
  return String(row.designation || "").toLowerCase() === "teaching";
}

function groupBy(items, getKey) {
  const map = new Map();
  items.forEach((item) => {
    const key = getKey(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return map;
}

function sum(items, getValue) {
  return items.reduce((total, item) => total + Number(getValue(item) || 0), 0);
}

function formatDate(date) {
  return [
    String(date.getDate()).padStart(2, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    date.getFullYear(),
  ].join(".");
}

function buildXlsx(sheets) {
  const worksheetEntries = sheets.map((sheet, index) => ({
    name: `xl/worksheets/sheet${index + 1}.xml`,
    content: worksheetXml(sheet),
  }));

  const entries = [
    { name: "[Content_Types].xml", content: contentTypesXml(sheets.length) },
    { name: "_rels/.rels", content: rootRelsXml() },
    { name: "docProps/core.xml", content: docPropsCoreXml() },
    { name: "docProps/app.xml", content: docPropsAppXml() },
    { name: "xl/workbook.xml", content: workbookXml(sheets) },
    { name: "xl/_rels/workbook.xml.rels", content: workbookRelsXml(sheets.length) },
    { name: "xl/styles.xml", content: stylesXml() },
    ...worksheetEntries,
  ];

  return new Blob([zip(entries)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function worksheetXml(sheet) {
  const rowCount = sheet.rows.length || 1;
  const colCount = sheet.widths?.length || 1;
  const dimensionRef = `A1:${columnName(colCount)}${rowCount}`;

  const rowsXml = sheet.rows
    .map((row, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const heightAttr = row.height ? ` ht="${row.height}" customHeight="1"` : "";
      const cells = row.cells
        .map((cell, columnIndex) => cellXml(cell, rowNumber, columnIndex + 1))
        .join("");
      return `<row r="${rowNumber}"${heightAttr}>${cells}</row>`;
    })
    .join("");

  const colsXml = sheet.widths
    .map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`)
    .join("");

  const mergesXml = sheet.merges?.length
    ? `<mergeCells count="${sheet.merges.length}">${sheet.merges.map((ref) => `<mergeCell ref="${ref}"/>`).join("")}</mergeCells>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="${dimensionRef}"/>
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>${colsXml}</cols>
  <sheetData>${rowsXml}</sheetData>
  ${mergesXml}
  <pageMargins left="0.25" right="0.25" top="0.4" bottom="0.4" header="0.2" footer="0.2"/>
</worksheet>`;
}

function cellXml(rawCell, rowNumber, columnNumber) {
  const cell = typeof rawCell === "object" && rawCell !== null ? rawCell : { value: rawCell };
  const ref = `${columnName(columnNumber)}${rowNumber}`;
  const style = cell.style ?? STYLE.normal;
  const value = cell.value;

  if (value === null || value === undefined || value === "") {
    return `<c r="${ref}" s="${style}"/>`;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${ref}" s="${style}"><v>${value}</v></c>`;
  }

  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t>${escapeXml(String(value))}</t></is></c>`;
}

function columnName(columnNumber) {
  let name = "";
  let value = columnNumber;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function contentTypesXml(sheetCount) {
  const sheets = Array.from({ length: sheetCount }, (_, index) =>
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${sheets}
</Types>`;
}

function docPropsCoreXml() {
  const stamp = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>MCA Exam Sheets</dc:title>
  <dc:creator>MCA Department</dc:creator>
  <cp:lastModifiedBy>Staff Management System</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${stamp}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${stamp}</dcterms:modified>
</cp:coreProperties>`;
}

function docPropsAppXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Staff Management System</Application>
</Properties>`;
}

function rootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function workbookXml(sheets) {
  const sheetXml = sheets
    .map((sheet, index) =>
      `<sheet name="${escapeXml(sheet.name.slice(0, 31))}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheetXml}</sheets>
</workbook>`;
}

function workbookRelsXml(sheetCount) {
  const sheetRels = Array.from({ length: sheetCount }, (_, index) =>
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheetRels}
  <Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="11"/><name val="Times New Roman"/></font>
    <font><b/><sz val="14"/><name val="Times New Roman"/></font>
    <font><b/><sz val="11"/><name val="Times New Roman"/></font>
    <font><b/><sz val="10"/><name val="Times New Roman"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF2F2F2"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color indexed="64"/></left><right style="thin"><color indexed="64"/></right><top style="thin"><color indexed="64"/></top><bottom style="thin"><color indexed="64"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="12">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

function zip(entries) {
  const encoder = new TextEncoder();
  const fileRecords = [];
  const centralRecords = [];
  let offset = 0;

  entries.forEach((entry) => {
    const nameBytes = encoder.encode(entry.name);
    const dataBytes = entry.content instanceof Uint8Array
      ? entry.content
      : encoder.encode(entry.content);
    const crc = crc32(dataBytes);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 10, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, dataBytes.length, true);
    localView.setUint32(22, dataBytes.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 10, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, dataBytes.length, true);
    centralView.setUint32(24, dataBytes.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    fileRecords.push(localHeader, dataBytes);
    centralRecords.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  });

  const centralSize = centralRecords.reduce((total, record) => total + record.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);

  return concatUint8([...fileRecords, ...centralRecords, end]);
}

function concatUint8(parts) {
  const size = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(size);
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function sanitizePlainTextForXml(value) {
  let out = "";
  for (const ch of String(value)) {
    const code = ch.codePointAt(0);
    const allowed =
      code === 9 ||
      code === 10 ||
      code === 13 ||
      (code >= 32 && code <= 0xd7ff) ||
      (code >= 0xe000 && code <= 0xfffd);
    if (allowed) out += ch;
  }
  return out;
}

function escapeXml(value) {
  return sanitizePlainTextForXml(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
