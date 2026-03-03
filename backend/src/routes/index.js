const express         = require('express');
const router          = express.Router();
const controller      = require('../controller/analysisController');
const { verifyToken } = require('../middleware/auth');

let routes = (app) => {

  // ── Doctor-authenticated routes ───────────────────────────────────────────
  router.post('/analyze-frame',             verifyToken, controller.analyzeFrame);
  router.get('/results',                    verifyToken, controller.listResults);
  router.get('/results/export',             verifyToken, controller.exportCsv);
  router.get('/results/report',             verifyToken, controller.getReport);
  router.post('/results/save-report-cloud', verifyToken, controller.saveReportCloud);
  router.get('/results/cloud',              verifyToken, controller.getCloudResults);

  // Doctor patient management (authenticated)
  router.get('/patients',                  verifyToken, controller.listPatientsHandler);
  router.get('/patients/:code',            verifyToken, controller.getPatientHandler);
  router.get('/patients/:code/analyses',   verifyToken, controller.listPatientAnalysesHandler);
  router.post('/patients',                 verifyToken, controller.createPatientHandler);

  // ── Public patient-link routes (no Firebase auth — token in URL/body) ─────
  router.get('/patient-session/:token',           controller.validatePatientSession);
  router.post('/patient-analyze',                 controller.patientAnalyzeHandler);
  router.get('/patient-session/:token/analyses',  controller.getPatientSessionAnalyses);
  router.get('/patient-session/:token/report',    controller.getPatientSessionReport);

  app.use(router);
};

module.exports = routes;
