import React, { useState } from 'react';
import { AuthState } from '../hooks/useAuth';

interface LoginProps {
  auth: AuthState;
}

export function Login({ auth }: LoginProps) {
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    try {
      await auth.signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Sign-in failed. Please try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: '2.5rem 3rem',
        textAlign: 'center',
        maxWidth: 380,
        width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,.4)',
      }}>
        {/* Icon */}
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🧠</div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 .25rem' }}>
          Parkinson Monitor
        </h1>
        <p style={{ fontSize: '.9rem', color: '#64748b', marginBottom: '2rem' }}>
          AI-powered motor symptom analysis
        </p>

        <button
          onClick={handleSignIn}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            width: '100%',
            padding: '0.75rem 1rem',
            background: 'white',
            border: '1.5px solid #e2e8f0',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: '#1e293b',
            transition: 'box-shadow 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
        >
          {/* Google "G" logo */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>

        {error && (
          <p style={{ color: '#ef4444', fontSize: '.82rem', marginTop: '1rem' }}>{error}</p>
        )}

        <p style={{ fontSize: '.72rem', color: '#94a3b8', marginTop: '1.5rem' }}>
          Your data is private and linked to your Google account.
        </p>
      </div>
    </div>
  );
}
