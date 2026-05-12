import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addVjtiLogoToPdf } from "../utils/logo";
const Accounts = () => {
  const [data, setData] = useState([]);
  

const downloadPDF = async (c) => {
  const doc = new jsPDF();
  await addVjtiLogoToPdf(doc, { x: 14, y: 7, width: 20, height: 20 });

  doc.setFontSize(14);
  doc.text("Chargesheet Report", 40, 15);

  autoTable(doc, {
    head: [["Field", "Value"]],
    body: [
      ["Staff Name", c.staffName],
      ["Designation", c.designation],
      ["Total", `₹ ${c.total}`],
      ["Month", c.month],
      ["Status", c.status],
    ],
    startY: 32,
  });

  doc.save(`${c.staffName}_report.pdf`);
};

  const fetchApproved = async () => {
  const res = await axios.get("https://staff-management-system-eluv.onrender.com/api/chargesheet");

  const filtered = res.data.filter(
    (c) => c.status === "Approved_by_HOD"
  );

  setData(filtered);
};

  useEffect(() => {
    fetchApproved();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Accounts Section</h2>

      {data.length === 0 ? (
        <p>No approved reports</p>
      ) : (
        <table border="1" width="100%">
          <thead>
            <tr>
              <th>Staff Name</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
  {data.map((c) => (
    <tr key={c._id}>
      <td>{c.staffName}</td>

      <td>
        <input
          type="number"
          placeholder="Rate"
          onChange={(e) => {
            c.rate = e.target.value;
          }}
        />
      </td>

      <td>{c.total}</td>

      <td>
        <button
          onClick={async () => {
            await axios.put(
              `https://staff-management-system-eluv.onrender.com/api/chargesheet/status/${c._id}`,
              {
                status: "Final_Approved",
                rate: c.rate || 0,
              }
            );
            alert("Final Approved ✅");
          }}
          style={{
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            padding: "6px 12px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Final Approve
        </button>
        <td>
  <button onClick={() => downloadPDF(c)}>
    Download PDF
  </button>
</td>
      </td>
    </tr>
  ))}
</tbody>

        </table>
      )}
      
    </div>
  );
};

export default Accounts;
