/** @format */

import React, { useState } from 'react';
import { CONFIG } from '../global-config';

interface PatientInfo {
  code:      string;
  createdAt: string;
}

interface DoctorPatientModalProps {
  getToken:  () => Promise<string>;
  onSelect:  (patientCode: string) => void;
}

type SearchState = 'idle' | 'searching' | 'found' | 'not_found' | 'error';

export function DoctorPatientModal({ getToken, onSelect }: DoctorPatientModalProps) {
  const [code,        setCode]        = useState('');
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [patient,     setPatient]     = useState<PatientInfo | null>(null);
  const [errorMsg,    setErrorMsg]    = useState('');
  const [creating,    setCreating]    = useState(false);

  const handleSearch = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setSearchState('searching');
    setPatient(null);
    setErrorMsg('');
    try {
      const token = await getToken();
      const res   = await fetch(`${CONFIG.serverUrl}/patients/${encodeURIComponent(trimmed)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 404) {
        setSearchState('not_found');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPatient(data);
      setSearchState('found');
    } catch (err: any) {
      setSearchState('error');
      setErrorMsg(err.message || 'Search failed');
    }
  };

  const handleCreateAndSelect = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setCreating(true);
    setErrorMsg('');
    try {
      const token = await getToken();
      const res   = await fetch(`${CONFIG.serverUrl}/patients`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ code: trimmed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onSelect(trimmed);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create patient');
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    /* Backdrop */
    <div style={{
      position:        'fixed',
      inset:           0,
      background:      'rgba(0,0,0,0.75)',
      backdropFilter:  'blur(4px)',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      zIndex:          1000,
      fontFamily:      "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Card */}
      <div style={{
        background:   '#1e293b',
        borderRadius: 16,
        padding:      '2rem 2.5rem',
        width:        '90%',
        maxWidth:     420,
        boxShadow:    '0 25px 60px rgba(0,0,0,.6)',
        border:       '1px solid #334155',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👤</div>
          <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.25rem', margin: 0 }}>
            Select Patient
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '.85rem', marginTop: '.35rem' }}>
            Enter the patient code to load their session.
          </p>
        </div>

        {/* Input row */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value); setSearchState('idle'); setPatient(null); }}
            onKeyDown={handleKeyDown}
            placeholder="Patient code (e.g. P-1042)"
            style={{
              flex:        1,
              padding:     '0.65rem 0.85rem',
              background:  '#0f172a',
              border:      '1.5px solid #334155',
              borderRadius: 8,
              color:       '#f1f5f9',
              fontSize:    '.9rem',
              outline:     'none',
            }}
            autoFocus
          />
          <button
            onClick={handleSearch}
            disabled={!code.trim() || searchState === 'searching'}
            style={{
              padding:      '0.65rem 1.1rem',
              background:   '#2563eb',
              color:        'white',
              border:       'none',
              borderRadius: 8,
              fontWeight:   700,
              fontSize:     '.88rem',
              cursor:       (!code.trim() || searchState === 'searching') ? 'not-allowed' : 'pointer',
              opacity:      (!code.trim() || searchState === 'searching') ? 0.6 : 1,
              whiteSpace:   'nowrap',
            }}
          >
            {searchState === 'searching' ? '…' : 'Search'}
          </button>
        </div>

        {/* Results */}
        {searchState === 'found' && patient && (
          <div style={{
            background:   '#0f172a',
            border:       '1px solid #1d4ed8',
            borderRadius: 10,
            padding:      '1rem 1.2rem',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#60a5fa', fontSize: '.75rem', fontWeight: 600, margin: '0 0 .2rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Patient found
                </p>
                <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1rem', margin: 0 }}>
                  {patient.code}
                </p>
                <p style={{ color: '#64748b', fontSize: '.75rem', margin: '.2rem 0 0' }}>
                  Created {new Date(patient.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span style={{ fontSize: '1.75rem' }}>✅</span>
            </div>
            <button
              onClick={() => onSelect(patient.code)}
              style={{
                marginTop:    '0.85rem',
                width:        '100%',
                padding:      '0.65rem',
                background:   '#1d4ed8',
                color:        'white',
                border:       'none',
                borderRadius: 8,
                fontWeight:   700,
                fontSize:     '.9rem',
                cursor:       'pointer',
              }}
            >
              Select Patient
            </button>
          </div>
        )}

        {searchState === 'not_found' && (
          <div style={{
            background:   '#0f172a',
            border:       '1px solid #374151',
            borderRadius: 10,
            padding:      '1rem 1.2rem',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
              <div>
                <p style={{ color: '#f59e0b', fontSize: '.75rem', fontWeight: 600, margin: '0 0 .2rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Patient not found
                </p>
                <p style={{ color: '#94a3b8', fontSize: '.85rem', margin: 0 }}>
                  Code <strong style={{ color: '#f1f5f9' }}>{code.trim()}</strong> does not exist yet.
                </p>
              </div>
              <span style={{ fontSize: '1.75rem' }}>🆕</span>
            </div>
            <button
              onClick={handleCreateAndSelect}
              disabled={creating}
              style={{
                width:        '100%',
                padding:      '0.65rem',
                background:   creating ? '#374151' : '#059669',
                color:        'white',
                border:       'none',
                borderRadius: 8,
                fontWeight:   700,
                fontSize:     '.9rem',
                cursor:       creating ? 'not-allowed' : 'pointer',
              }}
            >
              {creating ? 'Creating…' : 'Create & Select Patient'}
            </button>
          </div>
        )}

        {searchState === 'error' && (
          <p style={{ color: '#f87171', fontSize: '.83rem', textAlign: 'center', margin: '0 0 1rem' }}>
            {errorMsg}
          </p>
        )}

        {errorMsg && searchState !== 'error' && (
          <p style={{ color: '#f87171', fontSize: '.83rem', textAlign: 'center', margin: '0 0 1rem' }}>
            {errorMsg}
          </p>
        )}

        <p style={{ color: '#475569', fontSize: '.72rem', textAlign: 'center', marginTop: '.5rem' }}>
          Each patient is identified by a unique code you assign.
        </p>
      </div>
    </div>
  );
}
