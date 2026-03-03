const SEVERITY_COLORS = {
  none:     '#22c55e',
  mild:     '#84cc16',
  moderate: '#eab308',
  severe:   '#f97316',
  critical: '#ef4444',
};

const avg    = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : '0.00';
const maxVal = (arr) => arr.length ? Math.max(...arr).toFixed(1) : '0';
const minVal = (arr) => arr.length ? Math.min(...arr).toFixed(1) : '0';
const ds     = (records, key) => records.map((r) => Number(r[key] ?? 0));

// Per-hand data helpers (falls back to overall score for legacy records)
const lKey = (records, k) => records.map((r) => Number(r.left_hand?.[k]  ?? r[k] ?? 0));
const rKey = (records, k) => records.map((r) => Number(r.right_hand?.[k] ?? r[k] ?? 0));

/** Build and return a self-contained HTML medical report with per-hand + body/core breakdown. */
const generateReport = (records) => {
  const reportDate = new Date().toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  if (records.length === 0) {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>Medical Report</title></head>
<body style="font-family:'Segoe UI',sans-serif;padding:2rem;color:#1e293b">
  <h1 style="color:#0f172a">Medical Report – Parkinson Monitoring</h1>
  <p style="color:#64748b">Generated on ${reportDate}</p>
  <p><em>No sessions recorded yet.</em></p>
</body></html>`;
  }

  const labels = records.map((r, i) => {
    const d    = new Date(r.timestamp);
    const date = d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `S${i + 1} (${date} ${time})`;
  });

  // ── Overall scores ────────────────────────────────────────────────────────
  const tremor       = ds(records, 'tremor_score');
  const rigidity     = ds(records, 'rigidity_score');
  const bradykinesia = ds(records, 'bradykinesia_score');
  const gait         = ds(records, 'gait_score');
  const balance      = ds(records, 'balance_score');

  // ── Per-hand scores ───────────────────────────────────────────────────────
  const lTremor  = lKey(records, 'tremor_score');
  const lRigid   = lKey(records, 'rigidity_score');
  const lBradyk  = lKey(records, 'bradykinesia_score');

  const rTremor  = rKey(records, 'tremor_score');
  const rRigid   = rKey(records, 'rigidity_score');
  const rBradyk  = rKey(records, 'bradykinesia_score');

  // ── Body / core scores ────────────────────────────────────────────────────
  const hasBodyScans = records.some((r) => r.posture_score !== undefined);
  const posture    = ds(records, 'posture_score');
  const facial     = ds(records, 'facial_score');
  const armSwing   = ds(records, 'arm_swing_score');
  const headTremor = ds(records, 'head_tremor_score');

  // Body-only records (for body-specific stats)
  const bodyRecs = records.filter((r) => r.posture_score !== undefined);
  const bPosture    = bodyRecs.map((r) => Number(r.posture_score    ?? 0));
  const bFacial     = bodyRecs.map((r) => Number(r.facial_score     ?? 0));
  const bArmSwing   = bodyRecs.map((r) => Number(r.arm_swing_score  ?? 0));
  const bHeadTremor = bodyRecs.map((r) => Number(r.head_tremor_score ?? 0));

  // Body severity distribution
  const bodySevCounts = {};
  bodyRecs.forEach((r) => {
    const sev = String(r.body_severity || 'unknown').toLowerCase();
    bodySevCounts[sev] = (bodySevCounts[sev] || 0) + 1;
  });
  const bodySevLabels = Object.keys(bodySevCounts);
  const bodySevData   = Object.values(bodySevCounts);
  const bodySevColors = bodySevLabels.map((l) => SEVERITY_COLORS[l] || '#94a3b8');

  // ── Severity distribution ─────────────────────────────────────────────────
  const severityCounts = {};
  records.forEach((r) => {
    const sev = String(r.overall_severity || 'unknown').toLowerCase();
    severityCounts[sev] = (severityCounts[sev] || 0) + 1;
  });
  const sevLabels = Object.keys(severityCounts);
  const sevData   = Object.values(severityCounts);
  const sevColors = sevLabels.map((l) => SEVERITY_COLORS[l] || '#94a3b8');

  const alertCount    = records.filter((r) => r.needs_alert === true || r.needs_alert === 'true').length;
  const totalSessions = records.length;

  // ── Table rows (last 20, newest first) ───────────────────────────────────
  const badge = (label, color) =>
    `<span style="padding:1px 7px;border-radius:9999px;font-size:.68rem;font-weight:700;background:${color}22;color:${color};border:1px solid ${color}44">${label}</span>`;

  const tableRows = records.slice().reverse().slice(0, 20).map((r, i) => {
    const d       = new Date(r.timestamp);
    const dateStr = d.toLocaleDateString('en-US');
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const isAlert = r.needs_alert === true || r.needs_alert === 'true';
    const sev     = r.overall_severity || '—';
    const sevColor = SEVERITY_COLORS[sev.toLowerCase()] || '#94a3b8';
    const rowBg   = isAlert ? '#fef2f2' : i % 2 === 0 ? '#f8fafc' : 'white';

    const lSev = r.left_hand?.overall_severity  || '—';
    const rSev = r.right_hand?.overall_severity || '—';
    const lSevC = SEVERITY_COLORS[lSev.toLowerCase()] || '#94a3b8';
    const rSevC = SEVERITY_COLORS[rSev.toLowerCase()] || '#94a3b8';

    const bodySev  = r.body_severity || '—';
    const bodySevC = SEVERITY_COLORS[bodySev.toLowerCase()] || '#94a3b8';

    const bodyColumns = hasBodyScans ? `
      <td>${r.posture_score     ?? '—'}</td>
      <td>${r.facial_score      ?? '—'}</td>
      <td>${r.arm_swing_score   ?? '—'}</td>
      <td>${r.head_tremor_score ?? '—'}</td>
      <td>${r.body_severity ? badge(bodySev, bodySevC) : '—'}</td>` : '';

    return `<tr style="background:${rowBg}">
      <td>${dateStr}</td><td>${timeStr}</td>
      <td>${r.left_hand?.tremor_score       ?? r.tremor_score       ?? '—'}</td>
      <td>${r.left_hand?.rigidity_score     ?? r.rigidity_score     ?? '—'}</td>
      <td>${r.left_hand?.bradykinesia_score ?? r.bradykinesia_score ?? '—'}</td>
      <td>${badge(lSev, lSevC)}</td>
      <td>${r.right_hand?.tremor_score       ?? r.tremor_score       ?? '—'}</td>
      <td>${r.right_hand?.rigidity_score     ?? r.rigidity_score     ?? '—'}</td>
      <td>${r.right_hand?.bradykinesia_score ?? r.bradykinesia_score ?? '—'}</td>
      <td>${badge(rSev, rSevC)}</td>
      <td>${r.gait_score    ?? '—'}</td>
      <td>${r.balance_score ?? '—'}</td>
      ${bodyColumns}
      <td>${badge(sev, sevColor)}</td>
      <td>${r.confidence_score || '—'}</td>
      <td>${isAlert
        ? '<span style="color:#ef4444;font-weight:700">⚠ Yes</span>'
        : '<span style="color:#22c55e">No</span>'}</td>
    </tr>`;
  }).join('\n');

  const tableBodyHeader = hasBodyScans ? `
          <th class="bh" colspan="5">Body / Core</th>` : '';
  const tableBodySubHeader = hasBodyScans ? `
          <th class="bh">Posture</th><th class="bh">Facial</th><th class="bh">Arm Sw.</th><th class="bh">Head Tr.</th><th class="bh">Body Sev.</th>` : '';

  const j = JSON.stringify;

  // ── Body section HTML (only when body scans exist) ────────────────────────
  const bodySectionHtml = hasBodyScans ? `

  <!-- ── Body / Core Assessment ── -->
  <div class="section-heading">🧍 Body / Core Assessment (${bodyRecs.length} body scan${bodyRecs.length !== 1 ? 's' : ''})</div>
  <div class="body-metrics-row">
    <div class="bm-panel">
      <div class="bm-title">Posture</div>
      <div class="bm-val" style="color:#6366f1">${avg(bPosture)}</div>
      <div class="bm-rng">min ${minVal(bPosture)} — max ${maxVal(bPosture)}</div>
    </div>
    <div class="bm-panel">
      <div class="bm-title">Facial Mask</div>
      <div class="bm-val" style="color:#8b5cf6">${avg(bFacial)}</div>
      <div class="bm-rng">min ${minVal(bFacial)} — max ${maxVal(bFacial)}</div>
    </div>
    <div class="bm-panel">
      <div class="bm-title">Arm Swing</div>
      <div class="bm-val" style="color:#a78bfa">${avg(bArmSwing)}</div>
      <div class="bm-rng">min ${minVal(bArmSwing)} — max ${maxVal(bArmSwing)}</div>
    </div>
    <div class="bm-panel">
      <div class="bm-title">Head Tremor</div>
      <div class="bm-val" style="color:#c4b5fd">${avg(bHeadTremor)}</div>
      <div class="bm-rng">min ${minVal(bHeadTremor)} — max ${maxVal(bHeadTremor)}</div>
    </div>
    <div class="bm-panel">
      <div class="bm-title">Gait</div>
      <div class="bm-val" style="color:#22c55e">${avg(ds(bodyRecs, 'gait_score'))}</div>
      <div class="bm-rng">min ${minVal(ds(bodyRecs, 'gait_score'))} — max ${maxVal(ds(bodyRecs, 'gait_score'))}</div>
    </div>
    <div class="bm-panel">
      <div class="bm-title">Balance</div>
      <div class="bm-val" style="color:#3b82f6">${avg(ds(bodyRecs, 'balance_score'))}</div>
      <div class="bm-rng">min ${minVal(ds(bodyRecs, 'balance_score'))} — max ${maxVal(ds(bodyRecs, 'balance_score'))}</div>
    </div>
  </div>

  <!-- ── Body charts ── -->
  <div class="charts-2" style="margin-bottom:2rem">
    <div class="chart-card body-chart">
      <div class="ch-title indigo">🧍 Body Score Evolution</div>
      <canvas id="bodyScoresChart" height="200"></canvas>
    </div>
    <div class="chart-card">
      <div class="ch-title">Body Severity Distribution</div>
      <canvas id="bodySeverityChart" height="200"></canvas>
    </div>
  </div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Medical Report – Parkinson Monitoring</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body  { font-family: 'Segoe UI', system-ui, sans-serif; background: #f1f5f9; color: #1e293b; padding: 2rem; }
    .page { max-width: 1200px; margin: 0 auto; }

    /* ── Header ── */
    .hdr { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
      color: white; border-radius: 12px; padding: 2rem 2.5rem; margin-bottom: 2rem;
      display: flex; justify-content: space-between; align-items: flex-end; }
    .hdr h1   { font-size: 1.8rem; font-weight: 700; letter-spacing: -.02em; }
    .hdr .sub { color: #94a3b8; font-size: .9rem; margin-top: .2rem; }
    .hdr .meta { text-align: right; font-size: .82rem; color: #cbd5e1; line-height: 1.6; }
    .hdr .meta strong { display: block; font-size: .95rem; color: white; }

    /* ── KPI cards ── */
    .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .card  { background: white; border-radius: 10px; padding: 1.25rem 1.5rem;
             box-shadow: 0 1px 3px rgba(0,0,0,.08); border-left: 4px solid transparent; }
    .card.blue   { border-color: #3b82f6; }
    .card.red    { border-color: #ef4444; }
    .card.orange { border-color: #f97316; }
    .card.green  { border-color: #22c55e; }
    .card.indigo { border-color: #6366f1; }
    .card .lbl { font-size: .72rem; color: #64748b; text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }
    .card .val { font-size: 2rem; font-weight: 700; margin-top: .2rem; }
    .card .sm  { font-size: .78rem; color: #94a3b8; margin-top: .1rem; }

    /* ── Hand comparison row ── */
    .hands-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 2rem; }
    .hand-panel { background: white; border-radius: 10px; padding: 1.25rem 1.5rem;
                  box-shadow: 0 1px 3px rgba(0,0,0,.08); }
    .hand-panel.left  { border-top: 4px solid #3b82f6; }
    .hand-panel.right { border-top: 4px solid #7c3aed; }
    .hand-title { font-size: .78rem; font-weight: 700; text-transform: uppercase;
                  letter-spacing: .08em; margin-bottom: 1rem; }
    .hand-panel.left  .hand-title { color: #3b82f6; }
    .hand-panel.right .hand-title { color: #7c3aed; }
    .hand-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: .75rem; }
    .hm { text-align: center; }
    .hm .nm { font-size: .65rem; color: #64748b; text-transform: uppercase; letter-spacing: .05em; font-weight: 600; }
    .hm .av { font-size: 1.5rem; font-weight: 700; margin: .15rem 0; }
    .hm .rng { font-size: .65rem; color: #94a3b8; }

    /* ── Body / Core metrics row ── */
    .body-metrics-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: .75rem; margin-bottom: 2rem; }
    .bm-panel { background: white; border-top: 4px solid #6366f1; border-radius: 10px;
                padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,.08); text-align: center; }
    .bm-title { font-size: .65rem; color: #6366f1; text-transform: uppercase; letter-spacing: .06em; font-weight: 700; margin-bottom: .3rem; }
    .bm-val   { font-size: 1.5rem; font-weight: 700; }
    .bm-rng   { font-size: .62rem; color: #94a3b8; margin-top: .1rem; }

    /* ── Chart panels ── */
    .chart-full { background: white; border-radius: 10px; padding: 1.5rem;
                  box-shadow: 0 1px 3px rgba(0,0,0,.08); margin-bottom: 2rem; }
    .charts-2   { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
    .charts-3   { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; margin-bottom: 2rem; }
    .chart-card { background: white; border-radius: 10px; padding: 1.5rem;
                  box-shadow: 0 1px 3px rgba(0,0,0,.08); }
    .chart-card.left   { border-top: 3px solid #3b82f6; }
    .chart-card.right  { border-top: 3px solid #7c3aed; }
    .chart-card.body-chart { border-top: 3px solid #6366f1; }
    .ch-title { font-size: .82rem; color: #475569; text-transform: uppercase;
                letter-spacing: .06em; font-weight: 600; margin-bottom: 1rem; }
    .ch-title.blue   { color: #2563eb; }
    .ch-title.purple { color: #7c3aed; }
    .ch-title.indigo { color: #6366f1; }

    /* ── Score mini stats (overall) ── */
    .scores { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .smini  { background: white; border-radius: 10px; padding: 1rem;
              box-shadow: 0 1px 3px rgba(0,0,0,.08); text-align: center; }
    .smini .nm  { font-size: .7rem; text-transform: uppercase; letter-spacing: .06em; color: #64748b; font-weight: 600; }
    .smini .av  { font-size: 1.6rem; font-weight: 700; margin: .2rem 0; }
    .smini .rng { font-size: .7rem; color: #94a3b8; }

    /* ── Table ── */
    .tbl-wrap { background: white; border-radius: 10px; padding: 1.5rem;
                box-shadow: 0 1px 3px rgba(0,0,0,.08); margin-bottom: 2rem; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: .8rem; }
    th    { background: #f8fafc; color: #475569; font-weight: 600; padding: .5rem .65rem;
            text-align: left; border-bottom: 2px solid #e2e8f0;
            font-size: .68rem; text-transform: uppercase; letter-spacing: .05em; }
    th.lh { background: #eff6ff; color: #2563eb; }
    th.rh { background: #f5f3ff; color: #7c3aed; }
    th.bh { background: #eef2ff; color: #6366f1; }
    td    { padding: .5rem .65rem; border-bottom: 1px solid #f1f5f9; }

    /* ── Section heading ── */
    .section-heading { font-size: .75rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .08em; color: #94a3b8; margin-bottom: 1rem; padding-bottom: .4rem;
      border-bottom: 1px solid #e2e8f0; }

    /* ── Footer ── */
    footer { text-align: center; color: #94a3b8; font-size: .75rem;
             padding-top: 1.5rem; border-top: 1px solid #e2e8f0; }

    @media (max-width: 900px) {
      .body-metrics-row { grid-template-columns: repeat(3, 1fr); }
    }

    @media print {
      body { background: white; padding: 0; }
      .page { max-width: none; }
      .hdr { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .card, .chart-card, .chart-full, .tbl-wrap, .smini, .hand-panel, .bm-panel { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- ── Header ── -->
  <div class="hdr">
    <div>
      <h1>Medical Report – Parkinson Monitoring</h1>
      <div class="sub">Automated AI-powered motor symptom analysis · Hand scan &amp; Full-body scan</div>
    </div>
    <div class="meta">
      <strong>Generated on</strong>
      ${reportDate}
    </div>
  </div>

  <!-- ── KPI Cards ── -->
  <div class="cards">
    <div class="card blue">
      <div class="lbl">Total Sessions</div>
      <div class="val">${totalSessions}</div>
      <div class="sm">recorded analyses</div>
    </div>
    <div class="card red">
      <div class="lbl">Avg. Tremor (overall)</div>
      <div class="val" style="color:#ef4444">${avg(tremor)}</div>
      <div class="sm">out of 3 · max ${maxVal(tremor)}</div>
    </div>
    <div class="card orange">
      <div class="lbl">Alerts Triggered</div>
      <div class="val" style="color:#f97316">${alertCount}</div>
      <div class="sm">${totalSessions > 0 ? Math.round(alertCount / totalSessions * 100) : 0}% of sessions</div>
    </div>
    ${hasBodyScans ? `
    <div class="card indigo">
      <div class="lbl">Body Scans</div>
      <div class="val" style="color:#6366f1">${bodyRecs.length}</div>
      <div class="sm">full-body analyses</div>
    </div>` : `
    <div class="card green">
      <div class="lbl">Avg. Balance</div>
      <div class="val" style="color:#22c55e">${avg(balance)}</div>
      <div class="sm">out of 3 · min ${minVal(balance)}</div>
    </div>`}
  </div>

  <!-- ── Left / Right Hand Comparison ── -->
  <div class="section-heading">✋🤚 Per-Hand Analysis</div>
  <div class="hands-row">
    <div class="hand-panel left">
      <div class="hand-title">✋ Left Hand</div>
      <div class="hand-metrics">
        <div class="hm">
          <div class="nm">Tremor</div>
          <div class="av" style="color:#ef4444">${avg(lTremor)}</div>
          <div class="rng">min ${minVal(lTremor)} — max ${maxVal(lTremor)}</div>
        </div>
        <div class="hm">
          <div class="nm">Rigidity</div>
          <div class="av" style="color:#f97316">${avg(lRigid)}</div>
          <div class="rng">min ${minVal(lRigid)} — max ${maxVal(lRigid)}</div>
        </div>
        <div class="hm">
          <div class="nm">Bradykinesia</div>
          <div class="av" style="color:#eab308">${avg(lBradyk)}</div>
          <div class="rng">min ${minVal(lBradyk)} — max ${maxVal(lBradyk)}</div>
        </div>
      </div>
    </div>
    <div class="hand-panel right">
      <div class="hand-title">🤚 Right Hand</div>
      <div class="hand-metrics">
        <div class="hm">
          <div class="nm">Tremor</div>
          <div class="av" style="color:#ef4444">${avg(rTremor)}</div>
          <div class="rng">min ${minVal(rTremor)} — max ${maxVal(rTremor)}</div>
        </div>
        <div class="hm">
          <div class="nm">Rigidity</div>
          <div class="av" style="color:#f97316">${avg(rRigid)}</div>
          <div class="rng">min ${minVal(rRigid)} — max ${maxVal(rRigid)}</div>
        </div>
        <div class="hm">
          <div class="nm">Bradykinesia</div>
          <div class="av" style="color:#eab308">${avg(rBradyk)}</div>
          <div class="rng">min ${minVal(rBradyk)} — max ${maxVal(rBradyk)}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Per-Hand Charts ── -->
  <div class="section-heading">Hand Score Evolution</div>
  <div class="charts-2">
    <div class="chart-card left">
      <div class="ch-title blue">✋ Left Hand — Tremor / Rigidity / Bradykinesia</div>
      <canvas id="leftHandChart" height="180"></canvas>
    </div>
    <div class="chart-card right">
      <div class="ch-title purple">🤚 Right Hand — Tremor / Rigidity / Bradykinesia</div>
      <canvas id="rightHandChart" height="180"></canvas>
    </div>
  </div>

  ${bodySectionHtml}

  <!-- ── Overall Scores ── -->
  <div class="section-heading">Overall Motor Scores</div>
  <div class="scores">
    <div class="smini">
      <div class="nm">Tremor</div>
      <div class="av" style="color:#ef4444">${avg(tremor)}</div>
      <div class="rng">min ${minVal(tremor)} — max ${maxVal(tremor)}</div>
    </div>
    <div class="smini">
      <div class="nm">Rigidity</div>
      <div class="av" style="color:#f97316">${avg(rigidity)}</div>
      <div class="rng">min ${minVal(rigidity)} — max ${maxVal(rigidity)}</div>
    </div>
    <div class="smini">
      <div class="nm">Bradykinesia</div>
      <div class="av" style="color:#eab308">${avg(bradykinesia)}</div>
      <div class="rng">min ${minVal(bradykinesia)} — max ${maxVal(bradykinesia)}</div>
    </div>
    <div class="smini">
      <div class="nm">Gait</div>
      <div class="av" style="color:#22c55e">${avg(gait)}</div>
      <div class="rng">min ${minVal(gait)} — max ${maxVal(gait)}</div>
    </div>
    <div class="smini">
      <div class="nm">Balance</div>
      <div class="av" style="color:#3b82f6">${avg(balance)}</div>
      <div class="rng">min ${minVal(balance)} — max ${maxVal(balance)}</div>
    </div>
  </div>

  <!-- ── All Scores + Severity ── -->
  <div class="charts-3">
    <div class="chart-card">
      <div class="ch-title">All Motor Scores Evolution</div>
      <canvas id="allScoresChart" height="200"></canvas>
    </div>
    <div class="chart-card">
      <div class="ch-title">Severity Distribution</div>
      <canvas id="severityChart" height="200"></canvas>
    </div>
  </div>

  <!-- ── Sessions Table ── -->
  <div class="section-heading">Session Details (last 20)</div>
  <div class="tbl-wrap">
    <table>
      <thead>
        <tr>
          <th rowspan="2">Date</th>
          <th rowspan="2">Time</th>
          <th class="lh" colspan="4">Left Hand</th>
          <th class="rh" colspan="4">Right Hand</th>
          <th rowspan="2">Gait</th>
          <th rowspan="2">Balance</th>
          ${tableBodyHeader}
          <th rowspan="2">Overall</th>
          <th rowspan="2">Conf.</th>
          <th rowspan="2">Alert</th>
        </tr>
        <tr>
          <th class="lh">Tremor</th><th class="lh">Rigid.</th><th class="lh">Brady.</th><th class="lh">Severity</th>
          <th class="rh">Tremor</th><th class="rh">Rigid.</th><th class="rh">Brady.</th><th class="rh">Severity</th>
          ${tableBodySubHeader}
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </div>

  <footer>
    Report automatically generated by the Parkinson-AI monitoring system · ${reportDate}<br>
    This document is for confidential medical use only.
  </footer>

</div>

<script>
  const LABELS = ${j(labels)};

  // Overall
  const T = ${j(tremor)};
  const R = ${j(rigidity)};
  const B = ${j(bradykinesia)};
  const G = ${j(gait)};
  const E = ${j(balance)};

  // Left hand
  const LT = ${j(lTremor)};
  const LR = ${j(lRigid)};
  const LB = ${j(lBradyk)};

  // Right hand
  const RT = ${j(rTremor)};
  const RR = ${j(rRigid)};
  const RB = ${j(rBradyk)};

  // Body / core (all sessions, 0 for non-body records)
  const BP = ${j(posture)};
  const BF = ${j(facial)};
  const BA = ${j(armSwing)};
  const BH = ${j(headTremor)};

  // Severity
  const SEV_L = ${j(sevLabels)};
  const SEV_D = ${j(sevData)};
  const SEV_C = ${j(sevColors)};

  // Body severity
  const BSEV_L = ${j(bodySevLabels)};
  const BSEV_D = ${j(bodySevData)};
  const BSEV_C = ${j(bodySevColors)};

  const line = (label, data, color, dash) => ({
    label, data,
    borderColor: color,
    backgroundColor: color + '18',
    pointBackgroundColor: color,
    pointRadius: 3, pointHoverRadius: 5,
    borderWidth: 2, tension: 0.35, fill: false,
    borderDash: dash || [],
  });

  const yAxis = { min: 0, max: 3, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } };
  const xAxis = { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 9 } } };
  const legendOpts = { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } };

  // Left hand chart
  new Chart(document.getElementById('leftHandChart'), {
    type: 'line',
    data: {
      labels: LABELS,
      datasets: [
        line('Tremor',       LT, '#ef4444'),
        line('Rigidity',     LR, '#f97316', [4, 2]),
        line('Bradykinesia', LB, '#eab308', [2, 2]),
      ],
    },
    options: { responsive: true, plugins: { legend: legendOpts }, scales: { y: yAxis, x: xAxis } },
  });

  // Right hand chart
  new Chart(document.getElementById('rightHandChart'), {
    type: 'line',
    data: {
      labels: LABELS,
      datasets: [
        line('Tremor',       RT, '#ef4444'),
        line('Rigidity',     RR, '#f97316', [4, 2]),
        line('Bradykinesia', RB, '#eab308', [2, 2]),
      ],
    },
    options: { responsive: true, plugins: { legend: legendOpts }, scales: { y: yAxis, x: xAxis } },
  });

  // All scores evolution
  new Chart(document.getElementById('allScoresChart'), {
    type: 'line',
    data: {
      labels: LABELS,
      datasets: [
        line('Tremor',       T, '#ef4444'),
        line('Rigidity',     R, '#f97316'),
        line('Bradykinesia', B, '#eab308'),
        line('Gait',         G, '#22c55e'),
        line('Balance',      E, '#3b82f6'),
      ],
    },
    options: { responsive: true, plugins: { legend: legendOpts }, scales: { y: yAxis, x: xAxis } },
  });

  // Severity doughnut
  new Chart(document.getElementById('severityChart'), {
    type: 'doughnut',
    data: {
      labels: SEV_L,
      datasets: [{ data: SEV_D, backgroundColor: SEV_C, borderWidth: 2, borderColor: '#fff' }],
    },
    options: {
      responsive: true, cutout: '60%',
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
    },
  });

  // Body score evolution chart (only if body scans exist)
  if (document.getElementById('bodyScoresChart')) {
    new Chart(document.getElementById('bodyScoresChart'), {
      type: 'line',
      data: {
        labels: LABELS,
        datasets: [
          line('Posture',     BP, '#6366f1'),
          line('Facial',      BF, '#8b5cf6', [4, 2]),
          line('Arm Swing',   BA, '#a78bfa', [2, 2]),
          line('Head Tremor', BH, '#c4b5fd', [6, 2]),
        ],
      },
      options: { responsive: true, plugins: { legend: legendOpts }, scales: { y: yAxis, x: xAxis } },
    });
  }

  // Body severity doughnut (only if body scans exist)
  if (document.getElementById('bodySeverityChart')) {
    new Chart(document.getElementById('bodySeverityChart'), {
      type: 'doughnut',
      data: {
        labels: BSEV_L,
        datasets: [{ data: BSEV_D, backgroundColor: BSEV_C, borderWidth: 2, borderColor: '#fff' }],
      },
      options: {
        responsive: true, cutout: '60%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
      },
    });
  }
</script>
</body>
</html>`;
};

module.exports = { generateReport };
