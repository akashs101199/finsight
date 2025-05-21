import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Login from './components/Login';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  return (
    <div className="App">
      {isLoggedIn
        ? <Dashboard onLogout={handleLogout} />
        : <Login onLogin={() => setIsLoggedIn(true)} />
      }
    </div>
  );
}

export default App;
