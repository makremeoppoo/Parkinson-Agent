const express        = require('express');
const router         = express.Router();
const controller     = require('../controller/analysisController');
const { verifyToken } = require('../middleware/auth');

let routes = (app) => {

  // All routes require a valid Firebase ID token
  router.post('/analyze-frame',          verifyToken, controller.analyzeFrame);
  router.get('/results',                 verifyToken, controller.listResults);
  router.get('/results/export',          verifyToken, controller.exportCsv);
  router.get('/results/report',          verifyToken, controller.getReport);
  router.post('/results/save-report-cloud', verifyToken, controller.saveReportCloud);
  router.get('/results/cloud',           verifyToken, controller.getCloudResults);

  app.use(router);
};

module.exports = routes;
