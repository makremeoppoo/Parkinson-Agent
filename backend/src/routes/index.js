const express    = require('express');
const router     = express.Router();
const controller = require('../controller/analysisController');

let routes = (app) => {

  // Analyse une frame caméra — retourne scores + voice_message TTS, saves to Firestore
  router.post('/analyze-frame', controller.analyzeFrame);

  // Return all Firestore analysis records as JSON
  router.get('/results', controller.listResults);

  // Download all Firestore analysis records as CSV
  router.get('/results/export', controller.exportCsv);

  // HTML medical report with Chart.js charts (Firestore data)
  router.get('/results/report', controller.getReport);

  // Generate HTML report + save metadata to Firestore via ADK Runner
  router.post('/results/save-report-cloud', controller.saveReportCloud);

  // Fetch all analysis records stored in Firestore via ADK Runner
  router.get('/results/cloud', controller.getCloudResults);

  app.use(router);
};

module.exports = routes;
