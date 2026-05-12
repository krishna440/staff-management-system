const Staff = require("../models/staff"); // ⚠️ Capital S (important)

// ✅ Add Staff
exports.addStaff = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const {
      name,
      phone,
      email,
      department,
      designation,
      type,
      empId
    } = req.body;

    // Validation
    if (!name || !phone || !department || !designation || !type || !empId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const staff = new Staff({
      name,
      phone,
      email,
      department,
      designation,
      type,
      empId,
      photo: req.file ? req.file.filename : ""
    });

    await staff.save();

    res.status(201).json({
      message: "Staff added successfully",
      data: staff
    });

  } catch (error) {
    console.log("ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get Staff
exports.getStaff = async (req, res) => {
  try {
    const data = await Staff.find();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update Staff
exports.updateStaff = async (req, res) => {
  try {
    const updated = await Staff.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Staff member not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Delete Staff
exports.deleteStaff = async (req, res) => {
  try {
    const deleted = await Staff.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Staff member not found" });
    }
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
