import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SuperUser.css';
import OIP from './OIP.jpg';

const SuperUser = () => {
    const navigate = useNavigate();
    const [systemLogs, setSystemLogs] = useState([]);

     useEffect(() => {
        const storedLogs = JSON.parse(localStorage.getItem("systemLogs")) || [];
        setSystemLogs(storedLogs);
    }, []);

    const clearSystemLogs = () => {
        localStorage.removeItem('systemLogs');
        setSystemLogs([]);
    };

    return (
        <div className="superuser-container">
            <div className="main-heading">
                <h2>Security System</h2>
                <div className="img">
                    <img src={OIP} alt="Logo" className="logo" />
                </div>
            </div>
            <header className="header">
                <h2>Welcome Super User</h2>
            </header>

            <div className="system-logs-section">
                <h2>System Logs</h2>
                {systemLogs.length > 0 ? (
                    <ul className="logs-list">
                        {systemLogs.map((log, index) => (
                            <li key={index} className="log-item">
                                <span className="timestamp">{log.timestamp}</span>
                                <span className="message">{log.message}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No system logs available.</p>
                )}
                <button onClick={clearSystemLogs} className="clear-logs-button">Clear Logs</button>
            </div>
            <div className="navigation-section">
                 <button onClick={() => navigate('/manage-users')} className="manage-users-button">Manage Users</button>
            </div>
        </div>
    );
};

export default SuperUser;