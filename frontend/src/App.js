import React, { useEffect, useState, useRef } from "react";
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import './App.css';
import './SecuritySystem.css';
import { FaUserCircle, FaSignOutAlt, FaBars, FaHome, FaCaretDown } from 'react-icons/fa';
import Chart from 'chart.js/auto';
import clients from './clients';

// Import other components
import Home from './Home';
import LoginPage from './LoginPage';
import ManageUsers from './ManageUsers';
import SecuritySettings from './SecuritySettings';
import HelpSupport from './HelpSupport';
import SuperUser from './SuperUser';
import Systemlog from './Systemlog';
import Sdata from './Sdata';
const API_URL = "https://securityhub-backend-muhammaddanishali-44eacdb7.koyeb.app";

// Mock user data for demonstration (can be replaced with API call)
const mockUsers = [
  { username: 'user', password: 'password', role: 'user' },
  { username: 'admin', password: 'admin', role: 'admin' },
];

// PrivateRoute component to protect routes
function PrivateRoute({ children, isLoggedIn, userRole, requiredRole }) {
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/home/1" replace />;
  }
  return children;
}

// Security System component (unchanged)
function SecuritySystem({ isLoggedIn }) {
  const [mode, setMode] = useState("Disarm");
  const [sensors, setSensors] = useState({
    pir: { enabled: false, connected: true, value: 0, history: [], pulse: 0, responseTime: 0, uptime: 0 },
    vibration: { enabled: false, connected: true, value: 0, history: [], pulse: 0, responseTime: 0, uptime: 0 },
    dht: { enabled: false, connected: true, temperature: 0, humidity: 0, history: [], pulse: 0, responseTime: 0, uptime: 0 },
  });
  const [notifications, setNotifications] = useState([]);
  const pirChartRef = useRef(null);
  const vibrationChartRef = useRef(null);
  const dhtTempChartRef = useRef(null);
  const dhtHumidityChartRef = useRef(null);
  const chartInstances = useRef({});

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const startTime = performance.now();
        const response = await fetch("http://localhost:8000/api/sensor-status/");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        const newSensors = { ...sensors };
        const newNotifications = [...notifications];
        const currentTime = new Date().getTime();

        Object.keys(data).forEach((sensor) => {
          const wasConnected = newSensors[sensor].connected;
          newSensors[sensor].connected = data[sensor].connected;
          if (wasConnected && !newSensors[sensor].connected) {
            newNotifications.push(
              `${sensor.toUpperCase()} disconnected at ${new Date().toLocaleTimeString()}`
            );
          }
          newSensors[sensor] = { ...newSensors[sensor], ...data[sensor] };

          const history = newSensors[sensor].history || [];
          history.push({ value: data[sensor].value || data[sensor].temperature || 0, timestamp: currentTime });
          if (history.length > 50) history.shift();
          const recentChanges = history.filter(h => h.timestamp > currentTime - 60000).length;
          newSensors[sensor].history = history;
          newSensors[sensor].pulse = recentChanges;

          newSensors[sensor].responseTime = responseTime;
          newSensors[sensor].uptime = newSensors[sensor].uptime ? newSensors[sensor].uptime + 5 : 5;
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

  useEffect(() => {
    const createChart = (canvasRef, label, dataKey) => {
      if (canvasRef.current) {
        const chartId = canvasRef.current.id || label;
        if (chartInstances.current[chartId]) {
          chartInstances.current[chartId].destroy();
        }

        const newChart = new Chart(canvasRef.current, {
          type: 'line',
          data: {
            labels: [],
            datasets: [{
              label: label,
              data: [],
              borderColor: 'rgba(75, 192, 192, 1)',
              fill: false,
            }],
          },
          options: {
            scales: {
              x: { title: { display: true, text: 'Time' } },
              y: { title: { display: true, text: label } },
            },
          },
        });

        chartInstances.current[chartId] = newChart;
        return newChart;
      }
    };

    if (pirChartRef.current) pirChartRef.current.id = 'pirChart';
    if (vibrationChartRef.current) vibrationChartRef.current.id = 'vibrationChart';
    if (dhtTempChartRef.current) dhtTempChartRef.current.id = 'dhtTempChart';
    if (dhtHumidityChartRef.current) dhtHumidityChartRef.current.id = 'dhtHumidityChart';

    const pirChart = createChart(pirChartRef, 'PIR Value', 'value');
    const vibrationChart = createChart(vibrationChartRef, 'Vibration Value', 'value');
    const dhtTempChart = createChart(dhtTempChartRef, 'Temperature (°C)', 'temperature');
    const dhtHumidityChart = createChart(dhtHumidityChartRef, 'Humidity (%)', 'humidity');

    const updateChart = (chart, history, dataKey) => {
      if (chart && history) {
        chart.data.labels = history.map(h => new Date(h.timestamp).toLocaleTimeString());
        chart.data.datasets[0].data = history.map(h => h[dataKey]);
        chart.update();
      }
    };

    const interval = setInterval(() => {
      updateChart(pirChart, sensors.pir.history, 'value');
      updateChart(vibrationChart, sensors.vibration.history, 'value');
      updateChart(dhtTempChart, sensors.dht.history, 'temperature');
      updateChart(dhtHumidityChart, sensors.dht.history, 'humidity');
    }, 5000);

    return () => {
      clearInterval(interval);
      Object.values(chartInstances.current).forEach(chart => {
        if (chart) chart.destroy();
      });
      chartInstances.current = {};
    };
  }, [sensors]);

  const handleModeChange = async (newMode) => {
    try {
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
      if (data.status === "Mode set") {
        setMode(newMode);
      }
    } catch (error) {
      console.error("Error setting mode:", error);
    }
  };

  const handleSensorToggle = async (sensor, state) => {
    try {
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
          <p>Pulse: {sensors.pir.pulse} triggers/min</p>
          <p>Response Time: {sensors.pir.responseTime.toFixed(2)} ms</p>
          <p>Uptime: {(sensors.pir.uptime / 3600).toFixed(2)} hours</p>
          <canvas ref={pirChartRef} width="400" height="200"></canvas>
          <button onClick={() => handleSensorToggle("pir", sensors.pir.enabled ? "off" : "on")}>
            {sensors.pir.enabled ? "Disable" : "Enable"}
          </button>
        </div>
        <div className="sensor-item">
          <h3>Vibration Sensor</h3>
          <p>Connected: {sensors.vibration.connected ? "Yes" : "No"}</p>
          <p>Enabled: {sensors.vibration.enabled ? "Yes" : "No"}</p>
          <p>Value: {sensors.vibration.value}</p>
          <p>Pulse: {sensors.vibration.pulse} triggers/min</p>
          <p>Response Time: {sensors.vibration.responseTime.toFixed(2)} ms</p>
          <p>Uptime: {(sensors.vibration.uptime / 3600).toFixed(2)} hours</p>
          <canvas ref={vibrationChartRef} width="400" height="200"></canvas>
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
          <p>Pulse: {sensors.dht.pulse} updates/min</p>
          <p>Response Time: {sensors.dht.responseTime.toFixed(2)} ms</p>
          <p>Uptime: {(sensors.dht.uptime / 3600).toFixed(2)} hours</p>
          <canvas ref={dhtTempChartRef} width="400" height="200"></canvas>
          <canvas ref={dhtHumidityChartRef} width="400" height="200"></canvas>
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isHomesDropdownOpen, setIsHomesDropdownOpen] = useState(false);

  useEffect(() => {
    const storedLoginStatus = localStorage.getItem('isLoggedIn');
    const storedUserRole = localStorage.getItem('userRole');
    const storedUserName = localStorage.getItem('userName');
    
    if (storedLoginStatus === 'true' && storedUserRole && storedUserName) {
      setIsLoggedIn(true);
      setUserRole(storedUserRole);
      setUserName(storedUserName);
    } else {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      setIsLoggedIn(false);
      setUserRole(null);
      setUserName('');
    }
  }, []);

  const handleLogin = (username, password) => {
    const user = mockUsers.find(u => u.username === username && u.password === password);
    if (user) {
      setIsLoggedIn(true);
      setUserRole(user.role);
      setUserName(username);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userName', username);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setUserName('');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
  };

  const toggleHomesDropdown = () => {
    setIsHomesDropdownOpen(!isHomesDropdownOpen);
  };

  return (
    <Router>
      <div>
        <nav className="nav-bar">
          <div className="nav-logo">
            <Link to={isLoggedIn ? "/home/1" : "/login"}>Security System</Link>
          </div>
          
          <button className="nav-toggle" onClick={() => setIsNavOpen(!isNavOpen)}>
            <FaBars />
          </button>

          {/* Main Navbar Links (Always Visible) */}
          <div className="main-nav-links">
            {isLoggedIn ? (
              <>
                <div className="nav-left">
                  {/* Homes Dropdown */}
                  <div className="dropdown">
                    <button className="dropdown-toggle" onClick={toggleHomesDropdown}>
                      <FaHome /> Homes <FaCaretDown />
                    </button>
                    <div className={`dropdown-menu ${isHomesDropdownOpen ? 'show' : ''}`}>
                      {clients.map(client => (
                        <Link
                          key={client.id}
                          to={`/home/${client.id}`}
                          onClick={() => setIsHomesDropdownOpen(false)}
                        >
                          Home ({client.name})
                        </Link>
                      ))}
                    </div>
                  </div>
                  <Link to="/security-system">Security System</Link>
                </div>
                <div className="nav-right">
                  <span className="user-info">
                    <FaUserCircle /> Welcome, {userName}
                  </span>
                  <button className="logout-btn" onClick={handleLogout}>
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              </>
            ) : (
              <Link to="/login">Login</Link>
            )}
          </div>

          {/* Mobile Menu Links (Empty for Now) */}
          <div className={`mobile-nav-links ${isNavOpen ? 'active' : ''}`}>
            {/* Placeholder for future mobile menu items */}
            <p>No additional menu items.</p>
          </div>
        </nav>

        <div className="content-container">
          <Routes>
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/home/:clientId" element={
              <PrivateRoute isLoggedIn={isLoggedIn} userRole={userRole}>
                <Home userRole={userRole} />
              </PrivateRoute>
            } />
            <Route path="/security-system" element={
              <PrivateRoute isLoggedIn={isLoggedIn} userRole={userRole}>
                <SecuritySystem isLoggedIn={isLoggedIn} />
              </PrivateRoute>
            } />
            <Route path="/manage-users" element={
              <PrivateRoute isLoggedIn={isLoggedIn} userRole={userRole}>
                <ManageUsers />
              </PrivateRoute>
            } />
            <Route path="/security-settings" element={
              <PrivateRoute isLoggedIn={isLoggedIn} userRole={userRole}>
                <SecuritySettings />
              </PrivateRoute>
            } />
            <Route path="/help-support" element={
              <PrivateRoute isLoggedIn={isLoggedIn} userRole={userRole}>
                <HelpSupport />
              </PrivateRoute>
            } />
            <Route path="/superuser" element={
              <PrivateRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="admin">
                <SuperUser />
              </PrivateRoute>
            } />
            <Route path="/system-logs" element={
              <PrivateRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="admin">
                <Systemlog />
              </PrivateRoute>
            } />
            <Route path="/Sdata/:siteId" element={
              <PrivateRoute isLoggedIn={isLoggedIn} userRole={userRole}>
                <Sdata />
              </PrivateRoute>
            } />
            <Route path="*" element={<Navigate to={isLoggedIn ? "/home/1" : "/login"} replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;