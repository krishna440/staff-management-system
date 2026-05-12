const express = require("express");
const router = express.Router();

const {
  assignTask,
  getAssignments
} = require("../controllers/assignmentController");

router.post("/", assignTask);
router.get("/", getAssignments);

module.exports = router;