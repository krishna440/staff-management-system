const mongoose = require("mongoose");

const chargesheetSchema = new mongoose.Schema({
  month: {
    type: String,
    required: true,
  },

  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
  },

  staffName: String,
  designation: String,
  staffDesignation: String,
  dateOfJoining: Date,

  academicYear: String,
  semester: String,
  examType: String,
  examMonth: String,
  examPeriod: String,
  examStartDate: String,
  examEndDate: String,
  labExamPeriod: String,
  labExamStartDate: String,
  labExamEndDate: String,
  examLabel: String,

  courseCode: String,
  courseTitle: String,

  paperSets: Number,
  paperSetRate: Number,
  assessments: Number,
  assessmentRate: Number,
  examConduction: Number,
  invigilation: Number,
  dutyRole: String,
  dutyDates: String,
  dutyDays: Number,
  dutyRate: Number,
  dutyAmount: Number,
  relieverAssignments: [
    {
      date: String,
      rooms: [String],
    },
  ],
  relieverSessionCount: Number,
  payableDutyDays: Number,

  total: Number,
  status: {
    type: String,
    default: "Pending",
  },
  rate: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Chargesheet", chargesheetSchema);
