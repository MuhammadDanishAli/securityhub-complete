import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./securitysettings.css";

function Securitysettings() {
  const navigate = useNavigate();
  
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [twoFactor, setTwoFactor] = useState(false);
  const [alarmDelay, setAlarmDelay] = useState(30);

  useEffect(() => {
    const savedPin = localStorage.getItem("securityPin") || "";
    const savedTwoFactor = JSON.parse(localStorage.getItem("twoFactor")) || false;
    const savedAlarmDelay = localStorage.getItem("alarmDelay") || 30;

    setTwoFactor(savedTwoFactor);
    setAlarmDelay(Number(savedAlarmDelay));
  }, []);

  const handlePinChange = () => {
    if (pin.length < 4) {
      alert("PIN must be at least 4 digits.");
      return;
    }
    if (pin !== confirmPin) {
      alert("PINs do not match!");
      return;
    }
    localStorage.setItem("securityPin", pin);
    alert("🔐 PIN updated successfully!");
    setPin("");
    setConfirmPin("");
  };

  const handleTwoFactorToggle = () => {
    const newState = !twoFactor;
    setTwoFactor(newState);
    localStorage.setItem("twoFactor", JSON.stringify(newState));
    alert(`✅ Two-Factor Authentication ${newState ? "Enabled" : "Disabled"}`);
  };

  const handleAlarmDelayChange = (e) => {
    const delay = e.target.value;
    setAlarmDelay(delay);
    localStorage.setItem("alarmDelay", delay);
  };

  return (
    <div className="security-settings-container">
      <h1>🔒 Security Settings</h1>
      <button className="back-btn" onClick={() => navigate(-1)}>Back</button>

      <div className="settings-section">
        <h2>🔢 Change PIN</h2>
        <input
          type="password"
          placeholder="Enter New PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          maxLength={6}
        />
        <input
          type="password"
          placeholder="Confirm New PIN"
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value)}
          maxLength={6}
        />
        <button className="save-btn" onClick={handlePinChange}>Save PIN</button>
      </div>

      <div className="settings-section">
        <h2>🔑 Two-Factor Authentication</h2>
        <button className="toggle-btn" onClick={handleTwoFactorToggle}>
          {twoFactor ? "Disable 2FA" : "Enable 2FA"}
        </button>
      </div>

      <div className="settings-section">
        <h2>⏳ Alarm Delay Time (seconds)</h2>
        <input
          type="number"
          value={alarmDelay}
          onChange={handleAlarmDelayChange}
          min="10"
          max="120"
        />
        <p>⏰ Alarm will trigger after {alarmDelay} seconds if not disarmed.</p>
      </div>
    </div>
  );
}

export default Securitysettings;
