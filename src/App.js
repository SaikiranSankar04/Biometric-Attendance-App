import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css"; // Import CSS for styling

function App() {
  const [attendance, setAttendance] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await axios.get("http://localhost:5000/attendance");
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

    fetchAttendance();
  }, []);

  // Function to filter attendance based on selection
  const filterAttendance = (data, type) => {
    const today = new Date().toISOString().split("T")[0]; // Get today's date in "YYYY-MM-DD"
    let filtered = [];

    if (type === "present") {
      filtered = data.filter((item) => item.timestamp.startsWith(today));
    } else if (type === "absent") {
      filtered = []; // Placeholder: Implement absent logic based on a fixed user list
    } else {
      filtered = data;
    }

    setFilteredData(filtered);
    setFilterType(type);
  };

  return (
    <div className="container">
      <h1>Attendance Dashboard</h1>

      <div className="filter-buttons">
        <button onClick={() => filterAttendance(attendance, "all")} className={filterType === "all" ? "active" : ""}>
          All
        </button>
        <button onClick={() => filterAttendance(attendance, "present")} className={filterType === "present" ? "active" : ""}>
          Today's Present
        </button>
        <button onClick={() => filterAttendance(attendance, "absent")} className={filterType === "absent" ? "active" : ""}>
          Absentees
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
                <td className={item.status === "Present" ? "present" : "absent"}>{item.status}</td>
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
