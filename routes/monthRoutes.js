const express = require("express");
const router = express.Router();
const MonthStatus = require("../models/monthStatus");
const Chargesheet = require("../models/chargesheet");

router.post("/approve", async (req, res) => {
  const { month, approvedBy } = req.body;

  let record = await MonthStatus.findOne({ month });

  if (!record) {
    record = new MonthStatus({ month });
  }

  record.status = "Approved_by_HOD";
  record.approvedBy = approvedBy;
  record.approvedAt = new Date();

  await record.save();
  await Chargesheet.updateMany(
    { month, status: "Pending" },
    { status: "Approved_by_HOD" }
  );

  res.json({ message: "Month approved" });
});

module.exports = router;
