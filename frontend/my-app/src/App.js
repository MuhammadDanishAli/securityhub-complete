import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import './SecuritySystem.css';

// Import other components
import Home from './Home';
import LoginPage from './LoginPage';
import ManageUsers from './ManageUsers';
import SecuritySettings from './securitysettings';
import HelpSupport from './HelpSupport';
import SuperUser from './SuperUser';
import Systemlog from './Systemlog';
import Sdata from './Sdata';

// The "Security System" component
function SecuritySystem() {
  const [mode, setMode] = useState("Disarm");
  const [sensors, setSensors] = useState({
    pir: { enabled: false, connected: true, value: 0 },
    vibration: { enabled: false, connected: true, value: 0 },
    dht: { enabled: false, connected: true, temperature: 0, humidity: 0 },
  });
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    console.log("SecuritySystem component mounted");
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        console.log("Fetching sensor status...");
        const response = await fetch("http://localhost:8000/api/sensor-status/");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Sensor status fetched:", data);
        const newSensors = { ...sensors };
        const newNotifications = [...notifications];
        Object.keys(data).forEach((sensor) => {
          const wasConnected = newSensors[sensor].connected;
          newSensors[sensor].connected = data[sensor].connected;
          if (wasConnected && !newSensors[sensor].connected) {
            newNotifications.push(
              `${sensor.toUpperCase()} disconnected at ${new Date().toLocaleTimeString()}`
            );
          }
          newSensors[sensor] = { ...newSensors[sensor], ...data[sensor] };
        });
        setSensors(newSensors);
        setNotifications(newNotifications);
      } catch (error) {
        console.error("Error fetching sensor status:", error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [notifications, sensors]);

  const handleModeChange = async (newMode) => {
    try {
      console.log(`Changing mode to ${newMode}`);
      const response = await fetch("http://localhost:8000/api/mode/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: newMode }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Mode change response:", data);
      if (data.status === "Mode set") {
        setMode(newMode);
      }
    } catch (error) {
      console.error("Error setting mode:", error);
    }
  };

  const handleSensorToggle = async (sensor, state) => {
    try {
      console.log(`Toggling ${sensor} to ${state}`);
      const response = await fetch("http://localhost:8000/api/sensor/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sensor, state }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Sensor toggle response:", data);
      if (data.status === `${sensor} set to ${state}`) {
        setSensors((prevSensors) => ({
          ...prevSensors,
          [sensor]: { ...prevSensors[sensor], enabled: state === "on" },
        }));
      }
    } catch (error) {
      console.error("Error toggling sensor:", error);
    }
  };

  return (
    <div className="security-system-container">
      <h1>Security System</h1>
      <div className="mode-section">
        <h2>System Mode: {mode}</h2>
        <button onClick={() => handleModeChange("Stay")}>Stay</button>
        <button onClick={() => handleModeChange("Away")}>Away</button>
        <button onClick={() => handleModeChange("Disarm")}>Disarm</button>
      </div>
      <div className="sensors-section">
        <h2>Sensors</h2>
        <div className="sensor-item">
          <h3>PIR Sensor</h3>
          <p>Connected: {sensors.pir.connected ? "Yes" : "No"}</p>
          <p>Enabled: {sensors.pir.enabled ? "Yes" : "No"}</p>
          <p>Value: {sensors.pir.value}</p>
          <button onClick={() => handleSensorToggle("pir", sensors.pir.enabled ? "off" : "on")}>
            {sensors.pir.enabled ? "Disable" : "Enable"}
          </button>
        </div>
        <div className="sensor-item">
          <h3>Vibration Sensor</h3>
          <p>Connected: {sensors.vibration.connected ? "Yes" : "No"}</p>
          <p>Enabled: {sensors.vibration.enabled ? "Yes" : "No"}</p>
          <p>Value: {sensors.vibration.value}</p>
          <button onClick={() => handleSensorToggle("vibration", sensors.vibration.enabled ? "off" : "on")}>
            {sensors.vibration.enabled ? "Disable" : "Enable"}
          </button>
        </div>
        <div className="sensor-item">
          <h3>DHT Sensor</h3>
          <p>Connected: {sensors.dht.connected ? "Yes" : "No"}</p>
          <p>Enabled: {sensors.dht.enabled ? "Yes" : "No"}</p>
          <p>Temperature: {sensors.dht.temperature} °C</p>
          <p>Humidity: {sensors.dht.humidity} %</p>
          <button onClick={() => handleSensorToggle("dht", sensors.dht.enabled ? "off" : "on")}>
            {sensors.dht.enabled ? "Disable" : "Enable"}
          </button>
        </div>
      </div>
      <div className="notifications-section">
        <h2>Notifications</h2>
        <ul className="logs-list">
          {notifications.map((notification, index) => (
            <li key={index} className="log-item">{notification}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div>
        {/* Navigation Links */}
        <nav className="nav-bar">
          <Link to="/home/1">Home (Ali)</Link>
          <Link to="/home/2">Home (Ahmed)</Link>
          <Link to="/home/3">Home (Sara)</Link>
          <Link to="/security-system">Security System</Link>
          <Link to="/login">Login</Link>
          <Link to="/manage-users">Manage Users</Link>
          <Link to="/security-settings">Security Settings</Link>
          <Link to="/help-support">Help & Support</Link>
          <Link to="/superuser">Superuser</Link>
          <Link to="/system-logs">System Logs</Link>
        </nav>

        {/* Content Container */}
        <div className="content-container">
          <Routes>
            <Route path="/home/:clientId" element={<Home />} />
            <Route path="/security-system" element={<SecuritySystem />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/manage-users" element={<ManageUsers />} />
            <Route path="/security-settings" element={<SecuritySettings />} />
            <Route path="/help-support" element={<HelpSupport />} />
            <Route path="/superuser" element={<SuperUser />} />
            <Route path="/system-logs" element={<Systemlog />} />
            <Route path="/Sdata/:siteId" element={<Sdata />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;