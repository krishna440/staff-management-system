const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const chargesheetRoutes = require("./routes/chargesheetRoutes");
const staffRoutes = require("./routes/staffRoutes");
const monthRoutes = require("./routes/monthRoutes");



const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static folder for images
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/staff", require("./routes/staffRoutes"));
app.use("/api/staff", staffRoutes);

app.use("/api/task", require("./routes/taskRoutes"));

app.use("/api/assign", require("./routes/assignmentRoutes"));

app.use("/api/report", require("./routes/reportRoutes"));

app.use("/api/auth", authRoutes);
app.use("/api/chargesheet", chargesheetRoutes); 
app.use("/api/month", monthRoutes);
// Connect DB
connectDB();

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
