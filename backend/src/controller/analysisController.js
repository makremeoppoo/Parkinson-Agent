const geminiService      = require('../services/geminiService');
const { generateReport } = require('../utils/reportGenerator');
const {
  saveAnalysis,
  getAnalysesFromCloud,
  getCsvString,
} = require('../services/firestoreService');
const { runTask } = require('../services/adkAgent');

// ── Analysis ──────────────────────────────────────────────────────────────────

/**
 * POST /analyze-frame
 * Body: { frame: "<base64>", mimeType: "video/webm", currentLang: "en" }
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

    // Persist to Firestore
    saveAnalysis({ ...analysis, timestamp: new Date().toISOString() })
      .then((docId) => console.log(`[Firestore] Analysis saved – doc: ${docId}`))
      .catch((err)  => console.warn('[Firestore] Save failed (non-blocking):', err.message));

    res.status(200).send({ data: analysis });
  } catch (err) {
    console.error('[analyzeFrame]', err);
    res.status(500).send({ message: `Analyse échouée : ${err.message}` });
  }
};

// ── Read endpoints ─────────────────────────────────────────────────────────────

/**
 * GET /results
 * Returns all Firestore analysis records as JSON.
 */
const listResults = async (_req, res) => {
  try {
    const records = await getAnalysesFromCloud();
    res.status(200).json(records);
  } catch (err) {
    console.error('[listResults]', err);
    res.status(500).json({ message: `Lecture échouée : ${err.message}` });
  }
};

/**
 * GET /results/export
 * Returns all Firestore analysis records as a downloadable CSV file.
 */
const exportCsv = async (_req, res) => {
  try {
    const csv = await getCsvString();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="results.csv"');
    res.status(200).send(csv);
  } catch (err) {
    console.error('[exportCsv]', err);
    res.status(500).json({ message: `Export échoué : ${err.message}` });
  }
};

/**
 * GET /results/report
 * Returns a self-contained HTML medical report with Chart.js charts.
 */
const getReport = async (_req, res) => {
  try {
    const records = await getAnalysesFromCloud();
    const html    = generateReport(records);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (err) {
    console.error('[getReport]', err);
    res.status(500).json({ message: `Rapport échoué : ${err.message}` });
  }
};

// ── Cloud endpoints (ADK Runner + Firestore) ──────────────────────────────────

/**
 * POST /results/save-report-cloud
 * Uses the ADK Runner to generate the HTML report and save its metadata to Firestore.
 */
const saveReportCloud = async (req, res) => {
  try {
    const filename = `rapport-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;

    await runTask(`Save the medical report to Firestore with filename: ${filename}`);

    const records = await getAnalysesFromCloud();
    const html    = generateReport(records);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Cloud-Filename', filename);
    res.status(200).send(html);
  } catch (err) {
    console.error('[saveReportCloud]', err);
    res.status(500).json({ message: `Sauvegarde cloud échouée : ${err.message}` });
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
  getCloudResults,
};
