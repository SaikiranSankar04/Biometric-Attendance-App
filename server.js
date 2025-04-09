const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

const uri = process.env.MONGODB_URI;


mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Define schema and model
const attendanceSchema = new mongoose.Schema({
  fingerprint_id: String,
  timestamp: String,
  status: String,
});
const Attendance = mongoose.model("Attendance", attendanceSchema);

// Middleware
app.use(cors());
app.use(express.json());

// API Route: GET all attendance records
app.get("/attendance", async (req, res) => {
  try {
    const data = await Attendance.find().sort({ timestamp: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
