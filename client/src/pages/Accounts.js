import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addVjtiLogoToPdf } from "../utils/logo";

const API = "https://staff-management-system-eluv.onrender.com/api";

const Accounts = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/chargesheet`);
      setData(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const downloadPDF = async (entry) => {
    const doc = new jsPDF();
    await addVjtiLogoToPdf(doc, { x: 14, y: 7, width: 20, height: 20 });
    doc.setFontSize(14);
    doc.text("Chargesheet Report", 40, 15);

    autoTable(doc, {
      head: [["Field", "Value"]],
      body: [
        ["Staff Name", entry.staffName || ""],
        ["Designation", entry.designation || ""],
        ["Exam", [entry.academicYear, entry.semester, entry.examType].filter(Boolean).join(" ")],
        ["Month", entry.month || ""],
        ["Status", entry.status || "Pending"],
        ["Total", `Rs. ${Number(entry.total || 0).toLocaleString("en-IN")}`],
      ],
      startY: 32,
    });

    doc.save(`${entry.staffName || "chargesheet"}_report.pdf`);
  };

  return (
    <div style={{ padding: 28, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#3b82f6", textTransform: "uppercase", letterSpacing: ".08em" }}>
          Accounts Section
        </div>
        <h1 style={{ margin: "4px 0 0", fontSize: 26, color: "#0f172a" }}>Chargesheet Review</h1>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between" }}>
          <strong>All Chargesheet Entries</strong>
          <button onClick={fetchEntries} style={buttonStyle}>Refresh</button>
        </div>

        {loading ? (
          <div style={emptyStyle}>Loading entries...</div>
        ) : data.length === 0 ? (
          <div style={emptyStyle}>No chargesheet entries found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", color: "#475569" }}>
                  <th style={th}>Staff Name</th>
                  <th style={th}>Exam</th>
                  <th style={th}>Month</th>
                  <th style={th}>Status</th>
                  <th style={{ ...th, textAlign: "right" }}>Total</th>
                  <th style={{ ...th, textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry) => (
                  <tr key={entry._id} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={td}>{entry.staffName}</td>
                    <td style={td}>{[entry.academicYear, entry.semester, entry.examType].filter(Boolean).join(" ")}</td>
                    <td style={td}>{entry.month}</td>
                    <td style={td}>{entry.status || "Pending"}</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 800 }}>Rs. {Number(entry.total || 0).toLocaleString("en-IN")}</td>
                    <td style={{ ...td, textAlign: "right" }}>
                      <button onClick={() => downloadPDF(entry)} style={buttonStyle}>Download PDF</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const th = { padding: "12px 14px", textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em" };
const td = { padding: "13px 14px", color: "#0f172a" };
const emptyStyle = { padding: 32, textAlign: "center", color: "#64748b", fontSize: 14 };
const buttonStyle = {
  border: "none",
  borderRadius: 8,
  padding: "8px 12px",
  background: "#3C3489",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

export default Accounts;
