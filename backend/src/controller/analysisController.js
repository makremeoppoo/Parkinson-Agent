const geminiService      = require('../services/geminiService');
const { generateReport } = require('../utils/reportGenerator');
const {
  saveAnalysis,
  getAnalysesFromCloud,
  getCsvString,
  saveReportMetadata,
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
    const { uid } = req.user;

    if (!frame) {
      return res.status(400).send({ message: 'No frame provided.' });
    }

    const analysis = await geminiService.analyzeFrame(
      currentLang || 'en',
      frame,
      mimeType || 'video/webm'
    );

    // Persist to Firestore scoped to this user
    saveAnalysis({ ...analysis, timestamp: new Date().toISOString() }, uid)
      .then((docId) => console.log(`[Firestore] Analysis saved – doc: ${docId} user: ${uid}`))
      .catch((err)  => console.warn('[Firestore] Save failed (non-blocking):', err.message));

    res.status(200).send({ data: analysis });
  } catch (err) {
    console.error('[analyzeFrame]', err);
    res.status(500).send({ message: `Analysis failed: ${err.message}` });
  }
};

// ── Read endpoints ─────────────────────────────────────────────────────────────

/**
 * GET /results
 * Returns all Firestore analysis records for the authenticated user as JSON.
 */
const listResults = async (req, res) => {
  try {
    const { uid } = req.user;
    const records = await getAnalysesFromCloud(uid);
    res.status(200).json(records);
  } catch (err) {
    console.error('[listResults]', err);
    res.status(500).json({ message: `Read failed: ${err.message}` });
  }
};

/**
 * GET /results/export
 * Returns all Firestore analysis records for the user as a downloadable CSV.
 */
const exportCsv = async (req, res) => {
  try {
    const { uid } = req.user;
    const csv = await getCsvString(uid);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="results.csv"');
    res.status(200).send(csv);
  } catch (err) {
    console.error('[exportCsv]', err);
    res.status(500).json({ message: `Export failed: ${err.message}` });
  }
};

/**
 * GET /results/report
 * Returns a self-contained HTML medical report with Chart.js charts.
 */
const getReport = async (req, res) => {
  try {
    const { uid } = req.user;
    const records = await getAnalysesFromCloud(uid);
    const html    = generateReport(records);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (err) {
    console.error('[getReport]', err);
    res.status(500).json({ message: `Report failed: ${err.message}` });
  }
};

// ── Cloud endpoints (ADK Runner + Firestore) ──────────────────────────────────

/**
 * POST /results/save-report-cloud
 * Generates the HTML report, saves metadata to Firestore, returns HTML.
 */
const saveReportCloud = async (req, res) => {
  try {
    const { uid } = req.user;
    const filename = `report-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;

    await runTask(
      `Save the medical report to Firestore with filename: ${filename}`,
      uid
    );

    const records = await getAnalysesFromCloud(uid);
    const html    = generateReport(records);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Cloud-Filename', filename);
    res.status(200).send(html);
  } catch (err) {
    console.error('[saveReportCloud]', err);
    res.status(500).json({ message: `Cloud save failed: ${err.message}` });
  }
};

/**
 * GET /results/cloud
 * Uses the ADK Runner to fetch all analysis records for the user from Firestore.
 */
const getCloudResults = async (req, res) => {
  try {
    const { uid } = req.user;
    const agentResponse = await runTask(
      'Fetch all Parkinson analysis records from Firestore using get_cloud_analyses.',
      uid
    );
    res.status(200).json({ agentResponse });
  } catch (err) {
    console.error('[getCloudResults]', err);
    res.status(500).json({ message: `Cloud read failed: ${err.message}` });
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
