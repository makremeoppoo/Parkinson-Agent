import React, { useState } from 'react';
import { AuthState } from '../hooks/useAuth';

interface LoginProps {
  auth: AuthState;
}

type Mode = 'signin' | 'register';

function friendlyError(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':   return 'Invalid email or password.';
    case 'auth/email-already-in-use': return 'An account with this email already exists.';
    case 'auth/weak-password':        return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':        return 'Please enter a valid email address.';
    default:                          return 'Something went wrong. Please try again.';
  }
}

export function Login({ auth }: LoginProps) {
  const [mode,     setMode]     = useState<Mode>('signin');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  const reset = () => { setEmail(''); setPassword(''); setConfirm(''); setError(null); };
  const switchMode = (m: Mode) => { setMode(m); reset(); };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try { await auth.signInWithEmail(email, password); }
    catch (err: any) { setError(friendlyError(err.code || '')); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try { await auth.registerWithEmail(email, password); }
    catch (err: any) { setError(friendlyError(err.code || '')); }
    finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.75rem',
    border: '1.5px solid #e2e8f0', borderRadius: 8,
    fontSize: '.9rem', marginBottom: '1rem',
    outline: 'none', boxSizing: 'border-box', color: '#1e293b',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '.8rem', fontWeight: 600, color: '#334155',
    display: 'block', marginBottom: '.25rem',
  };

  const modeBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '0.45rem 0', border: 'none', borderRadius: 6,
    background: active ? '#e0e7ff' : 'transparent',
    color: active ? '#1d4ed8' : '#64748b',
    fontWeight: active ? 700 : 500, fontSize: '0.82rem',
    cursor: 'pointer', transition: 'all 0.15s',
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        background: 'white', borderRadius: 16,
        padding: '2.5rem 3rem', textAlign: 'center',
        maxWidth: 400, width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,.4)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🩺</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 .25rem' }}>
          Doctor Portal
        </h1>
        <p style={{ fontSize: '.88rem', color: '#64748b', marginBottom: '1.75rem' }}>
          Parkinson Monitor — physician access
        </p>

        {/* Sign In / Register toggle */}
        <div style={{ display: 'flex', gap: '0.25rem', background: '#f1f5f9', borderRadius: 8, padding: '0.25rem', marginBottom: '1.25rem' }}>
          <button style={modeBtn(mode === 'signin')}   onClick={() => switchMode('signin')}>Sign In</button>
          <button style={modeBtn(mode === 'register')} onClick={() => switchMode('register')}>Register</button>
        </div>

        {/* Sign In */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} style={{ textAlign: 'left' }}>
            <label style={labelStyle}>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@hospital.com" style={inputStyle} />
            <label style={labelStyle}>Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" style={{ ...inputStyle, marginBottom: '1.25rem' }} />
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '0.75rem', background: loading ? '#93c5fd' : '#2563eb',
              color: 'white', border: 'none', borderRadius: 8,
              fontSize: '.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <p style={{ fontSize: '.75rem', color: '#94a3b8', marginTop: '0.75rem', textAlign: 'center' }}>
              No account?{' '}
              <span style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }} onClick={() => switchMode('register')}>
                Register here
              </span>
            </p>
          </form>
        )}

        {/* Register */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} style={{ textAlign: 'left' }}>
            <label style={labelStyle}>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@hospital.com" style={inputStyle} />
            <label style={labelStyle}>Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters" style={inputStyle} />
            <label style={labelStyle}>Confirm Password</label>
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••" style={{ ...inputStyle, marginBottom: '1.25rem' }} />
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '0.75rem', background: loading ? '#93c5fd' : '#2563eb',
              color: 'white', border: 'none', borderRadius: 8,
              fontSize: '.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Creating account…' : 'Create Doctor Account'}
            </button>
            <p style={{ fontSize: '.75rem', color: '#94a3b8', marginTop: '0.75rem', textAlign: 'center' }}>
              Already registered?{' '}
              <span style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }} onClick={() => switchMode('signin')}>
                Sign in
              </span>
            </p>
          </form>
        )}

        {error && (
          <p style={{ color: '#ef4444', fontSize: '.82rem', marginTop: '1rem', textAlign: 'center' }}>{error}</p>
        )}

        <p style={{ fontSize: '.68rem', color: '#cbd5e1', marginTop: '1.25rem' }}>
          Patients access via their unique link — no login required.
        </p>
      </div>
    </div>
  );
}
