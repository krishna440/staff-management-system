const express = require("express");
const router = express.Router();

const Staff = require("../models/staff"); // check name EXACT
const upload = require("../config/multer");
const {
  addStaff,
  getStaff,
  updateStaff,
  deleteStaff
} = require("../controllers/staffController");

router.get("/", async (req, res) => {
  try {
    const staff = await Staff.find();
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: "Error fetching staff" });
  }
});

// ✅ IMPORTANT (multer here)
router.post("/", upload.single("photo"), addStaff);

router.get("/", getStaff);
router.put("/:id", updateStaff);
router.delete("/:id", deleteStaff);

module.exports = router;