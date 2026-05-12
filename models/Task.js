const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  rate: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ["Teaching", "Non-Teaching"],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);