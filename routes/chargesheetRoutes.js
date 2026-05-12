const express = require("express");
const router = express.Router();
const Chargesheet = require("../models/chargesheet");

function assessmentAmountForEntry(entry) {
  const assessments = Number(entry.assessments) || 0;
  const amount = assessments * (Number(entry.assessmentRate) || 0);
  if (assessments > 0 && entry.examType === "Re-ESE") {
    return Math.max(amount, 200);
  }
  return amount;
}

function paperSettingAmountForEntry(entry) {
  if (entry.examType === "Re-ESE") {
    return 0;
  }
  return (Number(entry.paperSets) || 0) * (Number(entry.paperSetRate) || 0);
}

function totalAmountForEntry(entry) {
  return (
    paperSettingAmountForEntry(entry) +
    assessmentAmountForEntry(entry) +
    (Number(entry.examConduction) || 0) +
    (Number(entry.invigilation) || 0) +
    (Number(entry.dutyDays) || 0) * (Number(entry.dutyRate) || 0)
  );
}

router.post("/", async (req, res) => {
  try {
    const data = req.body;
    const dutyAmount = (Number(data.dutyDays) || 0) * (Number(data.dutyRate) || 0);
    const total = totalAmountForEntry(data);

    const newEntry = new Chargesheet({
      ...data,
      dutyAmount,
      total,
      status: "Pending",
    });

    await newEntry.save();
    res.json({ message: "Saved successfully" });
  } catch (err) {
    console.log("SAVE ERROR:", err);
    res.status(500).json({ message: "Error saving" });
  }
});

router.get("/", async (req, res) => {
  try {
    const query = req.query.month ? { month: req.query.month } : {};
    const data = await Chargesheet.find(query).sort({ _id: -1 });
    res.json(data.map((entry) => ({ ...entry.toObject(), total: totalAmountForEntry(entry) })));
  } catch (err) {
    res.status(500).json({ message: "Error fetching chargesheets" });
  }
});

router.put("/status/:id", async (req, res) => {
  try {
    const { status, rate } = req.body;

    const updated = await Chargesheet.findByIdAndUpdate(
      req.params.id,
      {
        status,
        ...(rate && { rate }),
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.log("STATUS UPDATE ERROR:", err);
    res.status(500).json({ message: "Error updating status" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const existing = await Chargesheet.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Chargesheet entry not found" });
    }

    const updates = { ...req.body };
    [
      "paperSets",
      "paperSetRate",
      "assessments",
      "assessmentRate",
      "examConduction",
      "invigilation",
      "dutyDays",
      "dutyRate",
    ].forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        updates[field] = Number(updates[field]) || 0;
      }
    });

    Object.assign(existing, updates);
    existing.total = totalAmountForEntry(existing);
    existing.dutyAmount = (Number(existing.dutyDays) || 0) * (Number(existing.dutyRate) || 0);

    await existing.save();
    res.json(existing);
  } catch (err) {
    console.log("CHARGESHEET UPDATE ERROR:", err);
    res.status(500).json({ message: "Error updating chargesheet entry" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Chargesheet.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Chargesheet entry not found" });
    }

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.log("CHARGESHEET DELETE ERROR:", err);
    res.status(500).json({ message: "Error deleting chargesheet entry" });
  }
});

module.exports = router;
