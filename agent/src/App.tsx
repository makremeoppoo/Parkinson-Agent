import React from 'react';
import { ParkinsonAgent } from './components/ParkinsonAgent';
import { Login } from './components/Login';
import { useAuth } from './hooks/useAuth';

export function App() {
  const auth = useAuth();

  if (auth.loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        fontSize: '1rem',
        gap: '0.75rem',
      }}>
        <span style={{ fontSize: '1.5rem' }}>⏳</span> Loading…
      </div>
    );
  }

  if (!auth.user) {
    return <Login auth={auth} />;
  }

  return <ParkinsonAgent getToken={auth.getToken} onSignOut={auth.signOut} user={auth.user} />;
}
