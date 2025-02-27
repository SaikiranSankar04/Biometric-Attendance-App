const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// 🔗 Connect to MongoDB (fingerprint_db > attendance)
mongoose.connect('mongodb://localhost:27017/fingerprint_db', {})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// 🛠 Define Attendance Schema (Collection: `attendance`)
const attendanceSchema = new mongoose.Schema({
  fingerprint_id: { type: String, required: true },  
  timestamp: { type: String, required: true },  
  status: { type: String, required: true },  
});

// ⚠️ Explicitly set the collection name as "attendance"  
const Attendance = mongoose.model('Attendance', attendanceSchema, 'attendance'); 

// 📡 GET Route - Fetch Attendance Data
app.get('/attendance', async (req, res) => {
  try {
    console.log('📡 Fetching attendance data...');
    const attendanceData = await Attendance.find();
    
    if (attendanceData.length > 0) {
      console.log('✅ Attendance data:', attendanceData);
      res.json(attendanceData);
    } else {
      console.warn('⚠️ No attendance data available');
      res.status(404).json({ message: "⚠️ No attendance data available" });
    }
  } catch (error) {
    console.error('❌ Error in /attendance route:', error);
    res.status(500).json({ message: "❌ Error fetching data", error: error.toString() });
  }
});

// 📥 POST Route - Insert Attendance Data
app.post('/attendance', async (req, res) => {
  console.log('📥 Received attendance data:', req.body);
  try {
    const newAttendance = new Attendance({
      fingerprint_id: req.body.fingerprint_id,  
      timestamp: req.body.timestamp,  
      status: req.body.status,
    });

    const savedAttendance = await newAttendance.save();
    console.log('✅ Attendance recorded successfully:', savedAttendance);
    res.status(200).json({ message: '✅ Attendance recorded successfully!', data: savedAttendance });
  } catch (error) {
    console.error('❌ Error recording attendance:', error);
    res.status(500).json({ message: '❌ Failed to record attendance', error: error.toString() });
  }
});

// 🚀 Start Server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
