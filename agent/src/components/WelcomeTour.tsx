/** @format */

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'parkinson-tour-v1';

interface Step {
  icon:   string;
  title:  string;
  body:   string;
  style:  React.CSSProperties;
  arrow?: 'down' | 'up';
}

const STEPS: Step[] = [
  {
    icon:  '🧠',
    title: 'Welcome to Parkinson Monitor',
    body:  'AI-powered symptom detection through hand tremor and movement analysis. Ready in seconds.',
    style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  },
  {
    icon:  '📷',
    title: 'Start your scan',
    body:  'Click the START button in the center panel. Hold your hands steady in front of the camera for 7 seconds.',
    style: { top: '25%', left: '50%', transform: 'translateX(-50%)' },
    arrow: 'down',
  },
  {
    icon:  '🔄',
    title: 'Choose scan mode',
    body:  'Switch between HANDS (tremor analysis) and BODY (gait & posture) using the mode toggle below the agent.',
    style: { top: '25%', left: '50%', transform: 'translateX(-50%)' },
    arrow: 'down',
  },
  {
    icon:  '🤖',
    title: 'Let AI analyze',
    body:  'After recording, click ANALYZE to send the video to our AI. Results and severity scores appear instantly.',
    style: { top: '25%', left: '50%', transform: 'translateX(-50%)' },
    arrow: 'down',
  },
  {
    icon:  '📊',
    title: 'Your medical report',
    body:  'Click the REPORT button (top right) anytime to see your full history, charts, and session trends.',
    style: { top: '10%', right: '1.5rem' },
    arrow: 'up',
  },
];

export function WelcomeTour() {
  const [step,    setStep]    = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  if (!visible) return null;

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.72)',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Tooltip card */}
      <div style={{
        position:     'absolute',
        ...current.style,
        background:   '#0f172a',
        border:       '1px solid #334155',
        borderRadius: 16,
        padding:      '1.5rem 1.75rem',
        maxWidth:     340,
        width:        'calc(100vw - 3rem)',
        boxShadow:    '0 24px 64px rgba(0,0,0,0.6)',
      }}>

        {/* Progress bar dots */}
        <div style={{ display: 'flex', gap: 5, marginBottom: '1.1rem' }}>
          {STEPS.map((_, i) => (
            <span key={i} style={{
              height: 5, borderRadius: 3,
              width:      i === step ? 20 : 6,
              background: i === step ? '#3b82f6' : '#1e293b',
              transition: 'all 0.3s',
              flexShrink: 0,
            }} />
          ))}
        </div>

        {/* Icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.55rem' }}>
          <span style={{ fontSize: '1.4rem' }}>{current.icon}</span>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3 }}>
            {current.title}
          </h3>
        </div>

        {/* Body */}
        <p style={{ margin: '0 0 1.2rem', fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.65 }}>
          {current.body}
        </p>

        {/* Directional arrow */}
        {current.arrow === 'down' && (
          <p style={{ textAlign: 'center', margin: '0 0 0.75rem', fontSize: '1.25rem', color: '#3b82f6' }}>↓</p>
        )}
        {current.arrow === 'up' && (
          <p style={{ textAlign: 'center', margin: '0 0 0.75rem', fontSize: '1.25rem', color: '#3b82f6' }}>↑</p>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={finish}
            style={{ background: 'none', border: 'none', color: '#475569', fontSize: '0.78rem', cursor: 'pointer', padding: '0.25rem 0' }}>
            Skip tour
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                style={{
                  background: '#1e293b', color: '#94a3b8', border: '1px solid #334155',
                  borderRadius: 8, padding: '0.5rem 1rem', fontSize: '0.82rem', cursor: 'pointer',
                }}>
                ← Back
              </button>
            )}
            <button
              onClick={() => isLast ? finish() : setStep((s) => s + 1)}
              style={{
                background: '#3b82f6', color: 'white', border: 'none',
                borderRadius: 8, padding: '0.5rem 1.1rem',
                fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
              }}>
              {isLast ? "Let's go!" : 'Next →'}
            </button>
          </div>
        </div>

        {/* Step counter */}
        <p style={{ margin: '0.85rem 0 0', textAlign: 'center', fontSize: '0.68rem', color: '#1e293b' }}>
          {step + 1} / {STEPS.length}
        </p>
      </div>
    </div>
  );
}
