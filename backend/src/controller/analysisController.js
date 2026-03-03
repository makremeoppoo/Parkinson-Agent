const geminiService      = require('../services/geminiService');
const { generateReport } = require('../utils/reportGenerator');
const {
  saveAnalysis,
  getAnalysesFromCloud,
  getCsvString,
  saveReportMetadata,
  getPatient,
  createPatient,
  savePatientAnalysis,
  getPatientAnalyses,
  getPatientByToken,
  listPatients,
} = require('../services/firestoreService');
const { runTask } = require('../services/adkAgent');

// ── Analysis ──────────────────────────────────────────────────────────────────

/**
 * POST /analyze-frame
 * Body: { frame: "<base64>", mimeType: "video/webm", currentLang: "en" }
 */
const analyzeFrame = async (req, res) => {
  try {
    const { frame, mimeType, currentLang, patientCode } = req.body;
    const { uid } = req.user;

    if (!frame) {
      return res.status(400).send({ message: 'No frame provided.' });
    }

    const analysis = await geminiService.analyzeFrame(
      currentLang || 'en',
      frame,
      mimeType || 'video/webm'
    );

    const record = { ...analysis, timestamp: new Date().toISOString() };

    if (patientCode) {
      // Doctor context: store under doctors/{uid}/patients/{patientCode}/analyses
      savePatientAnalysis(record, uid, patientCode)
        .then((docId) => console.log(`[Firestore] Patient analysis saved – doc: ${docId} doctor: ${uid} patient: ${patientCode}`))
        .catch((err)  => console.warn('[Firestore] Patient save failed (non-blocking):', err.message));
    } else {
      // Regular user: store under users/{uid}/analyses
      saveAnalysis(record, uid)
        .then((docId) => console.log(`[Firestore] Analysis saved – doc: ${docId} user: ${uid}`))
        .catch((err)  => console.warn('[Firestore] Save failed (non-blocking):', err.message));
    }

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
    const { uid }        = req.user;
    const { patientCode } = req.query;

    const records = patientCode
      ? await getPatientAnalyses(uid, patientCode)
      : await getAnalysesFromCloud(uid);

    const html = generateReport(records);
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

// ── Patient endpoints ─────────────────────────────────────────────────────────

/**
 * GET /patients/:code
 * Returns the patient document if it exists under this doctor, 404 otherwise.
 */
const getPatientHandler = async (req, res) => {
  try {
    const { uid }  = req.user;
    const { code } = req.params;
    const patient  = await getPatient(uid, code);
    if (!patient) return res.status(404).json({ message: 'Patient not found.' });
    res.status(200).json(patient);
  } catch (err) {
    console.error('[getPatient]', err);
    res.status(500).json({ message: `Lookup failed: ${err.message}` });
  }
};

/**
 * POST /patients
 * Body: { code: string }
 * Creates a new patient under this doctor.
 */
const createPatientHandler = async (req, res) => {
  try {
    const { uid }  = req.user;
    const { code } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ message: 'Patient code is required.' });
    }
    const existing = await getPatient(uid, code.trim());
    if (existing) return res.status(200).json(existing);        // idempotent
    const patient = await createPatient(uid, code.trim());
    res.status(201).json(patient);
  } catch (err) {
    console.error('[createPatient]', err);
    res.status(500).json({ message: `Create failed: ${err.message}` });
  }
};

// ── Doctor: patient analyses list ─────────────────────────────────────────────

/**
 * GET /patients/:code/analyses
 * Returns all analyses for a specific patient of the authenticated doctor.
 */
const listPatientAnalysesHandler = async (req, res) => {
  try {
    const { uid }  = req.user;
    const { code } = req.params;
    const records  = await getPatientAnalyses(uid, code);
    res.status(200).json(records);
  } catch (err) {
    console.error('[listPatientAnalyses]', err);
    res.status(500).json({ message: err.message });
  }
};

// ── Doctor: list patients ─────────────────────────────────────────────────────

/**
 * GET /patients
 * Returns all patients belonging to the authenticated doctor.
 */
const listPatientsHandler = async (req, res) => {
  try {
    const { uid } = req.user;
    const patients = await listPatients(uid);
    res.status(200).json(patients);
  } catch (err) {
    console.error('[listPatients]', err);
    res.status(500).json({ message: `List failed: ${err.message}` });
  }
};

// ── Public patient-link endpoints ─────────────────────────────────────────────

/**
 * Helper: resolve a link token → { doctorId, patientCode } or 404.
 */
const resolveToken = async (res, linkToken) => {
  const ctx = await getPatientByToken(linkToken);
  if (!ctx) { res.status(404).json({ message: 'Invalid or expired patient link.' }); return null; }
  return ctx;
};

/**
 * GET /patient-session/:token
 * Validates a patient link token and returns { patientCode, doctorId }.
 * Public — no Firebase auth required.
 */
const validatePatientSession = async (req, res) => {
  try {
    const ctx = await resolveToken(res, req.params.token);
    if (!ctx) return;
    res.status(200).json({ patientCode: ctx.patientCode, doctorId: ctx.doctorId });
  } catch (err) {
    console.error('[validatePatientSession]', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /patient-analyze
 * Body: { frame, mimeType, currentLang, patientLinkToken }
 * Public — authenticated by link token instead of Firebase JWT.
 */
const patientAnalyzeHandler = async (req, res) => {
  try {
    const { frame, mimeType, currentLang, patientLinkToken } = req.body;
    if (!frame)            return res.status(400).json({ message: 'No frame provided.' });
    if (!patientLinkToken) return res.status(400).json({ message: 'No patient link token.' });

    const ctx = await resolveToken(res, patientLinkToken);
    if (!ctx) return;

    const analysis = await geminiService.analyzeFrame(
      currentLang || 'en',
      frame,
      mimeType || 'video/webm'
    );

    const record = { ...analysis, timestamp: new Date().toISOString() };
    savePatientAnalysis(record, ctx.doctorId, ctx.patientCode)
      .then((id) => console.log(`[Firestore] Patient analysis saved – ${id}`))
      .catch((err) => console.warn('[Firestore] Patient save failed:', err.message));

    res.status(200).json({ data: analysis });
  } catch (err) {
    console.error('[patientAnalyze]', err);
    res.status(500).json({ message: `Analysis failed: ${err.message}` });
  }
};

/**
 * GET /patient-session/:token/analyses
 * Returns all analyses for the patient identified by the link token.
 * Public — no Firebase auth required.
 */
const getPatientSessionAnalyses = async (req, res) => {
  try {
    const ctx = await resolveToken(res, req.params.token);
    if (!ctx) return;
    const records = await getPatientAnalyses(ctx.doctorId, ctx.patientCode);
    res.status(200).json(records);
  } catch (err) {
    console.error('[getPatientSessionAnalyses]', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /patient-session/:token/report
 * Returns the HTML report for the patient identified by the link token.
 * Public — no Firebase auth required.
 */
const getPatientSessionReport = async (req, res) => {
  try {
    const ctx = await resolveToken(res, req.params.token);
    if (!ctx) return;
    const records = await getPatientAnalyses(ctx.doctorId, ctx.patientCode);
    const html    = generateReport(records);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (err) {
    console.error('[getPatientSessionReport]', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  analyzeFrame,
  listResults,
  exportCsv,
  getReport,
  saveReportCloud,
  getCloudResults,
  getPatientHandler,
  createPatientHandler,
  listPatientsHandler,
  listPatientAnalysesHandler,
  validatePatientSession,
  patientAnalyzeHandler,
  getPatientSessionAnalyses,
  getPatientSessionReport,
};
