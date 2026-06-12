import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { downloadExamWorkbook } from "../utils/examWorkbook";
import { addVjtiLogoToPdf } from "../utils/logo";
import { loadTaskRates } from "../utils/taskRates";

const EXAM_MONTHS = [
  "January 2026","February 2026","March 2026","April 2026",
  "May 2026","June 2026","July 2026","August 2026",
  "September 2026","October 2026","November 2026","December 2026",
];

function assessmentAmountForEntry(entry) {
  const assessments = Number(entry?.assessments || 0);
  const amount = assessments * Number(entry?.assessmentRate || 0);
  if (assessments > 0 && entry?.examType === "Re-ESE") return Math.max(amount, 200);
  return amount;
}

function paperSettingAmountForEntry(entry) {
  if (entry?.examType === "Re-ESE") return 0;
  return Number(entry?.paperSets || 0) * Number(entry?.paperSetRate || 0);
}

function dutyAmountForEntry(entry) {
  const stored = Number(entry?.dutyAmount || 0);
  if (stored > 0) return stored;
  const role = String(entry?.dutyRole || "").trim().toLowerCase();
  if (role === "reliever") {
    const sessions = Number(entry?.relieverSessionCount || 0);
    if (sessions > 0) return (sessions / 2) * Number(entry?.dutyRate || 0);
  }
  const payableDays = Number(entry?.payableDutyDays || entry?.dutyDays || 0);
  return payableDays * Number(entry?.dutyRate || 0);
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("portal_sidebar_collapsed") === "1"
  );

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem("portal_sidebar_collapsed", next ? "1" : "0");
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
  useEffect(() => { if (!user) navigate("/login"); }, [user, navigate]);
  useEffect(() => { fetchReport(); fetchChargesheets(); }, []);
  useEffect(() => { fetchReport(); fetchChargesheets(); }, [selectedMonth]);

  const fmt = (val) =>
    Number(val || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const statusMeta = (status) => {
    if (status === "Submitted") return { prog: 100, chip: "chip-green", color: "#10b981" };
    if (status === "In Review") return { prog: 65, chip: "chip-amber", color: "#f59e0b" };
    return { prog: 20, chip: "chip-blue", color: "#6366f1" };
  };

  const monthLabel = new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });
  const userRole = (user?.user?.role || user?.user?.type || "").toUpperCase() || "USER";
  const canManageEntries = userRole === "ADMIN" || userRole === "HOD";

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
      status: entry.status || "Pending",
    });
    setError(null);
  };

  const updateEditField = (field, value) => setEditForm((prev) => ({ ...prev, [field]: value }));

  const editTotal = (entry = editForm) =>
    paperSettingAmountForEntry(entry) +
    assessmentAmountForEntry(entry) +
    Number(entry?.examConduction || 0) +
    Number(entry?.invigilation || 0) +
    dutyAmountForEntry(entry);

  const refreshEntryData = async () => { await fetchReport(); await fetchChargesheets(); };

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

  const rateCfg = loadTaskRates();
  const paperCost = (data?.chargesheets || []).reduce(
    (sum, entry) => sum + paperSettingAmountForEntry({ ...entry, paperSetRate: entry?.paperSetRate || rateCfg.paperSettingPerSet }), 0
  );
  const supervisionCost = (data?.chargesheets || []).reduce(
    (sum, entry) => sum + assessmentAmountForEntry({ ...entry, assessmentRate: entry?.assessmentRate || rateCfg.assessmentPerPaper }), 0
  );
  const grandTotal = (data?.teachingTotal || 0) + (data?.nonTeachingTotal || 0) + paperCost + supervisionCost;

  const NAV_GROUPS = [
    {
      label: "Overview",
      items: [{ label: "Overview", path: "/", roles: ["ADMIN", "HOD", "ACCOUNTS"], icon: "ti-layout-dashboard" }],
    },
    {
      label: "Staff",
      roles: ["ADMIN", "HOD"],
      items: [
        { label: "Teaching",     path: "/teaching",     roles: ["ADMIN", "HOD"], icon: "ti-school" },
        { label: "Non-Teaching", path: "/non-teaching", roles: ["ADMIN", "HOD"], icon: "ti-users" },
      ],
    },
    {
      label: "Chargesheet",
      items: [
        { label: "Create Chargesheet", path: "/chargesheet", roles: ["ADMIN", "HOD"], dot: true },
        { label: "Add Subject",        path: "/add-subject", roles: ["ADMIN", "HOD"], dot: true },
        { label: "Add Staff",          path: "/add-staff",   roles: ["ADMIN", "HOD"], dot: true },
        { label: "Task Rates",         path: "/task-rates",  roles: ["ADMIN", "HOD"], dot: true },
        { label: "Create Timetable",   path: "/timetable",   roles: ["ADMIN", "HOD"], dot: true },
        { label: "Accounts Section",   path: "/accounts",    roles: ["ACCOUNTS"],     dot: true },
      ],
    },
  ];

  const isVisible = (roles) => {
    if (!roles || roles.length === 0) return true;
    return roles.includes(userRole);
  };

  const userInitials = (name = "") =>
    name.split(" ").slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "U";

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
      c.staffName, `${c.academicYear || ""} ${c.semester || ""}`.trim(),
      c.examType || "", c.courseCode || "-", fmtRs(c.total),
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
    autoTable(doc, {
      head: [["Task", "Count", "Rate", "Total"]],
      body: [
        ["Paper Setting", data?.papersSet, fmtRs(rateCfg.paperSettingPerSet), fmtRs(paperCost)],
        ["Assessment", data?.supervisionCount, fmtRs(rateCfg.assessmentPerPaper), fmtRs(supervisionCost)],
      ],
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
      ["Teaching Staff Total", data?.teachingTotal || 0],
      ["Non-Teaching Staff Total", data?.nonTeachingTotal || 0],
      ["Paper Setting Cost", paperCost],
      ["Assessment Cost", supervisionCost],
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
      doc.setFontSize(7); doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "normal");
      doc.text(label, cx + 5, cy + 5.5);
      doc.setFontSize(10); doc.setTextColor(...navy); doc.setFont("helvetica", "bold");
      doc.text(fmtRs(amount), cx + 5, cy + 12.5);
    });

    const rows = Math.ceil(summaryItems.length / 2);
    const gtY = y + rows * (cardH + 4) + 2;
    doc.setFillColor(...navy);
    doc.roundedRect(14, gtY, pageWidth - 28, 14, 2, 2, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
    doc.text("GRAND TOTAL", 20, gtY + 9);
    doc.setFontSize(11);
    doc.text(fmtRs(data?.grandTotal || grandTotal), pageWidth - 20, gtY + 9, { align: "right" });

    const sigY = gtY + 22;
    doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3); doc.setLineDash([2, 2]);
    doc.line(14, sigY, pageWidth - 14, sigY); doc.setLineDash([]);
    [
      { label: "HOD, MCA Dept.",       role: "Prepared By",  x: pageWidth * 0.18 },
      { label: "Accounts Section",     role: "Verified By",  x: pageWidth * 0.50 },
      { label: "Principal / Director", role: "Approved By",  x: pageWidth * 0.82 },
    ].forEach(({ label, role, x }) => {
      doc.setDrawColor(100, 100, 100); doc.setLineWidth(0.4);
      doc.line(x - 24, sigY + 14, x + 24, sigY + 14);
      doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...navy);
      doc.text(label, x, sigY + 18.5, { align: "center" });
      doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
      doc.text(role, x, sigY + 23.5, { align: "center" });
    });

    doc.setFillColor(...navy);
    doc.rect(0, pageHeight - 12, pageWidth, 12, "F");
    doc.setFontSize(7); doc.setTextColor(200, 210, 230); doc.setFont("helvetica", "normal");
    doc.text("This document is auto-generated. For queries, contact the MCA Department.", 14, pageHeight - 5);
    doc.text("Page 1 of 1", pageWidth - 14, pageHeight - 5, { align: "right" });
    doc.save("MCA_Chargesheet.pdf");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700&family=Crimson+Pro:wght@400;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #f3f4f8; color: #111827; -webkit-font-smoothing: antialiased; }

        /* ── SHELL ─────────────────────────────── */
        .shell { display: flex; min-height: 100vh; }
        .shell.sb-collapsed .sidebar { width: 68px; min-width: 68px; }
        .shell.sb-collapsed .sb-brand,
        .shell.sb-collapsed .sb-section-label,
        .shell.sb-collapsed .sb-item-label,
        .shell.sb-collapsed .sb-item-dot,
        .shell.sb-collapsed .sb-user-info,
        .shell.sb-collapsed .sb-role-banner { display: none; }
        .shell.sb-collapsed .sb-item { justify-content: center; padding: 9px; }
        .shell.sb-collapsed .sb-item-icon { margin: 0; }

        /* ── SIDEBAR ───────────────────────────── */
        .sidebar {
          width: 230px; min-width: 230px;
          background: #1a2744;
          display: flex; flex-direction: column;
          position: relative; overflow: hidden;
          transition: width .2s ease, min-width .2s ease;
        }
        .sidebar::after {
          content: ''; position: absolute;
          bottom: -80px; right: -80px;
          width: 200px; height: 200px; border-radius: 50%;
          background: rgba(65,88,200,0.1); pointer-events: none;
        }

        /* Logo */
        .sb-header {
          padding: 18px 16px 15px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          position: relative; display: flex; align-items: center;
        }
        .sb-logo { display: flex; align-items: center; gap: 11px; }
        .sb-logo-box {
          width: 36px; height: 36px; background: #fff;
          border-radius: 8px; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0; overflow: hidden; padding: 3px;
        }
        .sb-logo-box img { width: 100%; height: 100%; object-fit: contain; }
        .sb-brand h3 {
          font-family: 'Crimson Pro', serif;
          font-size: 14.5px; color: #fff; font-weight: 600; line-height: 1.2;
        }
        .sb-brand p {
          font-size: 9.5px; color: rgba(255,255,255,0.38);
          text-transform: uppercase; letter-spacing: 0.6px; margin-top: 2px;
        }

        /* Toggle */
        .sb-toggle {
          position: absolute; right: -13px; top: 20px; z-index: 50;
          width: 26px; height: 26px;
          background: #243058; border: 1px solid rgba(148,163,184,0.25);
          border-radius: 50%; color: rgba(255,255,255,0.6);
          cursor: pointer; font-size: 11px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .sb-toggle:hover { background: #2e3d6e; }

        /* Role banner */
        .sb-role-banner {
          margin: 10px 12px 0;
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.18);
          border-radius: 8px; padding: 7px 11px;
          display: flex; align-items: center; gap: 7px;
        }
        .sb-role-banner-dot { width: 5px; height: 5px; border-radius: 50%; background: #10b981; flex-shrink: 0; }
        .sb-role-banner span { font-size: 10.5px; color: #6ee7b7; line-height: 1.4; }

        /* Nav */
        .sb-nav { padding: 6px 10px 0; flex: 1; overflow-y: auto; }
        .sb-section-label {
          font-size: 9px; font-weight: 600; letter-spacing: 0.9px;
          text-transform: uppercase; color: rgba(255,255,255,0.26);
          padding: 14px 8px 5px;
        }
        .sb-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 4px 10px; }
        .sb-item {
          display: flex; align-items: center; gap: 9px;
          padding: 8px 10px; border-radius: 7px;
          font-size: 12.5px; font-weight: 500;
          color: rgba(255,255,255,0.48); cursor: pointer;
          transition: all 0.12s ease; margin-bottom: 1px;
        }
        .sb-item:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); }
        .sb-item.active { background: rgba(65,88,200,0.2); color: #a5b4fc; font-weight: 600; }
        .sb-item-icon { font-size: 14px; flex-shrink: 0; opacity: 0.75; }
        .sb-item.active .sb-item-icon { opacity: 1; }
        .sb-item-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: currentColor; flex-shrink: 0; opacity: 0.6;
        }
        .sb-item.active .sb-item-dot { background: #6366f1; opacity: 1; }
        .sb-item.accounts-item { color: rgba(110,231,183,0.65); }
        .sb-item.accounts-item:hover { background: rgba(16,185,129,0.08); color: #6ee7b7; }

        /* User footer */
        .sb-footer { padding: 10px 10px 14px; margin-top: auto; }
        .sb-user-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 9px; padding: 10px 11px;
          display: flex; align-items: center; gap: 9px;
        }
        .sb-avatar {
          width: 30px; height: 30px; border-radius: 7px;
          background: #4158c8; display: flex; align-items: center;
          justify-content: center; font-size: 10.5px; font-weight: 700;
          color: #fff; flex-shrink: 0; letter-spacing: 0.3px;
        }
        .sb-user-name {
          font-size: 11.5px; font-weight: 600; color: rgba(255,255,255,0.88);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sb-user-role {
          font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px;
        }
        .role-admin    { color: #fbbf24; }
        .role-hod      { color: #6ee7b7; }
        .role-accounts { color: #34d399; }
        .role-default  { color: rgba(255,255,255,0.36); }

        /* ── MAIN ──────────────────────────────── */
        .main { flex: 1; display: flex; flex-direction: column; min-width: 0; background: #f3f4f8; }

        /* Topbar */
        .topbar {
          background: #fff; border-bottom: 1px solid #e5e7eb;
          padding: 0 26px; height: 62px;
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .topbar-dept { font-size: 10px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: #4158c8; margin-bottom: 2px; }
        .topbar-title { font-family: 'Crimson Pro', serif; font-size: 20px; color: #111827; font-weight: 600; line-height: 1; }
        .topbar-right { display: flex; align-items: center; gap: 8px; }

        .tb-btn {
          padding: 7px 13px; border-radius: 7px;
          border: 1px solid #e5e7eb;
          font-size: 12px; font-weight: 600; cursor: pointer;
          font-family: 'Inter', sans-serif;
          background: #fff; color: #374151;
          display: flex; align-items: center; gap: 5px;
          transition: background 0.12s, border-color 0.12s;
          white-space: nowrap;
        }
        .tb-btn:hover { background: #f9fafb; border-color: #d1d5db; }
        .tb-btn.primary { background: #1a2744; color: #fff; border-color: #1a2744; }
        .tb-btn.primary:hover { background: #243058; }
        .tb-btn svg { width: 13px; height: 13px; flex-shrink: 0; }

        .tb-select {
          padding: 7px 28px 7px 10px; border-radius: 7px;
          border: 1px solid #e5e7eb;
          font-size: 12px; font-family: 'Inter', sans-serif;
          color: #374151; background: #fff; cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%239ca3af' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 8px center;
        }

        .tb-user-pill {
          display: flex; align-items: center; gap: 8px;
          background: #f9fafb; border: 1px solid #e5e7eb;
          border-radius: 999px; padding: 5px 12px 5px 5px;
          cursor: pointer; transition: background 0.12s;
        }
        .tb-user-pill:hover { background: #f1f5f9; }
        .tb-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: #4158c8; display: flex; align-items: center;
          justify-content: center; font-size: 10px; font-weight: 700;
          color: #fff; flex-shrink: 0;
        }
        .tb-user-name { font-size: 12px; font-weight: 600; color: #111827; }
        .tb-role-badge {
          font-size: 9px; font-weight: 700; letter-spacing: 0.4px;
          padding: 2px 7px; border-radius: 20px; text-transform: uppercase;
        }
        .badge-admin    { background: #fef3c7; color: #78350f; }
        .badge-hod      { background: #d1fae5; color: #064e3b; }
        .badge-accounts { background: #d1fae5; color: #064e3b; }
        .badge-default  { background: #e0e7ff; color: #3730a3; }

        /* ── BODY ──────────────────────────────── */
        .body { padding: 22px 26px; display: flex; flex-direction: column; gap: 16px; }

        /* State boxes */
        .state-box { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; gap: 12px; }
        .spinner { width: 32px; height: 32px; border-radius: 50%; border: 2.5px solid #e5e7eb; border-top-color: #4158c8; animation: spin 0.65s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .state-msg { font-size: 13.5px; color: #6b7280; }
        .retry-btn { padding: 7px 18px; border-radius: 7px; background: #4158c8; color: #fff; border: none; font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; }

        /* Read-only banner */
        .readonly-banner {
          background: #f0fdf9; border: 1px solid #a7f3d0;
          border-radius: 9px; padding: 11px 16px;
          display: flex; align-items: center; gap: 10px;
        }
        .readonly-banner-icon { font-size: 13px; color: #059669; }
        .readonly-banner p { font-size: 12.5px; color: #065f46; margin: 0; }
        .readonly-banner strong { font-weight: 600; }

        /* KPI grid */
        .kpi-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 13px; }
        .kpi-card {
          background: #fff; border: 1px solid #e5e7eb; border-radius: 11px;
          padding: 17px 18px; position: relative; overflow: hidden;
          opacity: 0; transform: translateY(14px);
          animation: fadeUp 0.4s ease forwards;
        }
        .kpi-card:nth-child(1) { animation-delay: 0.04s; }
        .kpi-card:nth-child(2) { animation-delay: 0.1s; }
        .kpi-card:nth-child(3) { animation-delay: 0.16s; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
        .kpi-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 11px 11px 0 0; }
        .kpi-card.teaching::before   { background: #6366f1; }
        .kpi-card.nonteaching::before { background: #0f766e; }
        .kpi-card.grand::before       { background: #b8860b; }
        .kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 13px; }
        .kpi-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; }
        .kpi-icon.teaching    { background: #eef2ff; color: #6366f1; }
        .kpi-icon.nonteaching { background: #f0fdf9; color: #0f766e; }
        .kpi-icon.grand       { background: #fdf8ec; color: #b8860b; }
        .kpi-badge { font-size: 9.5px; font-weight: 600; padding: 3px 8px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.3px; }
        .kpi-badge.teaching    { background: #eef2ff; color: #4338ca; }
        .kpi-badge.nonteaching { background: #f0fdf9; color: #0f766e; }
        .kpi-badge.grand       { background: #fdf8ec; color: #b8860b; }
        .kpi-amount { font-family: 'Crimson Pro', serif; font-size: 27px; font-weight: 600; color: #111827; letter-spacing: -0.3px; line-height: 1; }
        .kpi-label  { font-size: 11px; color: #9ca3af; margin-top: 3px; }
        .kpi-bar  { height: 3px; border-radius: 2px; background: #f3f4f6; margin-top: 14px; overflow: hidden; }
        .kpi-fill { height: 100%; border-radius: 2px; transition: width 1s ease; }
        .kpi-fill.teaching    { background: #6366f1; }
        .kpi-fill.nonteaching { background: #0f766e; }
        .kpi-fill.grand       { background: #b8860b; }

        /* Stats band */
        .stats-band {
          background: #fff; border: 1px solid #e5e7eb; border-radius: 11px;
          display: flex; overflow: hidden;
          opacity: 0; animation: fadeUp 0.4s ease 0.22s forwards;
        }
        .stat-block { flex: 1; padding: 14px 16px; border-right: 1px solid #f3f4f6; }
        .stat-block:last-child { border-right: none; }
        .stat-label { font-size: 9.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.55px; color: #9ca3af; margin-bottom: 4px; }
        .stat-val { font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.3px; }
        .stat-sub { font-size: 10.5px; color: #9ca3af; margin-top: 1px; }

        /* Chargesheet card */
        .cs-card {
          background: #fff; border: 1px solid #e5e7eb; border-radius: 11px; overflow: hidden;
          opacity: 0; animation: fadeUp 0.4s ease 0.3s forwards;
        }
        .cs-card-head {
          padding: 13px 18px; border-bottom: 1px solid #f3f4f6;
          display: flex; align-items: center; justify-content: space-between;
        }
        .cs-card-title { font-size: 13px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 7px; }
        .cs-title-dot { width: 7px; height: 7px; border-radius: 50%; background: #6366f1; }
        .cs-month-label { font-size: 11px; color: #9ca3af; }

        .cs-row {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 18px; border-bottom: 1px solid #f9fafb;
          transition: background 0.1s;
        }
        .cs-row:last-child { border-bottom: none; }
        .cs-row:hover { background: #fafbff; }
        .cs-name-col { min-width: 155px; }
        .cs-name { font-size: 13px; font-weight: 600; color: #111827; }
        .cs-desg { font-size: 10.5px; color: #9ca3af; margin-top: 1px; }
        .cs-prog-col { flex: 1; }
        .cs-count { font-size: 10px; color: #9ca3af; margin-bottom: 4px; }
        .prog-track { height: 4px; background: #f3f4f6; border-radius: 3px; overflow: hidden; }
        .prog-fill  { height: 100%; border-radius: 3px; transition: width 0.8s ease; }
        .cs-meta { text-align: right; min-width: 108px; }
        .cs-amt  { font-size: 13px; font-weight: 600; color: #111827; margin-bottom: 4px; }
        .status-chip { display: inline-block; font-size: 9.5px; font-weight: 600; padding: 2px 8px; border-radius: 20px; letter-spacing: 0.2px; }
        .chip-green { background: #ecfdf5; color: #065f46; }
        .chip-amber { background: #fffbeb; color: #78350f; }
        .chip-blue  { background: #eff6ff; color: #1e40af; }
        .cs-actions { display: flex; gap: 5px; }
        .cs-btn {
          border: none; border-radius: 6px; padding: 5px 9px;
          font-size: 10.5px; font-weight: 600; cursor: pointer;
          font-family: 'Inter', sans-serif; transition: opacity 0.1s;
        }
        .cs-btn:hover { opacity: 0.8; }
        .cs-btn-edit   { background: #eef2ff; color: #3730a3; }
        .cs-btn-delete { background: #fef2f2; color: #b91c1c; }
        .cs-empty { padding: 30px 18px; text-align: center; font-size: 12.5px; color: #9ca3af; }

        /* Edit Modal */
        .modal-backdrop {
          position: fixed; inset: 0; background: rgba(15,23,42,0.45);
          z-index: 300; display: flex; align-items: center; justify-content: center; padding: 18px;
        }
        .modal {
          width: min(700px, 100%); max-height: 92vh; overflow-y: auto;
          background: #fff; border-radius: 12px; border: 1px solid #e5e7eb;
          box-shadow: 0 20px 60px rgba(15,23,42,0.22);
        }
        .modal-head {
          padding: 16px 18px; border-bottom: 1px solid #f3f4f6;
          display: flex; align-items: center; justify-content: space-between;
        }
        .modal-title { font-size: 14.5px; font-weight: 700; color: #111827; }
        .modal-sub { font-size: 12px; color: #9ca3af; margin-top: 2px; }
        .modal-body { padding: 18px; }
        .modal-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 13px; }
        .modal-field { display: flex; flex-direction: column; gap: 5px; }
        .modal-field label {
          font-size: 9.5px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.6px; color: #6b7280;
        }
        .modal-field input,
        .modal-field select {
          border: 1.5px solid #e5e7eb; border-radius: 8px;
          padding: 9px 11px; font-size: 13px; font-family: 'Inter', sans-serif;
          color: #111827; outline: none; transition: border-color 0.15s;
        }
        .modal-field input:focus,
        .modal-field select:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .modal-total {
          margin-top: 15px; background: #f9fafb; border: 1px solid #e5e7eb;
          border-radius: 10px; padding: 13px 16px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .modal-total-label { font-size: 10.5px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
        .modal-total-value { font-family: 'Crimson Pro', serif; font-size: 24px; font-weight: 600; color: #111827; }
        .modal-actions {
          padding: 13px 18px; border-top: 1px solid #f3f4f6;
          display: flex; justify-content: flex-end; gap: 9px;
        }
        .modal-cancel,
        .modal-save {
          border: none; border-radius: 8px; padding: 9px 16px;
          font-size: 12.5px; font-weight: 600; cursor: pointer;
          font-family: 'Inter', sans-serif;
        }
        .modal-cancel { background: #f3f4f6; color: #374151; }
        .modal-save   { background: #1a2744; color: #fff; }
        .modal-save:disabled { opacity: 0.6; cursor: wait; }
      `}</style>

      <div className={`shell ${sidebarCollapsed ? "sb-collapsed" : ""}`}>
        {/* ── SIDEBAR ───────────────────────── */}
        <div className="sidebar">
          <div className="sb-header">
            <div className="sb-logo">
              <div className="sb-logo-box">
                <img src="/vjtiLogo.png" alt="VJTI" />
              </div>
              <div className="sb-brand">
                <h3>VJTI — MCA Dept.</h3>
                <p>Chargesheet Portal</p>
              </div>
            </div>
            <button className="sb-toggle" onClick={toggleSidebar} title={sidebarCollapsed ? "Expand" : "Collapse"}>
              {sidebarCollapsed ? "›" : "‹"}
            </button>
          </div>

          {userRole === "ACCOUNTS" && (
            <div className="sb-role-banner">
              <div className="sb-role-banner-dot" />
              <span>View-only — Accounts</span>
            </div>
          )}

          <div className="sb-nav">
            {NAV_GROUPS.map((group) => {
              if (group.roles && !isVisible(group.roles)) return null;
              const visibleItems = group.items.filter((item) => isVisible(item.roles));
              if (visibleItems.length === 0) return null;
              return (
                <React.Fragment key={group.label}>
                  <div className="sb-section-label">{group.label}</div>
                  {visibleItems.map((item) => {
                    const isAccountsOnly = item.roles?.length === 1 && item.roles[0] === "ACCOUNTS";
                    return (
                      <div
                        key={item.label}
                        className={`sb-item ${isAccountsOnly ? "accounts-item" : ""}`}
                        onClick={() => item.path && navigate(item.path)}
                      >
                        {item.icon
                          ? <i className={`ti ${item.icon} sb-item-icon`} aria-hidden="true" />
                          : <span className="sb-item-dot" />}
                        <span className="sb-item-label">{item.label}</span>
                      </div>
                    );
                  })}
                  <div className="sb-divider" />
                </React.Fragment>
              );
            })}
          </div>

          {user && (
            <div className="sb-footer">
              <div className="sb-user-card">
                <div className="sb-avatar">{userInitials(user?.user?.name)}</div>
                <div className="sb-user-info">
                  <div className="sb-user-name">{user?.user?.name || "User"}</div>
                  <div className={`sb-user-role ${
                    userRole === "ADMIN" ? "role-admin"
                    : userRole === "HOD" ? "role-hod"
                    : userRole === "ACCOUNTS" ? "role-accounts"
                    : "role-default"
                  }`}>
                    {userRole}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── MAIN ──────────────────────────── */}
        <div className="main">
          {/* Topbar */}
          <div className="topbar">
            <div>
              <div className="topbar-dept">Veermata Jijabai Technological Institute</div>
              <div className="topbar-title">Dashboard</div>
            </div>
            <div className="topbar-right">
              {(userRole === "ACCOUNTS" || userRole === "HOD" || userRole === "ADMIN") && (
                <button className="tb-btn primary" onClick={generateChargesheetPDF}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                  Download Chargesheet
                </button>
              )}
              {(userRole === "ACCOUNTS" || userRole === "HOD" || userRole === "ADMIN") && (
                <button className="tb-btn" onClick={generateExamWorkbook}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
                  </svg>
                  Exam Sheets
                </button>
              )}
              <select
                className="tb-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {EXAM_MONTHS.map((m) => <option key={m}>{m}</option>)}
              </select>
              {user && (
                <div className="tb-user-pill" onClick={handleLogout} title="Click to logout">
                  <div className="tb-avatar">{userInitials(user?.user?.name)}</div>
                  <div>
                    <div className="tb-user-name">{user?.user?.name || "User"}</div>
                  </div>
                  <span className={`tb-role-badge ${
                    userRole === "ADMIN" ? "badge-admin"
                    : userRole === "HOD" ? "badge-hod"
                    : userRole === "ACCOUNTS" ? "badge-accounts"
                    : "badge-default"
                  }`}>{userRole}</span>
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="body">
            {userRole === "ACCOUNTS" && (
              <div className="readonly-banner">
                <span className="readonly-banner-icon">🔒</span>
                <p>
                  <strong>Read-only view.</strong> You can review cost summaries and download
                  the chargesheet. Entry management is restricted to HOD / Admin.
                </p>
              </div>
            )}

            {loading && (
              <div className="state-box">
                <div className="spinner" />
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
                      <div className="kpi-icon teaching">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                      </div>
                      <span className="kpi-badge teaching">Teaching</span>
                    </div>
                    <div className="kpi-amount">₹ {fmt(data.teachingTotal)}</div>
                    <div className="kpi-label">Teaching staff total</div>
                    <div className="kpi-bar">
                      <div className="kpi-fill teaching" style={{ width: data.grandTotal ? `${Math.round((data.teachingTotal / data.grandTotal) * 100)}%` : "0%" }} />
                    </div>
                  </div>

                  <div className="kpi-card nonteaching">
                    <div className="kpi-top">
                      <div className="kpi-icon nonteaching">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                        </svg>
                      </div>
                      <span className="kpi-badge nonteaching">Non-Teaching</span>
                    </div>
                    <div className="kpi-amount">₹ {fmt(data.nonTeachingTotal)}</div>
                    <div className="kpi-label">Non-teaching staff total</div>
                    <div className="kpi-bar">
                      <div className="kpi-fill nonteaching" style={{ width: data.grandTotal ? `${Math.round((data.nonTeachingTotal / data.grandTotal) * 100)}%` : "0%" }} />
                    </div>
                  </div>

                  <div className="kpi-card grand">
                    <div className="kpi-top">
                      <div className="kpi-icon grand">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                      </div>
                      <span className="kpi-badge grand">Grand Total</span>
                    </div>
                    <div className="kpi-amount">₹ {fmt(data.grandTotal)}</div>
                    <div className="kpi-label">Combined exam sheet total</div>
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
                    <div className="stat-sub">Selected month</div>
                  </div>
                </div>

                {/* Chargesheet table */}
                <div className="cs-card">
                  <div className="cs-card-head">
                    <div className="cs-card-title">
                      <span className="cs-title-dot" />
                      MCA Department — Exam Sheet Status
                    </div>
                    <span className="cs-month-label">{monthLabel}</span>
                  </div>

                  {data.chargesheets && data.chargesheets.length > 0 ? (
                    data.chargesheets.map((cs) => {
                      const { prog, chip, color } = statusMeta(cs.status);
                      return (
                        <div className="cs-row" key={cs._id}>
                          <div className="cs-name-col">
                            <div className="cs-name">{cs.staffName}</div>
                            <div className="cs-desg">{cs.designation}</div>
                          </div>
                          <div className="cs-prog-col">
                            <div className="cs-count">{cs.taskCount} task{cs.taskCount !== 1 ? "s" : ""} assigned</div>
                            <div className="prog-track">
                              <div className="prog-fill" style={{ width: `${prog}%`, background: color }} />
                            </div>
                          </div>
                          <div className="cs-meta">
                            <div className="cs-amt">₹ {fmt(cs.total)}</div>
                            <span className={`status-chip ${chip}`}>{cs.status}</span>
                          </div>
                          {canManageEntries && (
                            <div className="cs-actions">
                              <button className="cs-btn cs-btn-edit" onClick={() => startEditEntry(cs)}>Edit</button>
                              <button className="cs-btn cs-btn-delete" onClick={() => deleteEntry(cs)}>Delete</button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="cs-empty">
                      {chargesheets.length > 0 ? (
                        chargesheets.map((c) => (
                          <div
                            key={c._id}
                            style={{
                              display: "flex", justifyContent: "space-between",
                              alignItems: "center", padding: "12px 18px",
                              borderBottom: "1px solid #f9fafb", textAlign: "left",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{c.staffName}</span>
                              <span style={{ fontSize: 12, color: "#6b7280" }}>₹ {fmt(c.total)}</span>
                              <span className={`status-chip ${c.status === "Submitted" ? "chip-green" : "chip-blue"}`}>
                                {c.status}
                              </span>
                            </div>
                            {canManageEntries && (
                              <div className="cs-actions">
                                <button className="cs-btn cs-btn-edit" onClick={() => startEditEntry(c)}>Edit</button>
                                <button className="cs-btn cs-btn-delete" onClick={() => deleteEntry(c)}>Delete</button>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: "30px 18px", textAlign: "center", fontSize: 12.5, color: "#9ca3af" }}>
                          No chargesheets found for this month.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Edit Modal */}
                {editingEntry && editForm && (
                  <div className="modal-backdrop">
                    <div className="modal">
                      <div className="modal-head">
                        <div>
                          <div className="modal-title">Modify Entry</div>
                          <div className="modal-sub">
                            {editingEntry.staffName} — {editingEntry.examLabel || selectedMonth}
                          </div>
                        </div>
                        <button
                          className="cs-btn cs-btn-delete"
                          onClick={() => { setEditingEntry(null); setEditForm(null); }}
                        >
                          Close
                        </button>
                      </div>
                      <div className="modal-body">
                        <div className="modal-grid">
                          <div className="modal-field">
                            <label>Course Code</label>
                            <input value={editForm.courseCode} onChange={(e) => updateEditField("courseCode", e.target.value)} placeholder="Course code" />
                          </div>
                          <div className="modal-field">
                            <label>Course Title</label>
                            <input value={editForm.courseTitle} onChange={(e) => updateEditField("courseTitle", e.target.value)} placeholder="Course title" />
                          </div>
                          <div className="modal-field">
                            <label>Paper Sets</label>
                            <input type="number" min="0" value={editForm.paperSets} onChange={(e) => updateEditField("paperSets", e.target.value)} />
                          </div>
                          <div className="modal-field">
                            <label>Paper Set Rate</label>
                            <input type="number" min="0" value={editForm.paperSetRate} onChange={(e) => updateEditField("paperSetRate", e.target.value)} />
                          </div>
                          <div className="modal-field">
                            <label>Assessments</label>
                            <input type="number" min="0" value={editForm.assessments} onChange={(e) => updateEditField("assessments", e.target.value)} />
                          </div>
                          <div className="modal-field">
                            <label>Assessment Rate</label>
                            <input type="number" min="0" value={editForm.assessmentRate} onChange={(e) => updateEditField("assessmentRate", e.target.value)} />
                          </div>
                          <div className="modal-field">
                            <label>Exam Conduction</label>
                            <input type="number" min="0" value={editForm.examConduction} onChange={(e) => updateEditField("examConduction", e.target.value)} />
                          </div>
                          <div className="modal-field">
                            <label>Invigilation / Reliever</label>
                            <input type="number" min="0" value={editForm.invigilation} onChange={(e) => updateEditField("invigilation", e.target.value)} />
                          </div>
                          <div className="modal-field">
                            <label>Status</label>
                            <select value={editForm.status} onChange={(e) => updateEditField("status", e.target.value)}>
                              <option>Pending</option>
                              <option>In Review</option>
                              <option>Submitted</option>
                            </select>
                          </div>
                        </div>
                        <div className="modal-total">
                          <span className="modal-total-label">Updated Total</span>
                          <span className="modal-total-value">Rs. {fmt(editTotal())}</span>
                        </div>
                      </div>
                      <div className="modal-actions">
                        <button className="modal-cancel" onClick={() => { setEditingEntry(null); setEditForm(null); }}>Cancel</button>
                        <button className="modal-save" onClick={saveEditedEntry} disabled={entrySaving}>
                          {entrySaving ? "Saving…" : "Save Changes"}
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