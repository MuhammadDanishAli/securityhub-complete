import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./systemlog.css";

function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedLogs = JSON.parse(localStorage.getItem("systemLogs")) || [];
    setLogs(storedLogs);
  }, []);

  return (
    <div className="system-logs-container">
      <h1>📜 System Logs</h1>
      <button className="back-btn" onClick={() => navigate(-1)}>Back</button>

      {logs.length > 0 ? (
        <ul className="logs-list">
          {logs.map((log, index) => (
            <li key={index} className="log-item">
              <span className="timestamp">[{log.timestamp}]</span> {log.message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-logs">No logs recorded yet.</p>
      )}
    </div>
  );
}

export default SystemLogs;
