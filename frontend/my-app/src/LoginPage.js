import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import './LoginPage.css';
import OIP from './OIP.jpg'; 

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Hook for navigation

  const handleSubmit = (e) => {
    e.preventDefault();

    // Hardcoded credentials for demo (replace with real authentication)
    if (username === 'admin' && password === '1234') {
      navigate('/SuperUser'); // Redirect to Home page
    } else {
      alert('Invalid username or password');
    }
  };

  return (
    <div className="login-container">
      <div className="main-heading">
        <h2>Security System</h2>
        <div className="img">
          <img src={OIP} alt="Logo" className="logo" />
        </div>
      </div>
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input 
            type="text" 
            id="username" 
            name="username" 
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="login-button">Login</button>
      </form>
    </div>
  );
};

export default LoginPage;
