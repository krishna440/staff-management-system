const express = require("express");
const router = express.Router();
const Chargesheet = require("../models/chargesheet");

router.post("/", async (req, res) => {
  try {
    const data = req.body;
    const dutyAmount = (Number(data.dutyDays) || 0) * (Number(data.dutyRate) || 0);
    const total =
      (Number(data.paperSets) || 0) * (Number(data.paperSetRate) || 0) +
      (Number(data.assessments) || 0) * (Number(data.assessmentRate) || 0) +
      (Number(data.examConduction) || 0) +
      (Number(data.invigilation) || 0) +
      dutyAmount;

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
    res.json(data);
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
    existing.total =
      (Number(existing.paperSets) || 0) * (Number(existing.paperSetRate) || 0) +
      (Number(existing.assessments) || 0) * (Number(existing.assessmentRate) || 0) +
      (Number(existing.examConduction) || 0) +
      (Number(existing.invigilation) || 0) +
      (Number(existing.dutyDays) || 0) * (Number(existing.dutyRate) || 0);
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
