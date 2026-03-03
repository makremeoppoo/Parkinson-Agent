import React, { useState } from 'react';
import { Login } from './components/Login';
import { DoctorDashboard } from './components/DoctorDashboard';
import { PatientLinkSession } from './components/PatientLinkSession';
import { useAuth } from './hooks/useAuth';

// Check URL for ?pt=<linkToken>  (patient link mode — no login required)
const PATIENT_LINK_TOKEN = new URLSearchParams(window.location.search).get('pt');

export function App() {
  const auth = useAuth();

  // ── Patient link mode (no Firebase auth needed) ───────────────────────────
  if (PATIENT_LINK_TOKEN) {
    return <PatientLinkSession linkToken={PATIENT_LINK_TOKEN} />;
  }

  // ── Auth loading ──────────────────────────────────────────────────────────
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
  if (!auth.user) {
    return <Login auth={auth} />;
  }

  // ── Doctor dashboard ──────────────────────────────────────────────────────
  return (
    <DoctorDashboard
      getToken={auth.getToken}
      onSignOut={auth.signOut}
      user={auth.user}
    />
  );
}
