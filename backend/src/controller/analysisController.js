const geminiService = require('../services/geminiService');
const { logResult, getResults, getCsv } = require('../utils/dataLogger');
const { generateReport } = require('../utils/reportGenerator');

/**
 * POST /analyze-frame
 * Body: { frame: "<base64>", mimeType: "video/webm", currentLang: "en" }
 */
const analyzeFrame = async (req, res) => {
  try {
    const { frame, mimeType, currentLang } = req.body;

    if (!frame) {
      return res.status(400).send({ message: "Aucune frame fournie." });
    }

    const analysis = await geminiService.analyzeFrame(
      currentLang || 'en',
      frame,
      mimeType || 'video/webm'
    );

    logResult(analysis);

    res.status(200).send({ data: analysis });
  } catch (err) {
    console.error('[analyzeFrame]', err);
    res.status(500).send({ message: `Analyse échouée : ${err.message}` });
  }
};

/**
 * GET /results
 * Returns all saved analysis records as JSON.
 */
const listResults = (_req, res) => {
  res.status(200).json(getResults());
};

/**
 * GET /results/export
 * Returns all saved analysis records as a downloadable CSV file.
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

module.exports = { analyzeFrame, listResults, exportCsv, getReport };
