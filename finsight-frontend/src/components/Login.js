import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
  axios.post('http://localhost:5050/auth/login', { username, password })
    .then(res => {
      console.log("Login response:", res); // 👈 DEBUG LOG
      const token = res.data.access_token;
      if (token) {
        localStorage.setItem('token', token);
        console.log("Token saved to localStorage:", token);
        onLogin();
      } else {
        setError("Login failed: token not found.");
      }
    })
    .catch(err => {
      console.error("Login error:", err); // 👈 DEBUG LOG
      setError("Invalid username or password");
    });
};



  return (
    <div style={{ marginTop: '80px', textAlign: 'center' }}>
      <h2>Login to FinSight</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ padding: 10, margin: 10 }}
      /><br />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ padding: 10, margin: 10 }}
      /><br />
      <button onClick={handleLogin} style={{
        padding: '10px 20px',
        fontSize: '16px',
        backgroundColor: '#36a2eb',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
      }}>
        Login
      </button>
      {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}
    </div>
  );
};

export default Login;
