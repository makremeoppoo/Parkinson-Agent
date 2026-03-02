const { Firestore } = require('@google-cloud/firestore');

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

module.exports = {
  saveAnalysis,
  getAnalysesFromCloud,
  saveReportMetadata,
  bulkSyncAnalyses,
  getCsvString,
};
