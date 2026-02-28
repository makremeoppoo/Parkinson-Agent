const geminiService               = require('../services/geminiService');
const { logResult, getResults, getCsv } = require('../utils/dataLogger');
const { generateReport }          = require('../utils/reportGenerator');
const { saveAnalysis }            = require('../services/firestoreService');
const { runTask }                 = require('../services/adkAgent');

// ── Local analysis ────────────────────────────────────────────────────────────

/**
 * POST /analyze-frame
 * Body: { frame: "<base64>", mimeType: "video/webm", currentLang: "en" }
 *
 * Analyses the frame with Gemini, persists locally AND fire-and-forgets
 * a Firestore save via the ADK-backed firestoreService.
 */
const analyzeFrame = async (req, res) => {
  try {
    const { frame, mimeType, currentLang } = req.body;

    if (!frame) {
      return res.status(400).send({ message: 'Aucune frame fournie.' });
    }

    const analysis = await geminiService.analyzeFrame(
      currentLang || 'en',
      frame,
      mimeType || 'video/webm'
    );

    // Persist locally (JSON + CSV)
    logResult(analysis);

    // Persist to Firestore – non-blocking (fire-and-forget)
    saveAnalysis({ ...analysis, timestamp: new Date().toISOString() })
      .then((docId) => console.log(`[Firestore] Analysis saved – doc: ${docId}`))
      .catch((err)  => console.warn('[Firestore] Save failed (non-blocking):', err.message));

    res.status(200).send({ data: analysis });
  } catch (err) {
    console.error('[analyzeFrame]', err);
    res.status(500).send({ message: `Analyse échouée : ${err.message}` });
  }
};

// ── Local read endpoints ──────────────────────────────────────────────────────

/**
 * GET /results
 * Returns all locally-saved analysis records as JSON.
 */
const listResults = (_req, res) => {
  res.status(200).json(getResults());
};

/**
 * GET /results/export
 * Returns all locally-saved analysis records as a downloadable CSV file.
 */
const exportCsv = (_req, res) => {
  const csv = getCsv();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="results.csv"');
  res.status(200).send(csv);
};

/**
 * GET /results/report
 * Returns a self-contained HTML medical report with Chart.js charts.
 */
const getReport = (_req, res) => {
  const html = generateReport();
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
};

// ── Cloud endpoints (ADK Runner + Firestore) ──────────────────────────────────

/**
 * POST /results/save-report-cloud
 * Uses the ADK Runner to generate the HTML report and save its metadata to Firestore.
 * Also returns the HTML so the client can display / download it.
 */
const saveReportCloud = async (req, res) => {
  try {
    const filename = `rapport-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;

    const agentResponse = await runTask(
      `Save the medical report to Firestore with filename: ${filename}`
    );

    // The tool's execute() returns { html, filename, ... } embedded in the agent response.
    // We also regenerate the HTML here so it can be sent back to the client.
    const html = generateReport();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Cloud-Filename', filename);
    res.status(200).send(html);
  } catch (err) {
    console.error('[saveReportCloud]', err);
    res.status(500).json({ message: `Sauvegarde cloud échouée : ${err.message}` });
  }
};

/**
 * POST /results/sync-cloud
 * Uses the ADK Runner to bulk-sync all local results.json records to Firestore.
 */
const syncToCloud = async (req, res) => {
  try {
    const agentResponse = await runTask(
      'Sync all local Parkinson analysis records to Firestore using sync_local_records.'
    );

    res.status(200).json({
      message:       'Synchronisation Firestore terminée',
      agentResponse,
      localCount:    getResults().length,
    });
  } catch (err) {
    console.error('[syncToCloud]', err);
    res.status(500).json({ message: `Synchronisation échouée : ${err.message}` });
  }
};

/**
 * GET /results/cloud
 * Uses the ADK Runner to fetch all analysis records stored in Firestore.
 */
const getCloudResults = async (_req, res) => {
  try {
    const agentResponse = await runTask(
      'Fetch all Parkinson analysis records from Firestore using get_cloud_analyses.'
    );

    res.status(200).json({ agentResponse });
  } catch (err) {
    console.error('[getCloudResults]', err);
    res.status(500).json({ message: `Lecture cloud échouée : ${err.message}` });
  }
};

module.exports = {
  analyzeFrame,
  listResults,
  exportCsv,
  getReport,
  saveReportCloud,
  syncToCloud,
  getCloudResults,
};
