const mongoose = require("mongoose");

const monthStatusSchema = new mongoose.Schema({
  month: String,

  status: {
    type: String,
    default: "Pending", // Pending → Approved_by_HOD → Sent_to_Accounts
  },

  approvedBy: String,
  approvedAt: Date,
});

module.exports = mongoose.model("MonthStatus", monthStatusSchema);