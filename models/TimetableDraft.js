const mongoose = require("mongoose");

const timetableDraftSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    theoryRows: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    labRows: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    labSlots: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TimetableDraft", timetableDraftSchema);
