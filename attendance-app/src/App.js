/*
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
      if (res.status === 200) setFlaskAvailable(true);
    } catch (error) {
      setFlaskAvailable(false);
      console.warn("Flask not available");
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await axios.get("http://localhost:5000/attendance");
      const data = res.data;

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
  
    if (type === "present") {
      const todaysRecords = data.filter((d) => d.timestamp.startsWith(today));
      setFilteredData(
        todaysRecords.map((item) => ({
          ...item,
          status: "Present",
        }))
      );
      setPresentCount(todaysRecords.length);
  
      // Optional: calculate absent count as maxId - present count
      const maxId = Math.max(...data.map((d) => parseInt(d.fingerprint_id)));
      setAbsentCount(maxId - todaysRecords.length);
    } 
    
    else if (type === "absent") {
      const allIds = [...new Set(data.map((d) => parseInt(d.fingerprint_id)))];
      const todayIds = [
        ...new Set(
          data
            .filter((d) => d.timestamp.startsWith(today))
            .map((d) => parseInt(d.fingerprint_id))
        ),
      ];
      const absentIds = allIds.filter((id) => !todayIds.includes(id));
  
      setFilteredData(
        absentIds.map((id) => ({
          fingerprint_id: id,
          timestamp: today,
          status: "Absent",
        }))
      );
  
      setAbsentCount(absentIds.length);
      setPresentCount(todayIds.length); // total marked today
    } 
    
    else {
      const today = new Date().toISOString().split("T")[0];
    
      const todaysRecords = data.filter((d) => d.timestamp.startsWith(today));
      const todayIds = [...new Set(todaysRecords.map((d) => parseInt(d.fingerprint_id)))];
    
      const allIds = [...new Set(data.map((d) => parseInt(d.fingerprint_id)))];
      const maxId = Math.max(...allIds);
      const absentCount = maxId - todayIds.length;
    
      setFilteredData(
        data.map((item) => ({
          ...item,
          status: "Present",
        }))
      );
    
      setPresentCount(todayIds.length);
      setAbsentCount(absentCount);
    }
    
    setFilterType(type);
  };
    const handleRegister = async () => {
    setRegistering(true);
    setMessage("Sending register request...");

    try {
      const res = await axios.post("http://127.0.0.1:5001/register");
      if (res.data && res.data.status === "success") {
        setMessage("Register command sent. Waiting for fingerprint...");
        pollRegisterStatus();
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
            fetchAttendance();
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

  const handleDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");

    const today = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `Attendance_${filterType}_${today}.xlsx`);
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Attendance Dashboard</h1>
        {flaskAvailable && (
          <div className="register-area">
            <button
              onClick={handleRegister}
              disabled={registering}
              className="register-button"
            >
              {registering ? "Registering..." : "Register New User"}
            </button>
            {message && <p className="message">{message}</p>}
          </div>
        )}
      </div>

      <div className="summary">
        <p><strong>Today's Present:</strong> {presentCount}</p>
        <p><strong>Today's Absent:</strong> {absentCount}</p>
      </div>

      <div className="filter-buttons">
        <button onClick={() => filterAttendance(attendance, "all")} className={filterType === "all" ? "active" : ""}>All</button>
        <button onClick={() => filterAttendance(attendance, "present")} className={filterType === "present" ? "active" : ""}>Present Today</button>
        <button onClick={() => filterAttendance(attendance, "absent")} className={filterType === "absent" ? "active" : ""}>Absent Today</button>
      </div>

      <div className="download-section">
        <button onClick={handleDownload} className="download-button">Download Excel</button>
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
                <td className={item.status === "Present" ? "present" : item.status === "Absent" ? "absent" : "past"}>
                  {item.status}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="no-data">No attendance data available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;
*/

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
      const flaskUrl = process.env.REACT_APP_FLASK_URL; // Flask URL from env
      const res = await axios.get(`${flaskUrl}/ping`);
      if (res.status === 200) setFlaskAvailable(true);
    } catch (error) {
      setFlaskAvailable(false);
      console.warn("Flask not available");
    }
  };

  const fetchAttendance = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL; // Backend URL from env
      const res = await axios.get(`${backendUrl}/attendance`);
      const data = res.data;

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

    if (type === "present") {
      const todaysRecords = data.filter((d) => d.timestamp.startsWith(today));
      setFilteredData(
        todaysRecords.map((item) => ({
          ...item,
          status: "Present",
        }))
      );
      setPresentCount(todaysRecords.length);

      const maxId = Math.max(...data.map((d) => parseInt(d.fingerprint_id)));
      setAbsentCount(maxId - todaysRecords.length);
    }

    else if (type === "absent") {
      const allIds = [...new Set(data.map((d) => parseInt(d.fingerprint_id)))];
      const todayIds = [
        ...new Set(
          data
            .filter((d) => d.timestamp.startsWith(today))
            .map((d) => parseInt(d.fingerprint_id))
        ),
      ];
      const absentIds = allIds.filter((id) => !todayIds.includes(id));

      setFilteredData(
        absentIds.map((id) => ({
          fingerprint_id: id,
          timestamp: today,
          status: "Absent",
        }))
      );

      setAbsentCount(absentIds.length);
      setPresentCount(todayIds.length);
    }

    else {
      const today = new Date().toISOString().split("T")[0];

      const todaysRecords = data.filter((d) => d.timestamp.startsWith(today));
      const todayIds = [...new Set(todaysRecords.map((d) => parseInt(d.fingerprint_id)))];

      const allIds = [...new Set(data.map((d) => parseInt(d.fingerprint_id)))];
      const maxId = Math.max(...allIds);
      const absentCount = maxId - todayIds.length;

      setFilteredData(
        data.map((item) => ({
          ...item,
          status: "Present",
        }))
      );

      setPresentCount(todayIds.length);
      setAbsentCount(absentCount);
    }

    setFilterType(type);
  };

  const handleRegister = async () => {
    setRegistering(true);
    setMessage("Sending register request...");

    try {
      const flaskUrl = process.env.REACT_APP_FLASK_URL; // Flask URL from env
      const res = await axios.post(`${flaskUrl}/register`);
      if (res.data && res.data.status === "success") {
        setMessage("Register command sent. Waiting for fingerprint...");
        pollRegisterStatus();
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

  const pollRegisterStatus = () => {
    const interval = setInterval(async () => {
      try {
        const flaskUrl = process.env.REACT_APP_FLASK_URL; // Flask URL from env
        const res = await axios.get(`${flaskUrl}/register-status`);
        if (res.data.status) {
          setMessage(res.data.status);

          if (
            res.data.status.includes("successfully") ||
            res.data.status.includes("failed") ||
            res.data.status === "Idle"
          ) {
            clearInterval(interval);
            setRegistering(false);
            fetchAttendance();
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

  const handleDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");

    const today = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `Attendance_${filterType}_${today}.xlsx`);
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Attendance Dashboard</h1>
        {flaskAvailable && (
          <div className="register-area">
            <button
              onClick={handleRegister}
              disabled={registering}
              className="register-button"
            >
              {registering ? "Registering..." : "Register New User"}
            </button>
            {message && <p className="message">{message}</p>}
          </div>
        )}
      </div>

      <div className="summary">
        <p><strong>Today's Present:</strong> {presentCount}</p>
        <p><strong>Today's Absent:</strong> {absentCount}</p>
      </div>

      <div className="filter-buttons">
        <button onClick={() => filterAttendance(attendance, "all")} className={filterType === "all" ? "active" : ""}>All</button>
        <button onClick={() => filterAttendance(attendance, "present")} className={filterType === "present" ? "active" : ""}>Present Today</button>
        <button onClick={() => filterAttendance(attendance, "absent")} className={filterType === "absent" ? "active" : ""}>Absent Today</button>
      </div>

      <div className="download-section">
        <button onClick={handleDownload} className="download-button">Download Excel</button>
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
                <td className={item.status === "Present" ? "present" : item.status === "Absent" ? "absent" : "past"}>
                  {item.status}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="no-data">No attendance data available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;
