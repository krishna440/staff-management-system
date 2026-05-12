const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  department: String,
  designation: String,
  type: String,
  empId: String,
  photo: String
}, { timestamps: true });

// ✅ VERY IMPORTANT
module.exports = mongoose.model("Staff", staffSchema);
