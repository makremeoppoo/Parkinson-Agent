const express = require("express");
const router = express.Router();
const controller = require("../controller/analysisController");

let routes = (app) => {
  // Analyse une frame caméra — retourne scores + voice_message TTS
  router.post("/analyze-frame", controller.analyzeFrame);

  // Return all saved analysis records as JSON
  router.get("/results", controller.listResults);

  // Download all saved analysis records as CSV
  router.get("/results/export", controller.exportCsv);

  // HTML medical report with Chart.js charts
  router.get("/results/report", controller.getReport);

  app.use(router);
};

module.exports = routes;
