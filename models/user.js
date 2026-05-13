const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: String,
  role: {
    type: String,
    enum: ["admin", "hod", "exam_committee"],
    default: "hod",
  },
  mustChangePassword: {
    type: Boolean,
    default: true,
  },
  passwordResetOtpHash: String,
  passwordResetOtpExpiresAt: Date,
  passwordResetOtpVerified: {
    type: Boolean,
    default: false,
  },
  passwordChangedAt: Date,
});

module.exports = mongoose.model("User", userSchema);
