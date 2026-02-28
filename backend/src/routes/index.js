const express    = require('express');
const router     = express.Router();
const controller = require('../controller/analysisController');

let routes = (app) => {

  // ── Local endpoints ─────────────────────────────────────────────────────────

  // Analyse une frame caméra — retourne scores + voice_message TTS
  // Also fire-and-forgets a Firestore save for each analysis
  router.post('/analyze-frame', controller.analyzeFrame);

  // Return all locally-saved analysis records as JSON
  router.get('/results', controller.listResults);

  // Download all locally-saved analysis records as CSV
  router.get('/results/export', controller.exportCsv);

  // HTML medical report with Chart.js charts (local data)
  router.get('/results/report', controller.getReport);

  // ── Cloud endpoints (ADK Runner + Firestore) ────────────────────────────────

  // Generate HTML report + save metadata to Firestore via ADK Runner
  router.post('/results/save-report-cloud', controller.saveReportCloud);

  // Bulk-sync all local results.json records to Firestore via ADK Runner
  router.post('/results/sync-cloud', controller.syncToCloud);

  // Fetch all analysis records stored in Firestore via ADK Runner
  router.get('/results/cloud', controller.getCloudResults);

  app.use(router);
};

module.exports = routes;
