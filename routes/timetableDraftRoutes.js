const express = require("express");
const mongoose = require("mongoose");
const TimetableDraft = require("../models/TimetableDraft");

const router = express.Router();

function normalizeUserId(value) {
  const id = String(value || "").trim();
  return mongoose.Types.ObjectId.isValid(id) ? id : "";
}

function toClientDraft(draft) {
  const item = draft.toObject();
  return {
    id: item._id,
    _id: item._id,
    name: item.name,
    updatedAt: item.updatedAt,
    createdAt: item.createdAt,
    settings: item.settings || {},
    theoryRows: item.theoryRows || [],
    labRows: item.labRows || [],
    labSlots: item.labSlots || [],
  };
}

router.get("/", async (req, res) => {
  try {
    const userId = normalizeUserId(req.query.userId);
    if (!userId) return res.status(400).json({ message: "Valid userId is required" });

    const drafts = await TimetableDraft.find({ userId }).sort({ updatedAt: -1 });
    res.json(drafts.map(toClientDraft));
  } catch (err) {
    console.log("TIMETABLE DRAFT FETCH ERROR:", err);
    res.status(500).json({ message: "Error fetching timetable drafts" });
  }
});

router.post("/", async (req, res) => {
  try {
    const userId = normalizeUserId(req.body.userId);
    if (!userId) return res.status(400).json({ message: "Valid userId is required" });

    const draft = await TimetableDraft.create({
      userId,
      userEmail: req.body.userEmail,
      name: req.body.name || "Untitled timetable",
      settings: req.body.settings || {},
      theoryRows: Array.isArray(req.body.theoryRows) ? req.body.theoryRows : [],
      labRows: Array.isArray(req.body.labRows) ? req.body.labRows : [],
      labSlots: Array.isArray(req.body.labSlots) ? req.body.labSlots : [],
    });

    res.status(201).json(toClientDraft(draft));
  } catch (err) {
    console.log("TIMETABLE DRAFT SAVE ERROR:", err);
    res.status(500).json({ message: "Error saving timetable draft" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const userId = normalizeUserId(req.body.userId);
    if (!userId) return res.status(400).json({ message: "Valid userId is required" });

    const draft = await TimetableDraft.findOneAndUpdate(
      { _id: req.params.id, userId },
      {
        name: req.body.name || "Untitled timetable",
        settings: req.body.settings || {},
        theoryRows: Array.isArray(req.body.theoryRows) ? req.body.theoryRows : [],
        labRows: Array.isArray(req.body.labRows) ? req.body.labRows : [],
        labSlots: Array.isArray(req.body.labSlots) ? req.body.labSlots : [],
      },
      { new: true, runValidators: true }
    );

    if (!draft) return res.status(404).json({ message: "Timetable draft not found" });
    res.json(toClientDraft(draft));
  } catch (err) {
    console.log("TIMETABLE DRAFT UPDATE ERROR:", err);
    res.status(500).json({ message: "Error updating timetable draft" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = normalizeUserId(req.query.userId);
    if (!userId) return res.status(400).json({ message: "Valid userId is required" });

    const deleted = await TimetableDraft.findOneAndDelete({ _id: req.params.id, userId });
    if (!deleted) return res.status(404).json({ message: "Timetable draft not found" });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.log("TIMETABLE DRAFT DELETE ERROR:", err);
    res.status(500).json({ message: "Error deleting timetable draft" });
  }
});

module.exports = router;
