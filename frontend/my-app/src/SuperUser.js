import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SuperUser.css';
import { FaArrowLeft } from 'react-icons/fa';

const clients = [
  { id: 1, name: 'Ali', armed: true },
  { id: 2, name: 'Ahmed', armed: false },
  { id: 3, name: 'Sara', armed: true },
  { id: 4, name: 'Zara', armed: false },
];

function SuperUser() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState({});

  useEffect(() => {
    // Simulate real-time alerts using an interval
    const alertInterval = setInterval(() => {
      const newAlerts = { ...alerts };
      clients.forEach(client => {
        if (Math.random() < 0.3) { // 30% chance to generate an alert
          if (!newAlerts[client.id]) newAlerts[client.id] = [];
          newAlerts[client.id].push(`🚨 Alert for ${client.name} at ${new Date().toLocaleTimeString()}`);
        }
      });
      setAlerts(newAlerts);
    }, 15000); // Generate alerts every 15 sec

    return () => clearInterval(alertInterval);
  }, [alerts]);

  return (
    <div className="superuser-container">
      <button className="back-btn" onClick={() => navigate('/')}> 
        <FaArrowLeft /> Back 
      </button>
      <div className="alerts-section">
        <h2>Recent Alerts</h2>
        {Object.keys(alerts).length > 0 ? (
          Object.entries(alerts).map(([clientId, clientAlerts]) => (
            <div key={clientId} className="alert-box">
              <h3>{clients.find(c => c.id === parseInt(clientId)).name}</h3>
              {clientAlerts.map((alert, index) => (
                <p key={index} className="alert-message">{alert}</p>
              ))}
            </div>
          ))
        ) : (
          <p>No alerts currently</p>
        )}
      </div>
      <h1 className="superuser-header">Super User Dashboard</h1>
    
      
      <div className="clients-list">
        {clients.map(client => (
          <div 
            key={client.id} 
            className="client-card" 
            onClick={() => navigate(`/home/${client.id}`)}
          >
            <span 
              className="status-dot" 
              style={{ backgroundColor: client.armed ? 'red' : 'green' }}
            ></span>
            <p>{client.name}</p>
            {alerts[client.id] && alerts[client.id].length > 0 && (
              <span className="alert-badge">{alerts[client.id].length}</span>
            )}
          </div>
        ))}
      </div>

      {/* Alerts Section */}
    </div>
  );
}

export default SuperUser;
