import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { downloadExamWorkbook } from "../utils/examWorkbook";
import { addVjtiLogoToPdf } from "../utils/logo";
import { loadTaskRates } from "../utils/taskRates";

const EXAM_MONTHS = [
  "January 2026",
  "February 2026",
  "March 2026",
  "April 2026",
  "May 2026",
  "June 2026",
  "July 2026",
  "August 2026",
  "September 2026",
  "October 2026",
  "November 2026",
  "December 2026",
];

function assessmentAmountForEntry(entry) {
  const assessments = Number(entry?.assessments || 0);
  const amount = assessments * Number(entry?.assessmentRate || 0);
  if (assessments > 0 && entry?.examType === "Re-ESE") {
    return Math.max(amount, 200);
  }
  return amount;
}

function paperSettingAmountForEntry(entry) {
  if (entry?.examType === "Re-ESE") {
    return 0;
  }
  return Number(entry?.paperSets || 0) * Number(entry?.paperSetRate || 0);
}

function dutyAmountForEntry(entry) {
  const role = String(entry?.dutyRole || "").trim().toLowerCase();
  if (role === "reliever") {
    const sessions = Number(entry?.relieverSessionCount || 0);
    if (sessions > 0) return (sessions / 2) * Number(entry?.dutyRate || 0);
  }

  const payableDays = Number(entry?.payableDutyDays || entry?.dutyDays || 0);
  const calculated = payableDays * Number(entry?.dutyRate || 0);
  return calculated || Number(entry?.dutyAmount || 0);
}

function hasDutyEntry(entry) {
  return Boolean(
    entry?.dutyRole ||
    entry?.dutyDates ||
    Number(entry?.dutyDays || 0) > 0 ||
    Number(entry?.payableDutyDays || 0) > 0 ||
    Number(entry?.relieverSessionCount || 0) > 0 ||
    Number(entry?.dutyAmount || 0) > 0
  );
}

function hasTeachingEntry(entry) {
  return Boolean(
    entry?.courseCode ||
    entry?.courseTitle ||
    Number(entry?.paperSets || 0) > 0 ||
    Number(entry?.assessments || 0) > 0
  );
}

