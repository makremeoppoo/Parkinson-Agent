import { useState } from 'react';
import { Login } from './components/Login';
import { LandingPage } from './components/LandingPage';
import { DoctorDashboard } from './components/DoctorDashboard';
import { PatientLinkSession } from './components/PatientLinkSession';
import { useAuth } from './hooks/useAuth';

// Check URL for ?pt=<linkToken>  (patient link mode — no login required)
const PATIENT_LINK_TOKEN = new URLSearchParams(window.location.search).get('pt');

export function App() {
  const auth = useAuth();
  const [showLanding, setShowLanding] = useState(true);

  // ── Patient link mode (no Firebase auth needed) ───────────────────────────
  if (PATIENT_LINK_TOKEN) {
    return <PatientLinkSession linkToken={PATIENT_LINK_TOKEN} />;
  }

  // ── Already logged in → skip landing and login ────────────────────────────
  if (!auth.loading && auth.user) {
    return (
      <DoctorDashboard
        getToken={auth.getToken}
        onSignOut={async () => { await auth.signOut(); setShowLanding(true); }}
        user={auth.user}
      />
    );
  }

  // ── Landing page (shown while auth loads, or before login) ───────────────
  if (showLanding) {
    return <LandingPage onDoctorLogin={() => setShowLanding(false)} />;
  }

  // ── Auth still loading after landing dismissed ────────────────────────────
  if (auth.loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontFamily: "'Segoe UI', system-ui, sans-serif",
        fontSize: '1rem', gap: '0.75rem',
      }}>
        <span style={{ fontSize: '1.5rem' }}>⏳</span> Loading…
      </div>
    );
  }

  // ── Not logged in → Doctor login ──────────────────────────────────────────
  return <Login auth={auth} />;
}
