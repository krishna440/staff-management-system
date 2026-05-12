const Task = require("../models/Task");

// ✅ Add Task
exports.addTask = async (req, res) => {
  try {
    const { name, rate, type } = req.body;

    if (!name || !rate || !type) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const task = new Task({
      name,
      rate,
      type
    });

    await task.save();

    res.status(201).json({
      message: "Task added successfully",
      data: task
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get All Tasks
exports.getTasks = async (req, res) => {
  try {
    const data = await Task.find();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Delete Task (optional)
exports.deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};