/** @format */

import React, { useCallback, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { LogOut, Plus, Link2, FileBarChart2, Stethoscope, ChevronDown, ChevronUp, Check, RefreshCw, Search } from 'lucide-react';
import { ParkinsonAgent } from './ParkinsonAgent';
import { CONFIG } from '../global-config';

interface Patient {
  code:      string;
  linkToken: string;
  createdAt: string;
}

interface DoctorDashboardProps {
  getToken:  () => Promise<string>;
  onSignOut: () => Promise<void>;
  user:      User;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function patientLink(linkToken: string) {
  return `${window.location.origin}${window.location.pathname}?pt=${linkToken}`;
}

/** Copy text to clipboard — falls back to execCommand for HTTP contexts */
function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  const el = document.createElement('textarea');
  el.value = text;
  el.style.position = 'fixed';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  return Promise.resolve();
}

// ── Analyses mini-list per patient ────────────────────────────────────────────

function PatientAnalyses({ patient, getToken }: { patient: Patient; getToken: () => Promise<string> }) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getToken()
      .then((tok) =>
        fetch(`${CONFIG.serverUrl}/patients/${encodeURIComponent(patient.code)}/analyses`, {
          headers: { Authorization: `Bearer ${tok}` },
        })
      )
      .then((r) => (r && r.ok ? r.json() : []))
      .then((data) => { if (!cancelled) setRecords(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setRecords([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [patient.code]);

  if (loading) return <p style={{ color: '#64748b', fontSize: '.8rem', padding: '0.5rem 0' }}>Loading…</p>;
  if (!records.length) return <p style={{ color: '#475569', fontSize: '.8rem', padding: '0.5rem 0' }}>No analyses yet.</p>;

  const sev: Record<string, string> = { None: '#10b981', Mild: '#f59e0b', Moderate: '#f97316', Severe: '#ef4444' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 220, overflowY: 'auto' }}>
      {records.map((r: any, i: number) => (
        <div key={i} style={{
          background: '#0f172a', borderRadius: 8, padding: '0.55rem 0.85rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: '#94a3b8', fontSize: '.72rem' }}>{new Date(r.timestamp).toLocaleString()}</span>
          <span style={{ fontSize: '.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 4,
            color: sev[r.overall_severity] ?? '#94a3b8',
            background: (sev[r.overall_severity] ?? '#94a3b8') + '20' }}>
            {r.overall_severity ?? '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Patient card ──────────────────────────────────────────────────────────────

function PatientCard({
  patient, getToken, onScanNow,
}: {
  patient: Patient;
  getToken: () => Promise<string>;
  onScanNow: (p: Patient) => void;
}) {
  // Keep linkToken in local state so we can update it after auto-generating
  const [linkToken,    setLinkToken]   = useState(patient.linkToken);
  const [copied,       setCopied]      = useState(false);
  const [copyError,    setCopyError]   = useState('');
  const [generating,   setGenerating]  = useState(false);
  const [showHistory,  setShowHistory] = useState(false);

  const link = linkToken ? patientLink(linkToken) : null;

  const handleCopy = async () => {
    setCopyError('');

    let targetLink = link;

    // If no token yet, fetch the patient endpoint — backend will auto-generate via ensureLinkToken
    if (!targetLink) {
      setGenerating(true);
      try {
        const tok = await getToken();
        const res = await fetch(
          `${CONFIG.serverUrl}/patients/${encodeURIComponent(patient.code)}`,
          { headers: { Authorization: `Bearer ${tok}` } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.linkToken) {
            setLinkToken(data.linkToken);
            targetLink = patientLink(data.linkToken);
          }
        }
      } catch {
        setCopyError('Failed to generate link');
        setGenerating(false);
        return;
      }
      setGenerating(false);
    }

    if (!targetLink) {
      setCopyError('Could not generate link — try refreshing');
      return;
    }

    copyToClipboard(targetLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => setCopyError('Copy failed — select the link manually'));
  };

  const handleOpenReport = async () => {
    const tok = await getToken();
    window.open(
      `${CONFIG.serverUrl}/results/report?patientCode=${encodeURIComponent(patient.code)}&token=${encodeURIComponent(tok)}`,
      '_blank'
    );
  };

  return (
    <div style={{
      background: '#1e293b', border: '1px solid #334155',
      borderRadius: 14, padding: '1.1rem 1.3rem',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
        <div>
          <p style={{ color: '#60a5fa', fontSize: '.7rem', fontWeight: 600, margin: '0 0 .2rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Patient
          </p>
          <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>{patient.code}</p>
          <p style={{ color: '#475569', fontSize: '.7rem', margin: '.2rem 0 0' }}>
            Added {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : '—'}
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            onClick={handleCopy}
            disabled={generating}
            title='Copy patient link'
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.75rem',
              background: copied ? '#065f46' : '#0f172a',
              color:      copied ? '#34d399' : '#60a5fa',
              border: `1px solid ${copied ? '#065f46' : '#1e40af'}`,
              borderRadius: 7, fontSize: '.78rem', fontWeight: 600,
              cursor: generating ? 'wait' : 'pointer', whiteSpace: 'nowrap',
              opacity: generating ? 0.6 : 1 }}>
            {copied ? <Check size={13} /> : <Link2 size={13} />}
            {generating ? 'Generating…' : copied ? 'Copied!' : 'Copy Link'}
          </button>

          <button
            onClick={handleOpenReport}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.75rem',
              background: '#2e1065', color: '#c4b5fd', border: '1px solid #4c1d95',
              borderRadius: 7, fontSize: '.78rem', fontWeight: 600, cursor: 'pointer' }}>
            <FileBarChart2 size={13} />
            Report
          </button>

          <button
            onClick={() => onScanNow(patient)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.75rem',
              background: '#0c4a6e', color: '#7dd3fc', border: '1px solid #075985',
              borderRadius: 7, fontSize: '.78rem', fontWeight: 600, cursor: 'pointer' }}>
            <Stethoscope size={13} />
            Scan Now
          </button>
        </div>
      </div>

      {/* Link preview row */}
      {link ? (
        <div style={{ background: '#0f172a', borderRadius: 7, padding: '0.4rem 0.75rem', marginBottom: '0.6rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
          <Link2 size={12} color='#475569' style={{ flexShrink: 0 }} />
          <span style={{ color: '#475569', fontSize: '.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {link}
          </span>
        </div>
      ) : (
        <p style={{ color: '#94a3b8', fontSize: '.72rem', marginBottom: '0.6rem' }}>
          Click "Copy Link" to generate &amp; copy the patient link.
        </p>
      )}
      {copyError && <p style={{ color: '#f87171', fontSize: '.7rem', marginBottom: '0.5rem' }}>{copyError}</p>}

      {/* Toggle history */}
      <button
        onClick={() => setShowHistory((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: 'none',
          color: '#64748b', fontSize: '.78rem', cursor: 'pointer', padding: 0 }}>
        {showHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {showHistory ? 'Hide analyses' : 'Show analyses'}
      </button>

      {showHistory && (
        <div style={{ marginTop: '0.6rem' }}>
          <PatientAnalyses patient={patient} getToken={getToken} />
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export function DoctorDashboard({ getToken, onSignOut, user }: DoctorDashboardProps) {
  const [patients,     setPatients]   = useState<Patient[]>([]);
  const [loading,      setLoading]    = useState(true);
  const [fetchError,   setFetchError] = useState('');
  const [newCode,      setNewCode]    = useState('');
  const [adding,       setAdding]     = useState(false);
  const [addError,     setAddError]   = useState('');
  const [scanTarget,   setScanTarget] = useState<Patient | null>(null);
  const [searchQuery,  setSearchQuery] = useState('');

  const fetchPatients = useCallback(async () => {
    setFetchError('');
    setLoading(true);
    try {
      const tok = await getToken();
      const res = await fetch(`${CONFIG.serverUrl}/patients`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setPatients(await res.json());
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = newCode.trim();
    if (!code) return;
    setAdding(true); setAddError('');
    try {
      const tok = await getToken();
      const res = await fetch(`${CONFIG.serverUrl}/patients`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
        body:    JSON.stringify({ code }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Server error ${res.status}`);
      }
      setNewCode('');
      await fetchPatients();
    } catch (err: any) {
      setAddError(err.message || 'Failed to add patient');
    } finally { setAdding(false); }
  };

  const filteredPatients = searchQuery.trim()
    ? patients.filter((p) => p.code.toLowerCase().includes(searchQuery.toLowerCase()))
    : patients;

  // ── In-office scan mode ──────────────────────────────────────────────────
  if (scanTarget) {
    return (
      <ParkinsonAgent
        getToken={getToken}
        onSignOut={onSignOut}
        user={user}
        isDoctor
        patientCode={scanTarget.code}
        onChangePatient={() => setScanTarget(null)}
      />
    );
  }

  // ── Dashboard view ───────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #0c1a30 100%)',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: '#e2e8f0',
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1e293b', padding: '0.75rem 1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user.photoURL && (
            <img src={user.photoURL} alt='avatar'
              style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #334155' }} />
          )}
          <div>
            <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '.95rem', margin: 0 }}>
              {user.displayName || user.email}
            </p>
            <p style={{ color: '#64748b', fontSize: '.72rem', margin: 0 }}>Doctor Dashboard</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem',
            background: 'none', border: '1px solid #334155', borderRadius: 8,
            color: '#64748b', fontSize: '.82rem', cursor: 'pointer' }}>
          <LogOut size={14} /> Sign out
        </button>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 .25rem' }}>
          My Patients
        </h1>
        <p style={{ color: '#64748b', fontSize: '.85rem', marginBottom: '1.75rem' }}>
          Add a patient code to generate their unique analysis link, then share it.
        </p>

        {/* Add patient form */}
        <form onSubmit={handleAddPatient} style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
          <input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="Patient code  (e.g. P-1042)"
            style={{
              flex: 1, padding: '0.65rem 0.9rem',
              background: '#1e293b', border: '1.5px solid #334155',
              borderRadius: 9, color: '#f1f5f9', fontSize: '.9rem', outline: 'none',
            }}
          />
          <button
            type='submit'
            disabled={adding || !newCode.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem',
              background: (adding || !newCode.trim()) ? '#1e3a5f' : '#2563eb',
              color: 'white', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: '.9rem',
              cursor: (adding || !newCode.trim()) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
            <Plus size={16} />
            {adding ? 'Adding…' : 'Add Patient'}
          </button>
        </form>
        {addError && (
          <p style={{ color: '#f87171', fontSize: '.82rem', marginBottom: '1rem' }}>{addError}</p>
        )}

        {/* Search bar — only shown when there are patients */}
        {!loading && !fetchError && patients.length > 0 && (
          <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
            <Search size={15} color='#475569' style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search patients…'
              style={{
                width: '100%', padding: '0.6rem 0.9rem 0.6rem 2.35rem',
                background: '#1e293b', border: '1px solid #334155',
                borderRadius: 9, color: '#f1f5f9', fontSize: '.88rem', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {/* Patient list */}
        {loading ? (
          <p style={{ color: '#64748b', textAlign: 'center', marginTop: '3rem' }}>Loading patients…</p>
        ) : fetchError ? (
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <p style={{ color: '#f87171', fontSize: '.9rem', marginBottom: '1rem' }}>{fetchError}</p>
            <button
              onClick={fetchPatients}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem',
                background: '#1e293b', border: '1px solid #334155', borderRadius: 8,
                color: '#94a3b8', fontSize: '.82rem', cursor: 'pointer' }}>
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : patients.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '4rem', color: '#475569' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👥</p>
            <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.35rem' }}>No patients yet</p>
            <p style={{ fontSize: '.85rem' }}>Add a patient code above to get started.</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '3rem', color: '#475569' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔍</p>
            <p style={{ fontSize: '.9rem' }}>No patients match "{searchQuery}"</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredPatients.map((p) => (
              <PatientCard
                key={p.code}
                patient={p}
                getToken={getToken}
                onScanNow={(pat) => setScanTarget(pat)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
