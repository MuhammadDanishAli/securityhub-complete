import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './App.css';
import './Home.css';
import OIP from './OIP.jpg';
import Logo1 from './Logo1.jpeg';
import { FaTimes, FaList } from 'react-icons/fa';
import clients from './clients';

function Home({ userRole }) {
  const navigate = useNavigate();
  const { clientId } = useParams();
  console.log("clientId:", clientId);
  const client = clients.find(client => client.id === parseInt(clientId));
  console.log("client:", client);
  const currentTime = new Date().toLocaleTimeString();

  // State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [armedHomes, setArmedHomes] = useState(client ? client.homes.map(() => Math.random() < 0.5) : []);
  const [stayMode, setStayMode] = useState(client ? client.homes.map(() => Math.random() < 0.5) : []);
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, homeId = null) => {
    const newAlert = { id: Date.now(), message };
    setNotifications((prev) => [...prev, newAlert]);
  };

  useEffect(() => {
    localStorage.setItem(`armedHomes-${clientId}`, JSON.stringify(armedHomes));
  }, [armedHomes, clientId]);

  useEffect(() => {
    const storedArmedHomes = localStorage.getItem(`armedHomes-${clientId}`);
    const storedStayMode = localStorage.getItem(`stayMode-${clientId}`);
    if (storedArmedHomes) {
      setArmedHomes(JSON.parse(storedArmedHomes));
    }
    if (storedStayMode) {
      setStayMode(JSON.parse(storedStayMode));
    }
  }, [clientId]);

  useEffect(() => {
    if (!client) return;

    const alertIntervals = client.homes.map((_, index) => {
      return setInterval(() => {
        addNotification(`🔥 FIRE ALERT at Home ${index + 1}!`, index + 1);
        addNotification(`🚪 DOOR OPEN at Home ${index + 1} since ${new Date().toLocaleTimeString()}`, index + 1);
        addNotification(`🚨thief alert at Home${index + 1} at ${new Date().toLocaleTimeString()}`, index + 1);
      }, 20000 + index * 2000);
    });

    return () => alertIntervals.forEach(clearInterval);
  }, [client]);

  if (!client) return <h1>Client Not Found</h1>;

  return (
    <div className="main-background">
      <button className="settings-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <FaTimes /> : <FaList />}
      </button>
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <button className="close-btn" onClick={() => setSidebarOpen(false)}>
          <FaTimes />
        </button>
        <h2>Settings</h2>
        <ul>
          <li onClick={() => navigate(`/manage-users`)}>Manage Users</li>
          <li onClick={() => navigate(`/security-settings`)}>Security Settings</li>
          <li onClick={() => navigate(`/help-support`)}>Help & Support</li>
          {userRole === 'admin' && (
            <>
              <li onClick={() => navigate(`/superuser`)}>Superuser</li>
              <li onClick={() => navigate(`/system-logs`)}>System Logs</li>
            </>
          )}
        </ul>
      </div>
      <h1 className="Head">Security System</h1>
      <div className="home-container">
        <div className="img">
          <img src={OIP} alt="Main Logo" className="logo" />
        </div>
        <header className="home-header">
          <h2>Welcome, {client.name}!</h2>
          <p className="sub-header">Login Time: {currentTime}</p>
        </header>
      </div>
      <button className="ALERT">
        ALERT {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
      </button>
      <div className="notifications">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div key={notif.id} className="notification-item">
              {notif.message}
            </div>
          ))
        ) : (
          <p className="no-notifications">No alerts</p>
        )}
      </div>
      <div className="logos-container">
        <div className="row">
          {client.homes.map((home, index) => (
            <div
              key={home.siteId}
              className={`logo-box ${armedHomes[index] ? "armed" : "disarmed"}`}
              onClick={() => navigate(`/Sdata/${home.siteId}?address=${encodeURIComponent(home.address)}`)}
            >
              <img src={Logo1} alt={`Home Logo ${index + 1}`} className="logo-img" />
              <p className="logo-label">HOME NO {index + 1}</p>
              <p className="Owner">Owner: {client.name}</p>
              <p className="site">Site Id: {home.siteId}</p>
              <p className="SiteType">Site type: {home.siteType}</p>
              <p className="address-text">{home.address}</p>
              <p className="status-text">{armedHomes[index] ? "Armed" : "Disarmed"}</p>
              <p className="stay-status">{stayMode[index] ? "Stay" : "Away"}</p>
              <p className="zones-label">Normal Zones: {home.zones.normal.join(", ")}</p>
              <p className="alert-zones-label">Alert Zones: {home.zones.alert.join(", ")}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;