import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import './Sdata.css';
import HouseMap from './R (1).png';
import { FaCog, FaExclamationTriangle, FaList, FaTimes } from 'react-icons/fa';

const homeData = {
  1: { alerts: ["🔥 FIRE ALERT"], doorOpenTime: "12:30 PM", entryLogs: ["John entered at 9:00 AM"] },
  2: { alerts: ["🚪 DOOR OPEN"], doorOpenTime: "1:15 PM", entryLogs: ["Alice entered at 11:00 AM"] },
  3: { alerts: [], doorOpenTime: null, entryLogs: ["Bob entered at 3:00 PM"] },
  4: { alerts: ["🔥 FIRE ALERT", "🚪 DOOR OPEN"], doorOpenTime: "4:45 PM", entryLogs: [] }
};

const cctvVideos = [
  "https://www.youtube.com/embed/2GmULjAlaJY",
  "https://www.youtube.com/embed/5qap5aO4i9A",
  "https://www.youtube.com/embed/jfKfPfyJRdk",
  "https://www.youtube.com/embed/RtU_mdL2vBM",
  "https://www.youtube.com/embed/qzMQza8xZCc"
];

function Sdata() {
  const { homeId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const address = queryParams.get("address") || "Unknown Address";
  const homeInfo = homeData[parseInt(homeId)] || { alerts: [], doorOpenTime: null, entryLogs: [] };

  const [isArmed, setIsArmed] = useState(() => JSON.parse(localStorage.getItem(`armed-${homeId}`)) || false);
  const [stayAwayMode, setStayAwayMode] = useState(() => JSON.parse(localStorage.getItem(`stayMode-${homeId}`)) || false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fireSensor, setFireSensor] = useState(() => JSON.parse(localStorage.getItem("fireSensor")) || true);
  const [thiefSensor, setThiefSensor] = useState(() => JSON.parse(localStorage.getItem("thiefSensor")) || true);
  const [doorSensor, setDoorSensor] = useState(() => JSON.parse(localStorage.getItem("doorSensor")) || true);
  const addToSystemLogs = (message) => {
    const timestamp = new Date().toLocaleString();
    const newLog = { timestamp, message };
  
    const storedLogs = JSON.parse(localStorage.getItem("systemLogs")) || [];
    storedLogs.unshift(newLog); // Add newest log to the top
    localStorage.setItem("systemLogs", JSON.stringify(storedLogs));
  };
  
  useEffect(() => {
    localStorage.setItem(`armed-${homeId}`, JSON.stringify(isArmed));
    localStorage.setItem(`stayMode-${homeId}`, JSON.stringify(stayAwayMode));
    localStorage.setItem("fireSensor", JSON.stringify(fireSensor));
    localStorage.setItem("thiefSensor", JSON.stringify(thiefSensor));
    localStorage.setItem("doorSensor", JSON.stringify(doorSensor));
  }, [homeId, isArmed, stayAwayMode, fireSensor, thiefSensor, doorSensor]);

  const handleToggleArmed = () => {
    setIsArmed(prevState => {
      const newState = !prevState;
      localStorage.setItem(`armed-${homeId}`, JSON.stringify(newState));
      return newState;
    });
  };

  const handleToggleStay = () => {
    setStayAwayMode(prevState => {
      const newState = !prevState;
      localStorage.setItem(`stayMode-${homeId}`, JSON.stringify(newState));
      return newState;
    });
  };
  const [alert, setAlert] = useState("fire"); // Default alert type

  const getAlertMessage = () => {
    switch (alert) {
      case "fire":
        return { text: "🔥 Fire Detected! Take Action Immediately!", color: "red" };
      case "thief":
        return { text: "🚨 Intruder Alert! Security Breach!", color: "orange" };
      case "door":
        return { text: "🚪 Unauthorized Door Access Detected!", color: "blue" };
      default:
        return null;
    }
  };
  
  const alertData = getAlertMessage();
  
  const selectedVideo = cctvVideos[homeId] || "https://www.youtube.com/embed/dQw4w9WgXcQ";
  const hasFireAlert = homeInfo.alerts.some(alert => alert.includes("🔥 FIRE ALERT"));
  const hasDoorOpenAlert = homeInfo.alerts.some(alert => alert.includes("🚪 DOOR OPEN"));

  return (
    <div className="sdata-container">

      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <button className="close-btn" onClick={() => setSidebarOpen(false)}><FaTimes /></button>
        <h2>Sensor Settings</h2>
        <ul>
          <li>Fire Sensor 🔥 <input type="checkbox" checked={fireSensor} onChange={() => setFireSensor(!fireSensor)} /></li>
          <li>Thief Sensor 🚨 <input type="checkbox" checked={thiefSensor} onChange={() => setThiefSensor(!thiefSensor)} /></li>
          <li>Door Sensor 🚪 <input type="checkbox" checked={doorSensor} onChange={() => setDoorSensor(!doorSensor)} /></li>
        </ul>
      </div>

      <button className="settings-btn" onClick={() => setSidebarOpen(true)}><FaList /></button>

      <h1 className="title">Security System</h1>
      <p className="address">📍 {address}</p>

      <button className={`Button ${isArmed ? 'armed' : 'disarmed'}`} onClick={handleToggleArmed}>
        {isArmed ? "🔒 DISARM" : "🔓 ARM"}
      </button>
      <button className={`Button stay-away ${stayAwayMode ? 'stay' : 'away'}`} onClick={handleToggleStay}>
        {stayAwayMode ? "🛑 Stay" : "🚨 Away"}
      </button>

      {homeInfo.alerts.length > 0 && (
        <div className="alert-section">
          <h2>⚠️ Active Alerts</h2>
          {homeInfo.alerts.map((alert, index) => <p key={index} className="alert-item">{alert}</p>)}
        </div>
      )}

      <nav className="navigation">
        <p className="sensor">🏠 Home {homeId}</p>
        <p className={`sensor ${hasFireAlert && fireSensor ? 'alert-active' : ''}`}>Fire Sensor: {fireSensor ? (hasFireAlert ? "🔥 ACTIVE!" : "✅ Safe") : "❌ Disabled"}</p>
        <p className={`sensor ${isArmed && thiefSensor ? '' : 'sensor-off'}`}>Thief Sensor: {thiefSensor ? (isArmed ? "🚨 Armed" : "❌ Disabled") : "❌ Off"}</p>
        <p className={`sensor ${hasDoorOpenAlert && doorSensor ? 'alert-active' : ''}`}>Door Open: {doorSensor ? (hasDoorOpenAlert ? `🚪 Open since ${homeInfo.doorOpenTime}` : "🔒 Closed") : "❌ Disabled"}</p>
      </nav>

      <div className="entry-log">
        <h2>🔑 Entry Logs</h2>
        {homeInfo.entryLogs.length > 0 ? (
          <ul>{homeInfo.entryLogs.map((log, index) => <li key={index}>🕒 {log}</li>)}</ul>
        ) : (
          <p>No recent entries recorded.</p>
        )}
      </div>
        {alert && (
    <div className="alert-bar" style={{ backgroundColor: alertData.color }}>
      <FaExclamationTriangle className="alert-icon" />
      <span>{alertData.text}</span>
      <button className="close-alert" onClick={() => setAlert(null)}>
        <FaTimes />
      </button>
    </div>
  )}

      <div className="content">
        <div className="cctv-container">
          <h2>📹 CCTV Live Feed</h2>
          <iframe src={selectedVideo} title="CCTV Live Feed" allow="autoplay; encrypted-media" allowFullScreen></iframe>
        </div>
        <div className="map-container">
          <h2>🏠 House Map</h2>
          <img src={HouseMap} alt="House Map" className="house-map" />
        </div>
      </div>
    </div>
  );
}

export default Sdata;