function entryWorkLabel(entry) {
  if (hasDutyEntry(entry)) {
    const role = entry?.dutyRole || "Exam Duty";
    const days = Number(entry?.payableDutyDays || entry?.dutyDays || 0);
    const dates = entry?.dutyDates ? ` - ${entry.dutyDates}` : "";
    return `${role}${days ? ` - ${days} day${days === 1 ? "" : "s"}` : ""}${dates}`;
  }

  if (hasTeachingEntry(entry)) {
    const subject = [entry?.courseCode, entry?.courseTitle].filter(Boolean).join(" - ");
    return subject || "Teaching paper / assessment entry";
  }

  return entry?.examLabel || "Chargesheet entry";
}

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user") || "null");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chargesheets, setChargesheets] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(EXAM_MONTHS[0]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [entrySaving, setEntrySaving] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState([]);

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(
        `https://staff-management-system-eluv.onrender.com/api/report?month=${encodeURIComponent(selectedMonth)}`
      );
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load report data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchChargesheets = async () => {
    try {
      const res = await axios.get(
        `https://staff-management-system-eluv.onrender.com/api/chargesheet?month=${encodeURIComponent(selectedMonth)}`
      );
      setChargesheets(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const generateExamWorkbook = async () => {
    try {
      const res = await axios.get("https://staff-management-system-eluv.onrender.com/api/chargesheet");
      await downloadExamWorkbook(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to generate exam workbook. Please try again.");
    }
  };
/* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    fetchReport();
    fetchChargesheets();
  }, []);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    fetchReport();
    fetchChargesheets();
    setSelectedEntryIds([]);
  }, [selectedMonth]);

  const fmt = (val) =>
    Number(val || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const statusMeta = (status) => {
    if (status === "Submitted")
      return { prog: 100, chip: "chip-green", color: "#10b981" };
    if (status === "In Review")
      return { prog: 65, chip: "chip-amber", color: "#f59e0b" };
    return { prog: 20, chip: "chip-blue", color: "#3b82f6" };
  };

  const monthLabel = new Date().toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const userRole =
    (user?.user?.role || user?.user?.type || "").toUpperCase() || "USER";
  const canManageEntries = userRole === "ADMIN" || userRole === "HOD";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("portal_sidebar_collapsed") === "1"
  );
  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem("portal_sidebar_collapsed", next ? "1" : "0");
  };

  const startEditEntry = (entry) => {
    setEditingEntry(entry);
    setEditForm({
      courseCode: entry.courseCode || "",
      courseTitle: entry.courseTitle || "",
      paperSets: Number(entry.paperSets || 0),
      paperSetRate: Number(entry.paperSetRate || loadTaskRates().paperSettingPerSet),
      assessments: Number(entry.assessments || 0),
      assessmentRate: Number(entry.assessmentRate || loadTaskRates().assessmentPerPaper),
      examConduction: Number(entry.examConduction || 0),
      invigilation: Number(entry.invigilation || 0),
      dutyRole: entry.dutyRole || "",
      dutyDays: Number(entry.dutyDays || 0),
      dutyRate: Number(entry.dutyRate || 0),
      dutyAmount: Number(entry.dutyAmount || 0),
      payableDutyDays: Number(entry.payableDutyDays || 0),
      relieverSessionCount: Number(entry.relieverSessionCount || 0),
      relieverAssignments: entry.relieverAssignments || [],
      dutyDates: entry.dutyDates || "",
      status: entry.status || "Pending",
    });
    setError(null);
  };

  const updateEditField = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateEditDutyRole = (value) => {
    const duty = rateCfg.duties.find((item) => item.label === value);
    setEditForm((prev) => ({
      ...prev,
      dutyRole: value,
      ...(duty ? { dutyRate: duty.rate } : {}),
    }));
  };

  const editTotal = (entry = editForm) =>
    paperSettingAmountForEntry(entry) +
    assessmentAmountForEntry(entry) +
    Number(entry?.examConduction || 0) +
    Number(entry?.invigilation || 0) +
    dutyAmountForEntry(entry);

  const refreshEntryData = async () => {
    await fetchReport();
    await fetchChargesheets();
  };

  const saveEditedEntry = async () => {
    if (!editingEntry || !editForm) return;

    try {
      setEntrySaving(true);
      await axios.put(
        `https://staff-management-system-eluv.onrender.com/api/chargesheet/${editingEntry._id}`,
        editForm
      );
      setEditingEntry(null);
      setEditForm(null);
      await refreshEntryData();
    } catch (err) {
      console.error(err);
      setError("Failed to update entry. Please try again.");
    } finally {
      setEntrySaving(false);
    }
  };

  const deleteEntry = async (entry) => {
    const ok = window.confirm(`Delete entry for ${entry.staffName}?`);
    if (!ok) return;

    try {
      await axios.delete(`https://staff-management-system-eluv.onrender.com/api/chargesheet/${entry._id}`);
      await refreshEntryData();
    } catch (err) {
      console.error(err);
      setError("Failed to delete entry. Please try again.");
    }
  };

  const toggleEntrySelection = (entryId) => {
    setSelectedEntryIds((prev) =>
      prev.includes(entryId) ? prev.filter((id) => id !== entryId) : [...prev, entryId]
    );
  };

  const deleteSelectedEntries = async () => {
    if (selectedEntryIds.length === 0) return;
    const ok = window.confirm(`Delete ${selectedEntryIds.length} selected entr${selectedEntryIds.length === 1 ? "y" : "ies"}?`);
    if (!ok) return;

    try {
      await Promise.all(
        selectedEntryIds.map((id) =>
          axios.delete(`https://staff-management-system-eluv.onrender.com/api/chargesheet/${id}`)
        )
      );
      setSelectedEntryIds([]);
      await refreshEntryData();
    } catch (err) {
      console.error(err);
      setError("Failed to delete selected entries. Please try again.");
    }
  };

  const rateCfg = loadTaskRates();
  const paperCost = (data?.chargesheets || []).reduce(
    (sum, entry) => sum + paperSettingAmountForEntry({
      ...entry,
      paperSetRate: entry?.paperSetRate || rateCfg.paperSettingPerSet,
    }),
    0
  );
  const supervisionCost = (data?.chargesheets || []).reduce(
    (sum, entry) => sum + assessmentAmountForEntry({
      ...entry,
      assessmentRate: entry?.assessmentRate || rateCfg.assessmentPerPaper,
    }),
    0
  );
  const lectureCost = 0;

  const grandTotal =
    (data?.teachingTotal || 0) +
    (data?.nonTeachingTotal || 0) +
    paperCost +
    supervisionCost +
    lectureCost;

  const visibleEntries =
    data?.chargesheets && data.chargesheets.length > 0 ? data.chargesheets : chargesheets;
  const visibleEntryIds = visibleEntries.map((entry) => entry._id);
  const selectedVisibleCount = selectedEntryIds.filter((id) => visibleEntryIds.includes(id)).length;
  const allVisibleSelected =
    visibleEntryIds.length > 0 && visibleEntryIds.every((id) => selectedEntryIds.includes(id));
  const toggleAllVisibleEntries = () => {
    setSelectedEntryIds((prev) => {
      const visibleSet = new Set(visibleEntryIds);
      if (allVisibleSelected) return prev.filter((id) => !visibleSet.has(id));
      return Array.from(new Set([...prev, ...visibleEntryIds]));
    });
  };

  // ─── ROLE-BASED NAV CONFIG ────────────────────────────────────────────────
  // Each nav item has a `roles` array — if empty it means visible to ALL roles.
  // ACCOUNTS role sees only items explicitly including "ACCOUNTS".
  const NAV_GROUPS = [
    {
      label: "Overview",
      items: [
        {
          label: "Overview",
          path: "/",
          roles: ["ADMIN", "HOD", "ACCOUNTS"],
          dot: false,
        },
      ],
    },
    {
      label: "Staff",
      // Accounts does NOT see staff directory
      roles: ["ADMIN", "HOD"],
      items: [
        { label: "Teaching",     path: "/teaching",     roles: ["ADMIN", "HOD"] },
        { label: "Non-Teaching", path: "/non-teaching", roles: ["ADMIN", "HOD"] },
      ],
    },
    {
      label: "Chargesheet",
      items: [
        { label: "Create Chargesheet", path: "/chargesheet", roles: ["ADMIN", "HOD"], dot: true },
        { label: "Add Subject",        path: "/add-subject", roles: ["ADMIN", "HOD"], dot: true },
        { label: "Add Staff",          path: "/add-staff",   roles: ["ADMIN", "HOD"], dot: true },
        { label: "Task Rates",         path: "/task-rates",   roles: ["ADMIN", "HOD"], dot: true },
        { label: "Create Timetable",   path: "/timetable",   roles: ["ADMIN", "HOD"], dot: true },
        { label: "Accounts Section",   path: "/accounts",    roles: ["ACCOUNTS"],     dot: true },
      ],
    },
  ];

  const isVisible = (roles) => {
    if (!roles || roles.length === 0) return true;
    return roles.includes(userRole);
  };

  // ─── PDF GENERATOR ────────────────────────────────────────────────────────
  const generateChargesheetPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const navy = [26, 60, 110];
    const navyLight = [220, 232, 248];
    const navyFaint = [244, 248, 255];

    doc.setFillColor(...navy);
    doc.rect(0, 0, pageWidth, 24, "F");
    await addVjtiLogoToPdf(doc, { x: 8, y: 3, width: 18, height: 18 });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("MCA DEPARTMENT — CHARGESHEET", 14, 11);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text("Department Internal Financial Document  |  CONFIDENTIAL", 14, 17);
    doc.text(`Month: ${monthLabel}`, pageWidth - 14, 9, { align: "right" });
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 14, 15, { align: "right" });

    const fmtRs = (val) => `Rs. ${Number(val || 0).toLocaleString("en-IN")}`;

    const sectionHeader = (label, y) => {
      doc.setFillColor(...navy);
      doc.roundedRect(14, y, pageWidth - 28, 8, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text(label.toUpperCase(), 17, y + 5.5);
      return y + 8;
    };

    let y = sectionHeader("Exam Sheet Entries", 30);

    const staffRows = (data?.chargesheets || []).map((c) => [
      c.staffName,
      `${c.academicYear || ""} ${c.semester || ""}`.trim(),
      c.examType || "",
      c.courseCode || "-",
      fmtRs(c.total),
    ]);

    autoTable(doc, {
      head: [["Name", "Class/Sem", "Exam", "Course", "Total"]],
      body: staffRows,
      startY: y,
      margin: { left: 14, right: 14 },
      tableWidth: pageWidth - 28,
      styles: { fontSize: 8.5, cellPadding: 3.5, textColor: [40, 40, 40], overflow: "linebreak" },
      headStyles: { fillColor: navyLight, textColor: navy, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: navyFaint },
      columnStyles: {
        0: { cellWidth: 42 }, 1: { cellWidth: 30 },
        2: { cellWidth: 28 }, 3: { cellWidth: 34 },
        4: { cellWidth: 32, halign: "right" },
      },
    });

    y = doc.lastAutoTable.finalY + 6;
    y = sectionHeader("Other Charges", y);

    const otherRows = [
      ["Paper Setting",  data?.papersSet,        fmtRs(rateCfg.paperSettingPerSet),       fmtRs(paperCost)],
      ["Assessment",     data?.supervisionCount, fmtRs(rateCfg.assessmentPerPaper), fmtRs(supervisionCost)],
    ];

    autoTable(doc, {
      head: [["Task", "Count", "Rate", "Total"]],
      body: otherRows,
      startY: y,
      margin: { left: 14, right: 14 },
      tableWidth: pageWidth - 28,
      styles: { fontSize: 8.5, cellPadding: 3.5, textColor: [40, 40, 40] },
      headStyles: { fillColor: navyLight, textColor: navy, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: navyFaint },
      columnStyles: {
        0: { cellWidth: 60 }, 1: { cellWidth: 30, halign: "right" },
        2: { cellWidth: 40, halign: "right" }, 3: { cellWidth: 36, halign: "right" },
      },
    });

    y = doc.lastAutoTable.finalY + 6;
    y = sectionHeader("Financial Summary", y);
    y += 4;

    const summaryItems = [
      ["Teaching Staff Total",     data?.teachingTotal    || 0],
      ["Non-Teaching Staff Total", data?.nonTeachingTotal || 0],
      ["Paper Setting Cost",       paperCost],
      ["Assessment Cost",          supervisionCost],
    ];

    const cardW = (pageWidth - 28 - 6) / 2;
    const cardH = 16;

    summaryItems.forEach(([label, amount], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = 14 + col * (cardW + 6);
      const cy = y + row * (cardH + 4);
      doc.setFillColor(...navyFaint);
      doc.setDrawColor(...navyLight);
      doc.roundedRect(cx, cy, cardW, cardH, 2, 2, "FD");
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.text(label, cx + 5, cy + 5.5);
      doc.setFontSize(10);
      doc.setTextColor(...navy);
      doc.setFont("helvetica", "bold");
      doc.text(fmtRs(amount), cx + 5, cy + 12.5);
    });

    const rows = Math.ceil(summaryItems.length / 2);
    const gtY = y + rows * (cardH + 4) + 2;

    doc.setFillColor(...navy);
    doc.roundedRect(14, gtY, pageWidth - 28, 14, 2, 2, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("GRAND TOTAL", 20, gtY + 9);
    doc.setFontSize(11);
    doc.text(fmtRs(data?.grandTotal || grandTotal), pageWidth - 20, gtY + 9, { align: "right" });

    const sigY = gtY + 22;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.setLineDash([2, 2]);
    doc.line(14, sigY, pageWidth - 14, sigY);
    doc.setLineDash([]);

    const sigPositions = [
      { label: "HOD, MCA Dept.",       role: "Prepared By",  x: pageWidth * 0.18 },
      { label: "Accounts Section",     role: "Verified By",  x: pageWidth * 0.50 },
      { label: "Principal / Director", role: "Approved By",  x: pageWidth * 0.82 },
    ];

    sigPositions.forEach(({ label, role, x }) => {
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.4);
      doc.line(x - 24, sigY + 14, x + 24, sigY + 14);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...navy);
      doc.text(label, x, sigY + 18.5, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(role, x, sigY + 23.5, { align: "center" });
    });

    doc.setFillColor(...navy);
    doc.rect(0, pageHeight - 12, pageWidth, 12, "F");
    doc.setFontSize(7);
    doc.setTextColor(200, 210, 230);
    doc.setFont("helvetica", "normal");
    doc.text(
      "This document is auto-generated. For queries, contact the MCA Department.",
      14, pageHeight - 5
    );
    doc.text("Page 1 of 1", pageWidth - 14, pageHeight - 5, { align: "right" });

    doc.save("MCA_Chargesheet.pdf");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #f0f2f8; }

        .dash-shell { display: flex; min-height: 100vh; font-family: 'DM Sans', sans-serif; }
        .dash-shell.sidebar-collapsed .sidebar { width: 72px; min-width: 72px; }
        .dash-shell.sidebar-collapsed .logo-text,
        .dash-shell.sidebar-collapsed .nav-group-label,
        .dash-shell.sidebar-collapsed .nav-item span:not(.nav-dot),
        .dash-shell.sidebar-collapsed .sidebar-user-info { display: none; }

        /* SIDEBAR */
        .sidebar {
          width: 240px; min-width: 240px;
          background: #0b1120;
          display: flex; flex-direction: column;
          position: relative; overflow: visible;
          transition: width .2s ease, min-width .2s ease;
        }
        .sidebar::before {
          content: ''; position: absolute;
          top: -60px; left: -60px; width: 220px; height: 220px;
          background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .logo-section {
          padding: 20px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex; align-items: center; gap: 12px;
        }
        .logo-img-wrap {
          width: 48px; height: 48px; border-radius: 10px;
          background: #fff; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0; overflow: hidden; padding: 4px;
        }
        .logo-img-wrap img { width: 100%; height: 100%; object-fit: contain; }
        .logo-text h3 {
          font-family: 'DM Serif Display', serif;
          font-size: 14px; color: #fff; line-height: 1.2; font-weight: 400;
        }
        .logo-text p {
          font-size: 10px; color: rgba(255,255,255,0.38);
          margin-top: 3px; letter-spacing: 0.5px; text-transform: uppercase;
        }
        .sidebar-toggle {
          position: absolute; right: -14px; top: 24px; z-index: 100;
          width: 30px; height: 30px; border: 1px solid rgba(148,163,184,.35);
          background: #111827; color: #dbeafe; border-radius: 999px; cursor: pointer;
          font-size: 16px; line-height: 1; box-shadow: 0 8px 20px rgba(15,23,42,.28);
        }
        .dash-shell.sidebar-collapsed .sidebar-toggle { right: -15px; }
        .nav-section { padding: 8px 12px 0; flex: 1; overflow-y: auto; }
        .nav-group-label {
          font-size: 9.5px; font-weight: 600; letter-spacing: 0.9px;
          text-transform: uppercase; color: rgba(255,255,255,0.28);
          padding: 16px 8px 6px;
        }
        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border-radius: 8px;
          font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.52);
          cursor: pointer; transition: all 0.15s ease; margin-bottom: 1px;
        }
        .nav-item:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.85); }
        .nav-item.active { background: rgba(59,130,246,0.18); color: #93c5fd; font-weight: 600; }
        .nav-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: currentColor; flex-shrink: 0; opacity: 0.7;
        }
        .nav-item.active .nav-dot { background: #3b82f6; opacity: 1; box-shadow: 0 0 6px rgba(59,130,246,0.6); }

        /* Accounts-only accent — subtle teal tint to distinguish the limited nav */
        .nav-item.accounts-only {
          color: rgba(110,231,183,0.7);
        }
        .nav-item.accounts-only:hover {
          background: rgba(16,185,129,0.1);
          color: #6ee7b7;
        }
        .nav-item.accounts-only.active {
          background: rgba(16,185,129,0.15);
          color: #6ee7b7;
        }

        /* Role banner shown inside sidebar for ACCOUNTS */
        .role-access-banner {
          margin: 10px 12px 0;
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.2);
          border-radius: 8px;
          padding: 8px 12px;
          display: flex; align-items: center; gap: 8px;
        }
        .role-access-banner .dot {
          width: 6px; height: 6px; border-radius: 50%; background: #10b981; flex-shrink: 0;
        }
        .role-access-banner span {
          font-size: 10.5px; color: #6ee7b7; line-height: 1.4;
        }

        /* Sidebar user footer */
        .sidebar-user {
          margin: 0 12px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 12px;
          display: flex; align-items: center; gap: 10px;
        }
        .sidebar-logo-avatar {
          width: 36px; height: 36px; border-radius: 8px;
          background: #fff; overflow: hidden; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; padding: 3px;
        }
        .sidebar-logo-avatar img { width: 100%; height: 100%; object-fit: contain; }
        .sidebar-user-info { flex: 1; min-width: 0; }
        .sidebar-user-name {
          font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.9);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sidebar-user-role {
          font-size: 10px; color: rgba(255,255,255,0.4);
          text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;
        }
        .role-admin   { color: #fbbf24; }
        .role-hod     { color: #6ee7b7; }
        .role-accounts { color: #34d399; }
        .role-default { color: rgba(255,255,255,0.4); }

        /* MAIN */
        .main { flex: 1; display: flex; flex-direction: column; background: #f0f2f8; min-width: 0; }

        /* TOPBAR */
        .topbar {
          background: #fff; border-bottom: 1px solid #e2e8f0;
          padding: 14px 28px; display: flex; align-items: center; justify-content: space-between;
        }
        .college-name {
          font-size: 11px; font-weight: 600; letter-spacing: 0.5px;
          text-transform: uppercase; color: #3b82f6; margin-bottom: 3px;
        }
        .topbar-title {
          font-family: 'DM Serif Display', serif;
          font-size: 22px; color: #0f172a; font-weight: 400; line-height: 1;
        }
        .topbar-right { display: flex; align-items: center; gap: 10px; }

        .topbar-user-pill {
          display: flex; align-items: center; gap: 10px;
          background: #f8fafc; border: 1px solid #e2e8f0;
          padding: 6px 14px 6px 6px; border-radius: 999px;
          cursor: pointer; transition: background 0.15s;
        }
        .topbar-user-pill:hover { background: #f1f5f9; }
        .topbar-logo-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: #fff; border: 1px solid #e2e8f0;
          overflow: hidden; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; padding: 3px;
        }
        .topbar-logo-avatar img { width: 100%; height: 100%; object-fit: contain; }
        .topbar-user-name { font-size: 13px; font-weight: 600; color: #0f172a; line-height: 1.2; }
        .topbar-role-badge {
          font-size: 10px; font-weight: 700; letter-spacing: 0.6px;
          padding: 2px 8px; border-radius: 20px; text-transform: uppercase;
        }
        .badge-admin    { background: #fef3c7; color: #92400e; }
        .badge-hod      { background: #d1fae5; color: #065f46; }
        .badge-accounts { background: #d1fae5; color: #065f46; }
        .badge-default  { background: #e0e7ff; color: #3730a3; }

        .btn-pdf {
          background: #3C3489; color: #fff; border: none;
          padding: 8px 16px; border-radius: 9px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: background 0.15s;
          white-space: nowrap;
        }
        .btn-pdf:hover { background: #2e2870; }

        .month-select {
          padding: 7px 10px; border-radius: 8px; border: 1px solid #e2e8f0;
          font-size: 13px; font-family: 'DM Sans', sans-serif;
          color: #0f172a; background: #fff; cursor: pointer;
        }

        /* BODY */
        .body { padding: 24px 28px; display: flex; flex-direction: column; gap: 20px; }

        .state-box { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; gap: 12px; }
        .state-spinner { width: 36px; height: 36px; border-radius: 50%; border: 3px solid #e2e8f0; border-top-color: #3b82f6; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .state-msg { font-size: 14px; color: #64748b; }
        .retry-btn { padding: 7px 18px; border-radius: 8px; background: #3b82f6; color: #fff; border: none; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; }

        /* KPI Cards */
        .kpi-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .kpi-card {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
          padding: 20px 22px; display: flex; flex-direction: column; gap: 14px;
          position: relative; overflow: hidden;
          opacity: 0; transform: translateY(16px);
          animation: fadeUp 0.45s ease forwards;
        }
        .kpi-card:nth-child(1) { animation-delay: 0.05s; }
        .kpi-card:nth-child(2) { animation-delay: 0.12s; }
        .kpi-card:nth-child(3) { animation-delay: 0.19s; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
        .kpi-card::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 14px 14px 0 0; }
        .kpi-card.teaching::after   { background: #6366f1; }
        .kpi-card.nonteaching::after { background: #10b981; }
        .kpi-card.grand::after       { background: #f59e0b; }
        .kpi-top { display: flex; align-items: center; justify-content: space-between; }
        .kpi-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .kpi-icon.teaching    { background: #eef2ff; }
        .kpi-icon.nonteaching { background: #ecfdf5; }
        .kpi-icon.grand       { background: #fffbeb; }
        .kpi-badge { font-size: 10px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
        .kpi-badge.teaching    { background: #eef2ff; color: #4338ca; }
        .kpi-badge.nonteaching { background: #ecfdf5; color: #065f46; }
        .kpi-badge.grand       { background: #fffbeb; color: #92400e; }
        .kpi-amount { font-family: 'DM Serif Display', serif; font-size: 30px; color: #0f172a; line-height: 1; letter-spacing: -0.5px; }
        .kpi-label  { font-size: 12px; font-weight: 500; color: #64748b; margin-top: 4px; }
        .kpi-bar  { height: 4px; border-radius: 2px; background: #f1f5f9; overflow: hidden; }
        .kpi-fill { height: 100%; border-radius: 2px; transition: width 1s ease; }
        .kpi-fill.teaching    { background: #6366f1; }
        .kpi-fill.nonteaching { background: #10b981; }
        .kpi-fill.grand       { background: #f59e0b; }

        /* Stats band */
        .stats-band {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
          display: flex; overflow: hidden;
          opacity: 0; animation: fadeUp 0.45s ease 0.26s forwards;
        }
        .stat-block { flex: 1; padding: 16px 20px; border-right: 1px solid #e2e8f0; }
        .stat-block:last-child { border-right: none; }
        .stat-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: #94a3b8; margin-bottom: 5px; }
        .stat-val { font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; }
        .stat-sub { font-size: 11px; color: #64748b; margin-top: 2px; }

        /* Chargesheet card */
        .cs-card {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;
          opacity: 0; animation: fadeUp 0.45s ease 0.34s forwards;
        }
        .cs-card-head {
          padding: 14px 20px; border-bottom: 1px solid #e2e8f0;
          display: flex; align-items: center; justify-content: space-between;
          gap: 14px; flex-wrap: wrap;
        }
        .cs-card-title { font-size: 13px; font-weight: 600; color: #0f172a; display: flex; align-items: center; gap: 8px; }
        .cs-card-tools { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .bulk-select-control { display: flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 700; color: #64748b; }
        .entry-select-box {
          width: 16px; height: 16px; accent-color: #3C3489; cursor: pointer; flex-shrink: 0;
        }
        .bulk-delete-btn {
          border: none; border-radius: 8px; padding: 7px 11px;
          font-size: 11px; font-weight: 800; cursor: pointer;
          font-family: 'DM Sans', sans-serif; background: #fee2e2; color: #991b1b;
        }
        .bulk-delete-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cs-row {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 20px; border-bottom: 1px solid #f1f5f9;
          transition: background 0.12s;
        }
        .cs-row:last-child { border-bottom: none; }
        .cs-row:hover { background: #fafcff; }
        .cs-name-col { min-width: 165px; }
        .cs-name { font-size: 13px; font-weight: 600; color: #0f172a; }
        .cs-desg { font-size: 11px; color: #94a3b8; margin-top: 1px; }
        .cs-entry-detail {
          font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.35;
          max-width: 280px;
        }
        .cs-prog-col { flex: 1; }
        .cs-count { font-size: 10px; color: #94a3b8; margin-bottom: 4px; }
        .prog-track { height: 5px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
        .prog-fill  { height: 100%; border-radius: 3px; transition: width 0.8s ease; }
        .cs-meta { text-align: right; min-width: 110px; }
        .cs-amt  { font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
        .status-chip { display: inline-block; font-size: 10px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
        .chip-green { background: #ecfdf5; color: #065f46; }
        .chip-amber { background: #fffbeb; color: #92400e; }
        .chip-blue  { background: #eff6ff; color: #1d4ed8; }
        .cs-row-actions { display: flex; align-items: center; gap: 6px; }
        .cs-action-btn {
          border: none; border-radius: 8px; padding: 6px 10px;
          font-size: 11px; font-weight: 700; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: transform 0.12s, opacity 0.12s;
        }
        .cs-action-btn:hover { transform: translateY(-1px); }
        .cs-action-edit { background: #eef2ff; color: #3730a3; }
        .cs-action-delete { background: #fef2f2; color: #b91c1c; }
        .entry-modal-backdrop {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.48);
          z-index: 200; display: flex; align-items: center; justify-content: center;
          padding: 18px;
        }
        .entry-modal {
          width: min(900px, 100%); max-height: 92vh; overflow-y: auto;
          background: #fff; border-radius: 14px; border: 1px solid #e2e8f0;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
        }
        .entry-modal-head {
          padding: 16px 18px; border-bottom: 1px solid #e2e8f0;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .entry-modal-title { font-size: 15px; font-weight: 700; color: #0f172a; }
        .entry-modal-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
        .entry-modal-body { padding: 18px; display: grid; gap: 14px; }
        .entry-edit-section {
          border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;
          background: #fff;
        }
        .entry-edit-section-title {
          display: flex; align-items: baseline; justify-content: space-between;
          gap: 12px; margin-bottom: 12px;
        }
        .entry-edit-section-title span {
          font-size: 11px; font-weight: 900; color: #0f172a;
          text-transform: uppercase; letter-spacing: 0.7px;
        }
        .entry-edit-section-title small {
          font-size: 11px; font-weight: 600; color: #94a3b8;
        }
        .entry-edit-grid {
          display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .entry-edit-field { display: flex; flex-direction: column; gap: 6px; }
        .entry-edit-field label {
          font-size: 10px; font-weight: 800; color: #64748b;
          letter-spacing: 0.6px; text-transform: uppercase;
        }
        .entry-edit-field input,
        .entry-edit-field select {
          border: 1.5px solid #e2e8f0; border-radius: 9px;
          padding: 10px 12px; font-size: 13px; font-family: 'DM Sans', sans-serif;
          outline: none;
        }
        .entry-edit-field input:focus,
        .entry-edit-field select:focus {
          border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
        .entry-total-box {
          margin-top: 16px; background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 12px; padding: 14px 16px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .entry-total-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.6px; }
        .entry-total-value { font-size: 22px; font-weight: 800; color: #0f172a; }
        .entry-modal-actions {
          padding: 14px 18px; border-top: 1px solid #e2e8f0;
          display: flex; justify-content: flex-end; gap: 10px;
        }
        .entry-cancel-btn,
        .entry-save-btn {
          border: none; border-radius: 9px; padding: 10px 16px;
          font-size: 13px; font-weight: 700; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
        }
        .entry-cancel-btn { background: #f1f5f9; color: #334155; }
        .entry-save-btn { background: #3C3489; color: #fff; }
        .entry-save-btn:disabled { opacity: 0.6; cursor: wait; }
        .empty-row { padding: 32px 20px; text-align: center; font-size: 13px; color: #94a3b8; }
        @media (max-width: 760px) {
          .entry-edit-grid { grid-template-columns: 1fr; }
          .entry-total-box { align-items: flex-start; flex-direction: column; gap: 6px; }
        }

        /* Accounts read-only notice banner */
        .readonly-banner {
          background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px;
          padding: 12px 18px; display: flex; align-items: center; gap: 10px;
        }
        .readonly-banner .icon { font-size: 16px; }
        .readonly-banner p { font-size: 13px; color: #166534; margin: 0; }
        .readonly-banner strong { font-weight: 600; }
      `}</style>

      <div className={`dash-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        {/* ── SIDEBAR ───────────────────────────────────────────── */}
        <div className="sidebar">
          <div className="logo-section">
            <div className="logo-img-wrap">
              <img src="/vjtiLogo.png" alt="VJTI" />
            </div>
            <div className="logo-text">
              <h3>VJTI</h3>
              <p>Chargesheet Portal</p>
            </div>
            <button className="sidebar-toggle" onClick={toggleSidebar} title={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}>
              {sidebarCollapsed ? ">" : "<"}
            </button>
          </div>

          {/* Role access banner — only for ACCOUNTS */}
          {userRole === "ACCOUNTS" && (
            <div className="role-access-banner">
              <div className="dot" />
              <span>View-only access — Accounts Section</span>
            </div>
          )}

          <div className="nav-section">
            {NAV_GROUPS.map((group) => {
              // Filter items visible to current role
              const visibleItems = group.items.filter((item) => isVisible(item.roles));
              // If group itself has a roles restriction and user doesn't qualify, hide whole group
              if (group.roles && !isVisible(group.roles)) return null;
              // If no visible items after filtering, hide the group
              if (visibleItems.length === 0) return null;

              return (
                <React.Fragment key={group.label}>
                  <div className="nav-group-label">{group.label}</div>
                  {visibleItems.map((item) => {
                    const isAccountsOnly =
                      item.roles?.length === 1 && item.roles[0] === "ACCOUNTS";
                    return (
                      <div
                        key={item.label}
                        className={`nav-item ${isAccountsOnly ? "accounts-only" : ""}`}
                        onClick={() => item.path && navigate(item.path)}
                      >
                        {item.dot && <span className="nav-dot" />}
                        {item.label}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>

          {/* Sidebar user footer */}
          {user && (
            <div className="sidebar-user">
              <div className="sidebar-logo-avatar">
                <img src="/vjtiLogo.png" alt="VJTI" />
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user?.user?.name || "User"}</div>
                <div
                  className={`sidebar-user-role ${
                    userRole === "ADMIN"
                      ? "role-admin"
                      : userRole === "HOD"
                      ? "role-hod"
                      : userRole === "ACCOUNTS"
                      ? "role-accounts"
                      : "role-default"
                  }`}
                >
                  {userRole}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── MAIN ─────────────────────────────────────────────── */}
        <div className="main">
          {/* TOPBAR */}
          <div className="topbar">
            <div>
              <div className="college-name">Veermata Jijabai Technological Institute</div>
              <div className="topbar-title">Dashboard</div>
            </div>


            <div className="topbar-right">
              {/* Download PDF — ACCOUNTS + HOD + ADMIN */}
              {(userRole === "ACCOUNTS" || userRole === "HOD" || userRole === "ADMIN") && (
                <button className="btn-pdf" onClick={generateChargesheetPDF}>
                  Download Chargesheet
                </button>
              )}

              {(userRole === "ACCOUNTS" || userRole === "HOD" || userRole === "ADMIN") && (
                <button className="btn-pdf" onClick={generateExamWorkbook}>
                  Download Exam Sheets
                </button>
              )}

              <select
                className="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {EXAM_MONTHS.map((month) => (
                  <option key={month}>{month}</option>
                ))}
              </select>

              {user && (
                <div className="topbar-user-pill" onClick={handleLogout} title="Click to logout">
                  <div className="topbar-logo-avatar">
                    <img src="/vjtiLogo.png" alt="VJTI" />
                  </div>
                  <div>
                    <div className="topbar-user-name">{user?.user?.name || "User"}</div>
                    <div style={{ marginTop: 2 }}>
                      <span
                        className={`topbar-role-badge ${
                          userRole === "ADMIN"
                            ? "badge-admin"
                            : userRole === "HOD"
                            ? "badge-hod"
                            : userRole === "ACCOUNTS"
                            ? "badge-accounts"
                            : "badge-default"
                        }`}
                      >
                        {userRole}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BODY */}
          <div className="body">

            {/* Read-only notice for ACCOUNTS */}
            {userRole === "ACCOUNTS" && (
              <div className="readonly-banner">
                <span className="icon">Read-only</span>
                <p>
                  <strong>Read-only view.</strong> You can review cost summaries and download
                  the chargesheet. Staff management and entry creation are restricted to
                  HOD / Admin.
                </p>
              </div>
            )}

            {loading && (
              <div className="state-box">
                <div className="state-spinner" />
                <div className="state-msg">Loading report data…</div>
              </div>
            )}

            {!loading && error && (
              <div className="state-box">
                <div className="state-msg" style={{ color: "#ef4444" }}>{error}</div>
                <button className="retry-btn" onClick={fetchReport}>Retry</button>
              </div>
            )}

            {!loading && !error && data && (
              <>
                {/* KPI Cards */}
                <div className="kpi-grid">
                  <div className="kpi-card teaching">
                    <div className="kpi-top">
                      <div className="kpi-icon teaching">T</div>
                      <div className="kpi-badge teaching">Teaching</div>
                    </div>
                    <div>
                      <div className="kpi-amount">₹ {fmt(data.teachingTotal)}</div>
                      <div className="kpi-label">Teaching staff total</div>
                    </div>
                    <div className="kpi-bar">
                      <div
                        className="kpi-fill teaching"
                        style={{
                          width: data.grandTotal
                            ? `${Math.round((data.teachingTotal / data.grandTotal) * 100)}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>

                  <div className="kpi-card nonteaching">
                    <div className="kpi-top">
                      <div className="kpi-icon nonteaching">N</div>
                      <div className="kpi-badge nonteaching">Non-Teaching</div>
                    </div>
                    <div>
                      <div className="kpi-amount">₹ {fmt(data.nonTeachingTotal)}</div>
                      <div className="kpi-label">Non-teaching staff total</div>
                    </div>
                    <div className="kpi-bar">
                      <div
                        className="kpi-fill nonteaching"
                        style={{
                          width: data.grandTotal
                            ? `${Math.round((data.nonTeachingTotal / data.grandTotal) * 100)}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>

                  <div className="kpi-card grand">
                    <div className="kpi-top">
                      <div className="kpi-icon grand">⭐</div>
                      <div className="kpi-badge grand">Grand Total</div>
                    </div>
                    <div>
                      <div className="kpi-amount">₹ {fmt(data.grandTotal)}</div>
                      <div className="kpi-label">Combined exam sheet total</div>
                    </div>
                    <div className="kpi-bar">
                      <div className="kpi-fill grand" style={{ width: "100%" }} />
                    </div>
                  </div>
                </div>

                {/* Stats band */}
                <div className="stats-band">
                  <div className="stat-block">
                    <div className="stat-label">Teaching staff</div>
                    <div className="stat-val">{data?.teachingCount ?? "—"}</div>
                    <div className="stat-sub">MCA department</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-label">Non-teaching staff</div>
                    <div className="stat-val">{data?.nonTeachingCount ?? "—"}</div>
                    <div className="stat-sub">MCA department</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-label">Papers set</div>
                    <div className="stat-val">{data?.papersSet ?? "—"}</div>
                    <div className="stat-sub">₹{fmt(rateCfg.paperSettingPerSet)} / set</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-label">Assessed papers</div>
                    <div className="stat-val">{data?.supervisionCount ?? "—"}</div>
                    <div className="stat-sub">Rs. {fmt(rateCfg.assessmentPerPaper)} / paper</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-label">Exam sheets</div>
                    <div className="stat-val">{data?.chargesheets?.length ?? 0}</div>
                    <div className="stat-sub">For selected month</div>
                  </div>
                </div>

                {/* Chargesheet status */}
                <div className="cs-card">
                  <div className="cs-card-head">
                    <div className="cs-card-title">
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
                      MCA Department — Exam Sheet Status
                    </div>
                    <div className="cs-card-tools">
                      {canManageEntries && visibleEntryIds.length > 0 && (
                        <>
                          <label className="bulk-select-control">
                            <input
                              type="checkbox"
                              className="entry-select-box"
                              checked={allVisibleSelected}
                              onChange={toggleAllVisibleEntries}
                            />
                            Select all
                          </label>
                          <button
                            type="button"
                            className="bulk-delete-btn"
                            onClick={deleteSelectedEntries}
                            disabled={selectedVisibleCount === 0}
                          >
                            Delete selected ({selectedVisibleCount})
                          </button>
                        </>
                      )}
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{monthLabel}</span>
                    </div>
                  </div>

                  {data.chargesheets && data.chargesheets.length > 0 ? (
                    data.chargesheets.map((cs) => {
                      const { prog, chip, color } = statusMeta(cs.status);
                      return (
                        <div className="cs-row" key={cs._id}>
                          {canManageEntries && (
                            <input
                              type="checkbox"
                              className="entry-select-box"
                              checked={selectedEntryIds.includes(cs._id)}
                              onChange={() => toggleEntrySelection(cs._id)}
                              aria-label={`Select ${cs.staffName}`}
                            />
                          )}
                          <div className="cs-name-col">
                            <div className="cs-name">{cs.staffName}</div>
                            <div className="cs-desg">{cs.designation}</div>
                            <div className="cs-entry-detail">{entryWorkLabel(cs)}</div>
                          </div>
                          <div className="cs-prog-col">
                            <div className="cs-count">
                              {cs.taskCount} task{cs.taskCount !== 1 ? "s" : ""} assigned
                            </div>
                            <div className="prog-track">
                              <div className="prog-fill" style={{ width: `${prog}%`, background: color }} />
                            </div>
                          </div>
                          <div className="cs-meta">
                            <div className="cs-amt">₹ {fmt(cs.total)}</div>
                            <div className={`status-chip ${chip}`}>{cs.status}</div>
                          </div>
                          {canManageEntries && (
                            <div className="cs-row-actions">
                              <button type="button" className="cs-action-btn cs-action-edit" onClick={() => startEditEntry(cs)}>
                                Edit
                              </button>
                              <button type="button" className="cs-action-btn cs-action-delete" onClick={() => deleteEntry(cs)}>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-row">
                      {chargesheets.length > 0 ? (
                        chargesheets.map((c) => (
                          <div
                            key={c._id}
                            style={{
                              display: "flex", justifyContent: "space-between",
                              alignItems: "center", padding: "12px 20px",
                              borderBottom: "1px solid #f1f5f9", textAlign: "left",
                            }}
                          >
                            {canManageEntries && (
                              <input
                                type="checkbox"
                                className="entry-select-box"
                                checked={selectedEntryIds.includes(c._id)}
                                onChange={() => toggleEntrySelection(c._id)}
                                aria-label={`Select ${c.staffName}`}
                              />
                            )}
                            <div>
                              <span style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{c.staffName}</span>
                              <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>₹ {fmt(c.total)}</span>
                              <span
                                className={`status-chip ${c.status === "Submitted" ? "chip-green" : "chip-blue"}`}
                                style={{ marginLeft: 8 }}
                              >
                                {c.status}
                              </span>
                              <div className="cs-entry-detail">{entryWorkLabel(c)}</div>
                            </div>

                            {canManageEntries && (
                              <div className="cs-row-actions">
                                <button type="button" className="cs-action-btn cs-action-edit" onClick={() => startEditEntry(c)}>
                                  Edit
                                </button>
                                <button type="button" className="cs-action-btn cs-action-delete" onClick={() => deleteEntry(c)}>
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: "32px 20px", textAlign: "center", fontSize: 13, color: "#94a3b8" }}>
                          No chargesheets found for this month.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {editingEntry && editForm && (
                  <div className="entry-modal-backdrop">
                    <div className="entry-modal">
                      <div className="entry-modal-head">
                        <div>
                          <div className="entry-modal-title">Modify Entry</div>
                          <div className="entry-modal-sub">
                            {editingEntry.staffName} - {editingEntry.examLabel || selectedMonth}
                          </div>
                        </div>
                        <button
                          className="cs-action-btn cs-action-delete"
                          onClick={() => {
                            setEditingEntry(null);
                            setEditForm(null);
                          }}
                        >
                          Close
                        </button>
                      </div>

                      <div className="entry-modal-body">
                        <div className="entry-edit-section">
                          <div className="entry-edit-section-title">
                            <span>Paper Setting / Assessment</span>
                            <small>Edit paper sets and papers assessed</small>
                          </div>
                          <div className="entry-edit-grid">
                            <div className="entry-edit-field">
                              <label>Course Code</label>
                              <input
                                value={editForm.courseCode}
                                onChange={(e) => updateEditField("courseCode", e.target.value)}
                                placeholder="Course code"
                              />
                            </div>
                            <div className="entry-edit-field">
                              <label>Course Title</label>
                              <input
                                value={editForm.courseTitle}
                                onChange={(e) => updateEditField("courseTitle", e.target.value)}
                                placeholder="Course title"
                              />
                            </div>
                            <div className="entry-edit-field">
                              <label>Paper Sets</label>
                              <input
                                type="number"
                                min="0"
                                value={editForm.paperSets}
                                onChange={(e) => updateEditField("paperSets", e.target.value)}
                              />
                            </div>
                            <div className="entry-edit-field">
                              <label>Paper Set Rate</label>
                              <input
                                type="number"
                                min="0"
                                value={editForm.paperSetRate}
                                onChange={(e) => updateEditField("paperSetRate", e.target.value)}
                              />
                            </div>
                            <div className="entry-edit-field">
                              <label>Papers Assessed</label>
                              <input
                                type="number"
                                min="0"
                                value={editForm.assessments}
                                onChange={(e) => updateEditField("assessments", e.target.value)}
                              />
                            </div>
                            <div className="entry-edit-field">
                              <label>Assessment Rate</label>
                              <input
                                type="number"
                                min="0"
                                value={editForm.assessmentRate}
                                onChange={(e) => updateEditField("assessmentRate", e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="entry-edit-section">
                          <div className="entry-edit-section-title">
                            <span>Remuneration / Duty</span>
                            <small>Edit role, dates, days and session rate</small>
                          </div>
                          <div className="entry-edit-grid">
                            <div className="entry-edit-field">
                              <label>Duty Role</label>
                              <select
                                value={editForm.dutyRole}
                                onChange={(e) => updateEditDutyRole(e.target.value)}
                              >
                                <option value="">No duty / remuneration role</option>
                                {rateCfg.duties.map((duty) => (
                                  <option key={duty.key} value={duty.label}>
                                    {duty.label} - Rs {duty.rate}/session
                                  </option>
                                ))}
                                {editForm.dutyRole && !rateCfg.duties.some((duty) => duty.label === editForm.dutyRole) && (
                                  <option value={editForm.dutyRole}>{editForm.dutyRole}</option>
                                )}
                              </select>
                            </div>
                            <div className="entry-edit-field">
                              <label>Duty Dates</label>
                              <input
                                value={editForm.dutyDates}
                                onChange={(e) => updateEditField("dutyDates", e.target.value)}
                                placeholder="19.05.2026, 21.05.2026"
                              />
                            </div>
                            <div className="entry-edit-field">
                              <label>Total Days</label>
                              <input
                                type="number"
                                min="0"
                                value={editForm.dutyDays}
                                onChange={(e) => updateEditField("dutyDays", e.target.value)}
                              />
                            </div>
                            <div className="entry-edit-field">
                              <label>Payable Days</label>
                              <input
                                type="number"
                                min="0"
                                value={editForm.payableDutyDays}
                                onChange={(e) => updateEditField("payableDutyDays", e.target.value)}
                              />
                            </div>
                            <div className="entry-edit-field">
                              <label>Rate Per Session</label>
                              <input
                                type="number"
                                min="0"
                                value={editForm.dutyRate}
                                onChange={(e) => updateEditField("dutyRate", e.target.value)}
                              />
                            </div>
                            <div className="entry-edit-field">
                              <label>Reliever Sessions</label>
                              <input
                                type="number"
                                min="0"
                                value={editForm.relieverSessionCount}
                                onChange={(e) => updateEditField("relieverSessionCount", e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="entry-edit-section">
                          <div className="entry-edit-section-title">
                            <span>Extra Amounts / Status</span>
                            <small>Edit direct amounts and approval state</small>
                          </div>
                          <div className="entry-edit-grid">
                            <div className="entry-edit-field">
                              <label>Exam Conduction</label>
                              <input
                                type="number"
                                min="0"
                                value={editForm.examConduction}
                                onChange={(e) => updateEditField("examConduction", e.target.value)}
                              />
                            </div>
                            <div className="entry-edit-field">
                              <label>Invigilation Amount</label>
                              <input
                                type="number"
                                min="0"
                                value={editForm.invigilation}
                                onChange={(e) => updateEditField("invigilation", e.target.value)}
                              />
                            </div>
                            <div className="entry-edit-field">
                              <label>Status</label>
                              <select
                                value={editForm.status}
                                onChange={(e) => updateEditField("status", e.target.value)}
                              >
                                <option>Pending</option>
                                <option>In Review</option>
                                <option>Submitted</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="entry-total-box">
                          <div className="entry-total-label">Updated Total</div>
                          <div className="entry-total-value">Rs. {fmt(editTotal())}</div>
                        </div>
                      </div>

                      <div className="entry-modal-actions">
                        <button
                          className="entry-cancel-btn"
                          onClick={() => {
                            setEditingEntry(null);
                            setEditForm(null);
                          }}
                        >
                          Cancel
                        </button>
                        <button className="entry-save-btn" onClick={saveEditedEntry} disabled={entrySaving}>
                          {entrySaving ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
