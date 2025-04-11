import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import * as XLSX from "xlsx";


function App() {
  const [attendance, setAttendance] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState("");
  const [flaskAvailable, setFlaskAvailable] = useState(false);
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);

  useEffect(() => {
    fetchAttendance();
    checkFlaskStatus();
  }, []);
  const checkFlaskStatus = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:5001/ping");
      if (res.status === 200) {
        setFlaskAvailable(true);
      }
    } catch (error) {
      setFlaskAvailable(false);
      console.warn("Flask not available");
    }
  };
  
  const fetchAttendance = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/attendance`);
      const data = response.data;

      if (Array.isArray(data)) {
        setAttendance(data);
        filterAttendance(data, "all");
      } else {
        console.error("Received data is not an array:", data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const filterAttendance = (data, type) => {
    const today = new Date().toISOString().split("T")[0];
    let filtered = [];

    if (type === "present") {
      filtered = data.filter((item) => item.timestamp.startsWith(today));
    } else if (type === "absent") {
      // Generate absent list by finding IDs not marked today
      const todayAttendees = data
        .filter((item) => item.timestamp.startsWith(today))
        .map((item) => parseInt(item.fingerprint_id));
      const maxId = Math.max(...todayAttendees, 0);
      const allIds = Array.from({ length: maxId }, (_, i) => i + 1);
      const absentIds = allIds.filter((id) => !todayAttendees.includes(id));

      filtered = absentIds.map((id) => ({
        fingerprint_id: id,
        timestamp: today,
        status: "Absent",
      }));
    } else {
      filtered = data;
    }

    setFilteredData(filtered);
    setFilterType(type);

    if (type === "present") {
      setPresentCount(filtered.length);
    } else if (type === "absent") {
      setAbsentCount(filtered.length);
    } else {
      const todayData = data.filter((item) => item.timestamp.startsWith(today));
      const idsToday = todayData.map((item) => parseInt(item.fingerprint_id));
      const maxId = Math.max(...idsToday, 0);
      const allIds = Array.from({ length: maxId }, (_, i) => i + 1);
      const absents = allIds.filter((id) => !idsToday.includes(id));
      setPresentCount(idsToday.length);
      setAbsentCount(absents.length);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    setMessage("Sending register request...");

    try {
      const res = await axios.post("http://127.0.0.1:5001/register");
      if (res.data && res.data.status === "success") {
        setMessage("Register command sent. Waiting for fingerprint...");
        pollRegisterStatus(); // Begin polling for live status
      } else {
        setMessage("Failed to send registration command.");
        setRegistering(false);
      }
    } catch (err) {
      console.error("Registration request error:", err);
      setMessage("Error communicating with server.");
      setRegistering(false);
    }
  };
  const handleDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
  
    const today = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `Attendance_${filterType}_${today}.xlsx`);
  };
  
  const pollRegisterStatus = () => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get("http://127.0.0.1:5001/register-status");
        if (res.data.status) {
          setMessage(res.data.status);

          if (
            res.data.status.includes("successfully") ||
            res.data.status.includes("failed") ||
            res.data.status === "Idle"
          ) {
            clearInterval(interval);
            setRegistering(false);
            fetchAttendance(); // Refresh attendance data
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
        setMessage("Lost connection to backend.");
        clearInterval(interval);
        setRegistering(false);
      }
    }, 1000);
   
  };
  return (
    <div className="container">
      <div className="header">
        <h1>Attendance Dashboard</h1>
        {flaskAvailable && (
  <div style={{ textAlign: "right" }}>
    <button
      onClick={handleRegister}
      disabled={registering}
      className="register-button"
    >
      {registering ? "Registering..." : "Register New User"}
    </button>
    {message && (
      <p className="message" style={{ marginTop: "8px" }}>
        {message}
      </p>
    )}
  </div>
)}
      </div>
  
      <div className="summary">
        <p><strong>Today's Present:</strong> {presentCount}</p>
        <p><strong>Today's Absent:</strong> {absentCount}</p>
      </div>
  
      <div className="filter-buttons">
        <button
          onClick={() => filterAttendance(attendance, "all")}
          className={filterType === "all" ? "active" : ""}
        >
          All
        </button>
        <button
          onClick={() => filterAttendance(attendance, "present")}
          className={filterType === "present" ? "active" : ""}
        >
          Today's Present
        </button>
        <button
          onClick={() => filterAttendance(attendance, "absent")}
          className={filterType === "absent" ? "active" : ""}
        >
          Absentees
        </button>
      </div>
  
      <div style={{ textAlign: "right", marginBottom: "10px" }}>
        <button onClick={handleDownload} className="download-button">
          Download Excel
        </button>
      </div>
  
      <table>
        <thead>
          <tr>
            <th>Fingerprint ID</th>
            <th>Timestamp</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.length > 0 ? (
            filteredData.map((item, index) => (
              <tr key={index}>
                <td>{item.fingerprint_id}</td>
                <td>{item.timestamp}</td>
                <td
                  className={item.status === "Present" ? "present" : "absent"}
                >
                  {item.status}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="no-data">
                No attendance data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}    
export default App;
