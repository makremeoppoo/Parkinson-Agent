const { Firestore } = require('@google-cloud/firestore');
const crypto        = require('crypto');

const db = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// ── Collection helpers ────────────────────────────────────────────────────────

/**
 * Returns the analyses subcollection for a specific user.
 * Path: users/{userId}/analyses
 */
const analysesCol = (userId) =>
  db.collection('users').doc(userId).collection('analyses');

/**
 * Returns the reports subcollection for a specific user.
 * Path: users/{userId}/reports
 */
const reportsCol = (userId) =>
  db.collection('users').doc(userId).collection('reports');

// ── Analyses ──────────────────────────────────────────────────────────────────

/**
 * Save one analysis record under the user's subcollection.
 * @param {object} analysis
 * @param {string} userId - Firebase UID
 * @returns {string} Firestore document ID
 */
const saveAnalysis = async (analysis, userId) => {
  const entry = {
    ...analysis,
    userId,
    timestamp: analysis.timestamp || new Date().toISOString(),
    savedAt:   Firestore.Timestamp.now(),
  };
  const docRef = await analysesCol(userId).add(entry);
  return docRef.id;
};

/**
 * Retrieve all analysis records for a user (newest first).
 * @param {string} userId
 * @returns {Array}
 */
const getAnalysesFromCloud = async (userId) => {
  const snapshot = await analysesCol(userId)
    .orderBy('savedAt', 'desc')
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// ── Reports ───────────────────────────────────────────────────────────────────

/**
 * Save report metadata under the user's subcollection.
 * @param {string} filename
 * @param {number} totalSessions
 * @param {string} userId
 * @returns {string} Firestore document ID
 */
const saveReportMetadata = async (filename, totalSessions, userId) => {
  const entry = {
    filename,
    totalSessions,
    userId,
    type:        'html_report',
    generatedAt: Firestore.Timestamp.now(),
  };
  const docRef = await reportsCol(userId).add(entry);
  return docRef.id;
};

// ── Bulk sync ─────────────────────────────────────────────────────────────────

/**
 * Bulk-write an array of records into the user's analyses subcollection.
 * @param {Array}  records
 * @param {string} userId
 * @returns {number}
 */
const bulkSyncAnalyses = async (records, userId) => {
  const batch = db.batch();
  records.forEach((record) => {
    const ref = analysesCol(userId).doc();
    batch.set(ref, {
      ...record,
      userId,
      savedAt: Firestore.Timestamp.now(),
    });
  });
  await batch.commit();
  return records.length;
};

// ── CSV export ────────────────────────────────────────────────────────────────

const CSV_HEADERS = [
  'timestamp',
  'overall_severity',
  'confidence_score',
  'tremor_score',
  'rigidity_score',
  'bradykinesia_score',
  'gait_score',
  'balance_score',
  'needs_alert',
  'observations',
  'recommendation',
  'alert_message',
  'voice_message',
];

const csvEscape = (val) => {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
};

/**
 * Fetch all analyses for a user and return as a CSV string.
 * @param {string} userId
 * @returns {Promise<string>}
 */
const getCsvString = async (userId) => {
  const records = await getAnalysesFromCloud(userId);
  const rows = records.map((r) =>
    CSV_HEADERS.map((h) => csvEscape(r[h])).join(',')
  );
  return [CSV_HEADERS.join(','), ...rows].join('\n') + '\n';
};

// ── Doctor / Patient helpers ───────────────────────────────────────────────────

/**
 * Returns the patients subcollection for a specific doctor.
 * Path: doctors/{doctorId}/patients
 */
const patientsCol = (doctorId) =>
  db.collection('doctors').doc(doctorId).collection('patients');

/**
 * Returns the analyses subcollection for a doctor's patient.
 * Path: doctors/{doctorId}/patients/{patientCode}/analyses
 */
const patientAnalysesCol = (doctorId, patientCode) =>
  patientsCol(doctorId).doc(patientCode).collection('analyses');

/**
 * Ensure a patient has a linkToken; generate + persist one if missing.
 * Must be defined before getPatient and listPatients.
 */
const ensureLinkToken = async (doctorId, patientCode, existingData) => {
  if (existingData.linkToken) return existingData;
  const linkToken = crypto.randomBytes(24).toString('hex');
  await patientsCol(doctorId).doc(patientCode).update({ linkToken });
  await db.collection('patientTokens').doc(linkToken).set({ doctorId, patientCode });
  return { ...existingData, linkToken };
};

/**
 * Look up a patient by code under the given doctor.
 * @param {string} doctorId
 * @param {string} patientCode
 * @returns {object|null} patient data or null if not found
 */
const getPatient = async (doctorId, patientCode) => {
  const doc = await patientsCol(doctorId).doc(patientCode).get();
  if (!doc.exists) return null;
  const data = { code: doc.id, ...doc.data() };
  return ensureLinkToken(doctorId, patientCode, data);
};

/**
 * Create a new patient record under the given doctor.
 * Generates a unique linkToken and writes a reverse-lookup entry.
 * @param {string} doctorId
 * @param {string} patientCode
 * @returns {object} created patient data (includes linkToken)
 */
const createPatient = async (doctorId, patientCode) => {
  const linkToken = crypto.randomBytes(24).toString('hex'); // 48-char hex token
  const data = {
    code:        patientCode,
    doctorId,
    linkToken,
    createdAt:   new Date().toISOString(),
    createdAtTs: Firestore.Timestamp.now(),
  };
  // Patient record
  await patientsCol(doctorId).doc(patientCode).set(data);
  // Reverse lookup: patientTokens/{linkToken} → { doctorId, patientCode }
  await db.collection('patientTokens').doc(linkToken).set({ doctorId, patientCode });
  return data;
};

/**
 * Look up doctor + patientCode by a link token.
 * @param {string} linkToken
 * @returns {{ doctorId, patientCode }|null}
 */
const getPatientByToken = async (linkToken) => {
  const doc = await db.collection('patientTokens').doc(linkToken).get();
  if (!doc.exists) return null;
  return doc.data();
};

/**
 * List all patients for a doctor (newest first).
 * Backfills linkToken for any legacy patients that are missing it.
 * @param {string} doctorId
 * @returns {Array}
 */
const listPatients = async (doctorId) => {
  // No orderBy — avoids Firestore index requirements on the subcollection.
  // We sort in memory by createdAt (ISO string) instead.
  const snapshot = await patientsCol(doctorId).get();
  const results  = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const data = { id: doc.id, ...doc.data() };
      return ensureLinkToken(doctorId, doc.id, data);
    })
  );
  // Newest first
  return results.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
};

/**
 * Save an analysis for a patient (doctor context).
 * @param {object} analysis
 * @param {string} doctorId
 * @param {string} patientCode
 * @returns {string} Firestore document ID
 */
const savePatientAnalysis = async (analysis, doctorId, patientCode) => {
  const entry = {
    ...analysis,
    doctorId,
    patientCode,
    timestamp: analysis.timestamp || new Date().toISOString(),
    savedAt:   Firestore.Timestamp.now(),
  };
  const docRef = await patientAnalysesCol(doctorId, patientCode).add(entry);
  return docRef.id;
};

/**
 * Retrieve all analysis records for a patient (newest first).
 * @param {string} doctorId
 * @param {string} patientCode
 * @returns {Array}
 */
const getPatientAnalyses = async (doctorId, patientCode) => {
  const snapshot = await patientAnalysesCol(doctorId, patientCode)
    .orderBy('savedAt', 'desc')
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

module.exports = {
  saveAnalysis,
  getAnalysesFromCloud,
  saveReportMetadata,
  bulkSyncAnalyses,
  getCsvString,
  // patient helpers
  getPatient,
  createPatient,
  savePatientAnalysis,
  getPatientAnalyses,
  getPatientByToken,
  listPatients,
};
