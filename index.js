const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

// Initialize App
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", () => console.log("Connected to MongoDB"));
const ADMIN_EMAIL=process.env.ADMIN_EMAIL
// Define Schemas
const jobSchema = new mongoose.Schema({
  positionTitle: { type: String, required: true },
  employmentType: { type: String, required: true },
  requiredLanguages: { type: [String], required: true },
  description: { type: String, required: true },
  requirements: { type: String, required: true },
});

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Models
const Job = mongoose.model("Job", jobSchema);
const Admin = mongoose.model("Admin", adminSchema);

// Routes
// Admin Routes
app.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (admin.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({ message: "Login successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Password Route
app.put("/admin/update-password", async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  try {
    if (email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (admin.password !== currentPassword) {
      return res.status(401).json({ message: "Invalid current password" });
    }

    admin.password = newPassword;
    await admin.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Job Routes
app.post("/jobs", async (req, res) => {
  try {
    const newJob = new Job(req.body);
    const savedJob = await newJob.save();
    res.status(201).json(savedJob);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get("/jobs", async (req, res) => {
  try {
    const jobs = await Job.find();
    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete("/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedJob = await Job.findByIdAndDelete(id);
    if (!deletedJob) return res.status(404).json({ message: "Job not found" });
    res.status(200).json({ message: "Job deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Keep-Alive Function
const keepAlive = async () => {
  try {
    await Job.findOne(); // Simple query to keep the database active
    console.log("Keep-alive query executed");
  } catch (err) {
    console.error("Error during keep-alive query:", err.message);
  }
};
// Run keep-alive every week
setInterval(keepAlive, 7 * 24 * 60 * 60 * 1000); // 7 days
// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
