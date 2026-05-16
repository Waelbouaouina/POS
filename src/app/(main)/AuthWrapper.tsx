'use client';

import { useState, useEffect } from 'react';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Check local storage on mount so they don't have to login every refresh
  useEffect(() => {
    const auth = localStorage.getItem('pos_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple hardcoded auth for desktop app usage
    if (username === 'admin' && password === '1234') {
      setIsAuthenticated(true);
      localStorage.setItem('pos_authenticated', 'true');
    } else {
      setError('Nom d\\'utilisateur ou mot de passe incorrect.');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #1e1e2f 0%, #2a2a40 100%)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <form onSubmit={handleLogin} style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        padding: '3rem',
        borderRadius: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '350px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h1 style={{ color: 'white', fontSize: '1.8rem', margin: 0 }}>Hatem POS</h1>
          <p style={{ color: '#a0a0b0', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Veuillez vous identifier</p>
        </div>

        {error && <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '0.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ color: '#a0a0b0', fontSize: '0.9rem' }}>Utilisateur</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            style={{ padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }} 
            required 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ color: '#a0a0b0', fontSize: '0.9rem' }}>Mot de passe</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }} 
            required 
          />
        </div>

        <button type="submit" style={{
          marginTop: '1rem',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: 'none',
          background: '#3b82f6',
          color: 'white',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '1rem',
          transition: 'background 0.2s'
        }} onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'} onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}>
          Se connecter
        </button>
      </form>
    </div>
  );
}
