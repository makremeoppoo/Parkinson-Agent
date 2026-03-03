/** @format */

import React, { useEffect, useState } from 'react';
import { HandPanel } from './HandPanel';
import { AgentAvatar } from './AgentAvatar';
import { ScanningOverlay } from './ScanningOverlay';
import { ResultOverlay } from './ResultOverlay';
import { useVideoRecording, speak, AnalysisResult } from '../hooks/useVideoRecording';
import { CONFIG } from '../global-config';

interface PatientSession {
  patientCode: string;
  doctorId:    string;
}

interface PatientLinkSessionProps {
  linkToken: string;
}

// ── Minimal past-analyses list ────────────────────────────────────────────────

function AnalysisList({ linkToken }: { linkToken: string }) {
  const [records, setRecords] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${CONFIG.serverUrl}/patient-session/${linkToken}/analyses`)
      .then((r) => r.json())
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [linkToken]);

  if (loading) return <p style={{ color: '#64748b', fontSize: '.85rem', textAlign: 'center' }}>Loading history…</p>;
  if (!records.length) return <p style={{ color: '#475569', fontSize: '.85rem', textAlign: 'center' }}>No analyses yet.</p>;

  const severityColor: Record<string, string> = {
    None: '#10b981', Mild: '#f59e0b', Moderate: '#f97316', Severe: '#ef4444',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 320, overflowY: 'auto' }}>
      {records.map((r: any, i) => (
        <div key={i} style={{
          background: '#0f172a', border: '1px solid #1e293b',
          borderRadius: 10, padding: '0.75rem 1rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ color: '#94a3b8', fontSize: '.72rem', margin: '0 0 .2rem' }}>
              {new Date(r.timestamp).toLocaleString()}
            </p>
            <p style={{ color: '#e2e8f0', fontSize: '.85rem', margin: 0 }}>{r.observations?.slice(0, 80)}…</p>
          </div>
          <span style={{
            padding: '0.25rem 0.6rem', borderRadius: 6, fontSize: '.75rem', fontWeight: 700,
            color: severityColor[r.overall_severity] ?? '#94a3b8',
            background: (severityColor[r.overall_severity] ?? '#94a3b8') + '20',
          }}>
            {r.overall_severity}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PatientLinkSession({ linkToken }: PatientLinkSessionProps) {
  const [session,    setSession]    = useState<PatientSession | null>(null);
  const [validating, setValidating] = useState(true);
  const [invalid,    setInvalid]    = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Validate the link token on mount
  useEffect(() => {
    fetch(`${CONFIG.serverUrl}/patient-session/${linkToken}`)
      .then((r) => { if (!r.ok) throw new Error('invalid'); return r.json(); })
      .then((data) => setSession(data))
      .catch(() => setInvalid(true))
      .finally(() => setValidating(false));
  }, [linkToken]);

  const {
    status, countdown, recordedUrl, uploadStatus, analysis, videoRef,
    startRecording, sendToBackend, reset,
  } = useVideoRecording({ type: 'link', linkToken });

  const handleOpenReport = () => {
    window.open(`${CONFIG.serverUrl}/patient-session/${linkToken}/report`, '_blank');
  };

  const handleGuide = () => {
    speak(
      'Welcome. Hold your hands steady in front of the camera for 7 seconds, then click Analyze to send the video to our AI for evaluation.'
    );
  };

  // ── Loading / error states ─────────────────────────────────────────────────

  if (validating) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: "'Segoe UI', sans-serif" }}>
        <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>⏳</span> Validating your link…
      </div>
    );
  }

  if (invalid || !session) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔗</div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Invalid link</h2>
          <p style={{ color: '#64748b' }}>This link is invalid or has expired. Please contact your doctor.</p>
        </div>
      </div>
    );
  }

  // ── Main session UI ────────────────────────────────────────────────────────

  return (
    <div className='min-h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden flex flex-col'>
      <div className='h-1 w-full bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900' />

      {/* Header */}
      <div className='flex items-center justify-between px-4 py-2 border-b border-slate-800/50'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🧠</span>
          <div>
            <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '.9rem', margin: 0 }}>Parkinson Monitor</p>
            <p style={{ color: '#60a5fa', fontSize: '.72rem', margin: 0 }}>Patient: {session.patientCode}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleOpenReport}
            style={{ padding: '0.45rem 0.9rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 8, fontSize: '.82rem', fontWeight: 600, cursor: 'pointer' }}>
            My Report
          </button>
          <button
            onClick={() => setShowHistory((v) => !v)}
            style={{ padding: '0.45rem 0.9rem', background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 8, fontSize: '.82rem', cursor: 'pointer' }}>
            {showHistory ? 'Hide History' : 'History'}
          </button>
        </div>
      </div>

      {/* History panel */}
      {showHistory && (
        <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '1rem 1.5rem' }}>
          <p style={{ color: '#94a3b8', fontSize: '.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '0.75rem' }}>
            Past Analyses
          </p>
          <AnalysisList linkToken={linkToken} />
        </div>
      )}

      {/* Main scan area */}
      <main className='flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px_1fr] h-full relative'>
        <div className='h-full border-r border-slate-800/50 relative order-2 lg:order-1'>
          <HandPanel side='left' status={status} label='LEFT HAND' />
        </div>
        <div className='h-full relative z-20 order-1 lg:order-2 border-b lg:border-b-0 border-slate-800'>
          <AgentAvatar status={status} onStart={startRecording} onReset={reset} onGuide={handleGuide} />
        </div>
        <div className='h-full border-l border-slate-800/50 relative order-3'>
          <HandPanel side='right' status={status} label='RIGHT HAND' />
        </div>

        {status === 'scanning' && <ScanningOverlay countdown={countdown} videoRef={videoRef} />}
        {status === 'complete' && recordedUrl && (
          <ResultOverlay
            recordedUrl={recordedUrl}
            uploadStatus={uploadStatus}
            analysis={analysis}
            onSend={sendToBackend}
            onReset={reset}
          />
        )}
      </main>
    </div>
  );
}
