const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  department: String,
  designation: String,
  type: String,
  empId: String,
  photo: String,
}, { timestamps: true });

module.exports = mongoose.model("Staff", staffSchema);
