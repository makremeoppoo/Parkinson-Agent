const { getResults } = require('./dataLogger');

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

/**
 * Build and return a self-contained HTML medical report.
 */
const generateReport = () => {
  const records = getResults();
  const reportDate = new Date().toLocaleString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  if (records.length === 0) {
    return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Rapport Médical</title></head>
<body style="font-family:'Segoe UI',sans-serif;padding:2rem;color:#1e293b">
  <h1 style="color:#0f172a">Rapport Médical – Suivi Parkinson</h1>
  <p style="color:#64748b">Généré le ${reportDate}</p>
  <p><em>Aucune session enregistrée pour le moment.</em></p>
</body></html>`;
  }

  const labels       = records.map((r, i) => {
    const d    = new Date(r.timestamp);
    const date = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `S${i + 1} (${date} ${time})`;
  });

  const tremor      = ds(records, 'tremor_score');
  const rigidity    = ds(records, 'rigidity_score');
  const bradykinesia= ds(records, 'bradykinesia_score');
  const gait        = ds(records, 'gait_score');
  const balance     = ds(records, 'balance_score');

  // Severity distribution
  const severityCounts = {};
  records.forEach((r) => {
    const sev = String(r.overall_severity || 'inconnu').toLowerCase();
    severityCounts[sev] = (severityCounts[sev] || 0) + 1;
  });
  const sevLabels = Object.keys(severityCounts);
  const sevData   = Object.values(severityCounts);
  const sevColors = sevLabels.map((l) => SEVERITY_COLORS[l] || '#94a3b8');

  const alertCount   = records.filter((r) => r.needs_alert === true || r.needs_alert === 'true').length;
  const totalSessions = records.length;

  // Table rows (last 20, newest first)
  const tableRows = records.slice().reverse().slice(0, 20).map((r, i) => {
    const d      = new Date(r.timestamp);
    const dateStr = d.toLocaleDateString('fr-FR');
    const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const isAlert = r.needs_alert === true || r.needs_alert === 'true';
    const sev     = r.overall_severity || '—';
    const sevColor = SEVERITY_COLORS[sev.toLowerCase()] || '#94a3b8';
    const conf    = r.confidence_score || '—';
    const rowBg   = isAlert ? '#fef2f2' : i % 2 === 0 ? '#f8fafc' : 'white';
    return `<tr style="background:${rowBg}">
      <td>${dateStr}</td>
      <td>${timeStr}</td>
      <td>${r.tremor_score ?? '—'}</td>
      <td>${r.rigidity_score ?? '—'}</td>
      <td>${r.bradykinesia_score ?? '—'}</td>
      <td>${r.gait_score ?? '—'}</td>
      <td>${r.balance_score ?? '—'}</td>
      <td><span style="padding:2px 10px;border-radius:9999px;font-size:.72rem;font-weight:700;
          background:${sevColor}22;color:${sevColor};border:1px solid ${sevColor}44">${sev}</span></td>
      <td>${conf}</td>
      <td>${isAlert
        ? '<span style="color:#ef4444;font-weight:700">⚠ Oui</span>'
        : '<span style="color:#22c55e">Non</span>'}</td>
    </tr>`;
  }).join('\n');

  // Serialise for Chart.js
  const j = JSON.stringify;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rapport Médical – Suivi Parkinson</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body   { font-family: 'Segoe UI', system-ui, sans-serif; background: #f1f5f9; color: #1e293b; padding: 2rem; }
    .page  { max-width: 1100px; margin: 0 auto; }

    /* ── Header ── */
    .hdr {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
      color: white; border-radius: 12px; padding: 2rem 2.5rem; margin-bottom: 2rem;
      display: flex; justify-content: space-between; align-items: flex-end;
    }
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
    .card .lbl { font-size: .72rem; color: #64748b; text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }
    .card .val { font-size: 2rem; font-weight: 700; margin-top: .2rem; }
    .card .sm  { font-size: .78rem; color: #94a3b8; margin-top: .1rem; }

    /* ── Score mini stats ── */
    .scores { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .smini  { background: white; border-radius: 10px; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,.08); text-align: center; }
    .smini .nm  { font-size: .7rem; text-transform: uppercase; letter-spacing: .06em; color: #64748b; font-weight: 600; }
    .smini .av  { font-size: 1.6rem; font-weight: 700; margin: .2rem 0; }
    .smini .rng { font-size: .7rem; color: #94a3b8; }

    /* ── Chart panels ── */
    .chart-full { background: white; border-radius: 10px; padding: 1.5rem;
                  box-shadow: 0 1px 3px rgba(0,0,0,.08); margin-bottom: 2rem; }
    .charts-2   { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; margin-bottom: 2rem; }
    .chart-card { background: white; border-radius: 10px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
    .ch-title   { font-size: .82rem; color: #475569; text-transform: uppercase;
                  letter-spacing: .06em; font-weight: 600; margin-bottom: 1rem; }

    /* ── Table ── */
    .tbl-wrap { background: white; border-radius: 10px; padding: 1.5rem;
                box-shadow: 0 1px 3px rgba(0,0,0,.08); margin-bottom: 2rem; overflow-x: auto; }
    table  { width: 100%; border-collapse: collapse; font-size: .84rem; }
    th     { background: #f8fafc; color: #475569; font-weight: 600; padding: .55rem .75rem;
             text-align: left; border-bottom: 2px solid #e2e8f0;
             font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; }
    td     { padding: .55rem .75rem; border-bottom: 1px solid #f1f5f9; }

    /* ── Footer ── */
    footer { text-align: center; color: #94a3b8; font-size: .75rem;
             padding-top: 1.5rem; border-top: 1px solid #e2e8f0; }

    /* ── Print ── */
    @media print {
      body { background: white; padding: 0; }
      .page { max-width: none; }
      .hdr { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .card, .chart-card, .chart-full, .tbl-wrap, .smini { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- ── Header ── -->
  <div class="hdr">
    <div>
      <h1>Rapport Médical – Suivi Parkinson</h1>
      <div class="sub">Analyse automatisée des symptômes moteurs par IA</div>
    </div>
    <div class="meta">
      <strong>Généré le</strong>
      ${reportDate}
    </div>
  </div>

  <!-- ── KPI Cards ── -->
  <div class="cards">
    <div class="card blue">
      <div class="lbl">Sessions totales</div>
      <div class="val">${totalSessions}</div>
      <div class="sm">analyses enregistrées</div>
    </div>
    <div class="card red">
      <div class="lbl">Tremblement moy.</div>
      <div class="val" style="color:#ef4444">${avg(tremor)}</div>
      <div class="sm">sur 3 · max ${maxVal(tremor)}</div>
    </div>
    <div class="card orange">
      <div class="lbl">Alertes déclenchées</div>
      <div class="val" style="color:#f97316">${alertCount}</div>
      <div class="sm">${totalSessions > 0 ? Math.round(alertCount / totalSessions * 100) : 0}% des sessions</div>
    </div>
    <div class="card green">
      <div class="lbl">Équilibre moy.</div>
      <div class="val" style="color:#22c55e">${avg(balance)}</div>
      <div class="sm">sur 3 · min ${minVal(balance)}</div>
    </div>
  </div>

  <!-- ── Score mini stats ── -->
  <div class="scores">
    <div class="smini">
      <div class="nm">Tremblement</div>
      <div class="av" style="color:#ef4444">${avg(tremor)}</div>
      <div class="rng">min ${minVal(tremor)} — max ${maxVal(tremor)}</div>
    </div>
    <div class="smini">
      <div class="nm">Rigidité</div>
      <div class="av" style="color:#f97316">${avg(rigidity)}</div>
      <div class="rng">min ${minVal(rigidity)} — max ${maxVal(rigidity)}</div>
    </div>
    <div class="smini">
      <div class="nm">Bradykinésie</div>
      <div class="av" style="color:#eab308">${avg(bradykinesia)}</div>
      <div class="rng">min ${minVal(bradykinesia)} — max ${maxVal(bradykinesia)}</div>
    </div>
    <div class="smini">
      <div class="nm">Démarche</div>
      <div class="av" style="color:#22c55e">${avg(gait)}</div>
      <div class="rng">min ${minVal(gait)} — max ${maxVal(gait)}</div>
    </div>
    <div class="smini">
      <div class="nm">Équilibre</div>
      <div class="av" style="color:#3b82f6">${avg(balance)}</div>
      <div class="rng">min ${minVal(balance)} — max ${maxVal(balance)}</div>
    </div>
  </div>

  <!-- ── Tremor Evolution Chart (full width) ── -->
  <div class="chart-full">
    <div class="ch-title">Évolution du tremblement par session</div>
    <canvas id="tremorChart" height="80"></canvas>
  </div>

  <!-- ── All Scores + Severity Doughnut ── -->
  <div class="charts-2">
    <div class="chart-card">
      <div class="ch-title">Évolution de tous les scores moteurs</div>
      <canvas id="allScoresChart" height="200"></canvas>
    </div>
    <div class="chart-card">
      <div class="ch-title">Répartition des sévérités</div>
      <canvas id="severityChart" height="200"></canvas>
    </div>
  </div>

  <!-- ── Sessions Table ── -->
  <div class="tbl-wrap">
    <div class="ch-title">Détail des sessions (20 dernières)</div>
    <table>
      <thead>
        <tr>
          <th>Date</th><th>Heure</th><th>Trembl.</th><th>Rigidité</th>
          <th>Bradyk.</th><th>Démarche</th><th>Équilibre</th>
          <th>Sévérité</th><th>Confiance</th><th>Alerte</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </div>

  <footer>
    Rapport généré automatiquement par le système de surveillance Parkinson-IA · ${reportDate}<br>
    Ce document est à usage médical confidentiel.
  </footer>

</div><!-- .page -->

<script>
  const LABELS = ${j(labels)};
  const T = ${j(tremor)};
  const R = ${j(rigidity)};
  const B = ${j(bradykinesia)};
  const G = ${j(gait)};
  const E = ${j(balance)};
  const SEV_L = ${j(sevLabels)};
  const SEV_D = ${j(sevData)};
  const SEV_C = ${j(sevColors)};

  const line = (label, data, color) => ({
    label, data,
    borderColor: color,
    backgroundColor: color + '18',
    pointBackgroundColor: color,
    pointRadius: 4, pointHoverRadius: 6,
    borderWidth: 2, tension: 0.35, fill: true,
  });

  const yAxis = { min: 0, max: 3, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } };
  const xAxis = { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } };

  // Tremor evolution
  new Chart(document.getElementById('tremorChart'), {
    type: 'line',
    data: { labels: LABELS, datasets: [line('Tremblement', T, '#ef4444')] },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { ...yAxis, title: { display: true, text: 'Score (0–3)', color: '#64748b', font: { size: 11 } } },
        x: xAxis,
      },
    },
  });

  // All scores evolution
  new Chart(document.getElementById('allScoresChart'), {
    type: 'line',
    data: {
      labels: LABELS,
      datasets: [
        line('Tremblement',  T, '#ef4444'),
        line('Rigidité',     R, '#f97316'),
        line('Bradykinésie', B, '#eab308'),
        line('Démarche',     G, '#22c55e'),
        line('Équilibre',    E, '#3b82f6'),
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
      scales: { y: yAxis, x: xAxis },
    },
  });

  // Severity doughnut
  new Chart(document.getElementById('severityChart'), {
    type: 'doughnut',
    data: {
      labels: SEV_L,
      datasets: [{ data: SEV_D, backgroundColor: SEV_C, borderWidth: 2, borderColor: '#fff' }],
    },
    options: {
      responsive: true,
      cutout: '60%',
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
    },
  });
</script>
</body>
</html>`;
};

module.exports = { generateReport };
