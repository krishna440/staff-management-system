const Assignment = require("../models/Assignment");
const Task = require("../models/Task");

// ✅ Assign Task
exports.assignTask = async (req, res) => {
  try {
    const { staffId, taskId, quantity } = req.body;

    if (!staffId || !taskId || !quantity) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const totalAmount = task.rate * quantity;

    const assignment = new Assignment({
      staffId,
      taskId,
      quantity,
      totalAmount
    });

    await assignment.save();

    res.json(assignment);

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get Assignments
exports.getAssignments = async (req, res) => {
  try {
    const data = await Assignment.find()
      .populate("staffId")
      .populate("taskId");

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};