const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const ANALYSES_COLLECTION = process.env.FIRESTORE_COLLECTION || 'parkinson_analyses';
const REPORTS_COLLECTION  = 'parkinson_reports';

/**
 * Save one analysis record to Firestore.
 * @param {object} analysis - The Gemini analysis result
 * @returns {string} Firestore document ID
 */
const saveAnalysis = async (analysis) => {
  const entry = {
    ...analysis,
    timestamp:  analysis.timestamp || new Date().toISOString(),
    savedAt:    Firestore.Timestamp.now(),
  };
  const docRef = await db.collection(ANALYSES_COLLECTION).add(entry);
  return docRef.id;
};

/**
 * Retrieve all analysis records from Firestore (newest first).
 * @returns {Array}
 */
const getAnalysesFromCloud = async () => {
  const snapshot = await db
    .collection(ANALYSES_COLLECTION)
    .orderBy('savedAt', 'desc')
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Save report metadata to Firestore.
 * @param {string} filename
 * @param {number} totalSessions
 * @returns {string} Firestore document ID
 */
const saveReportMetadata = async (filename, totalSessions) => {
  const entry = {
    filename,
    totalSessions,
    type:        'html_report',
    generatedAt: Firestore.Timestamp.now(),
  };
  const docRef = await db.collection(REPORTS_COLLECTION).add(entry);
  return docRef.id;
};

/**
 * Sync an array of local records to Firestore (bulk write).
 * @param {Array} records
 * @returns {number} Number of documents written
 */
const bulkSyncAnalyses = async (records) => {
  const batch = db.batch();
  records.forEach((record) => {
    const ref = db.collection(ANALYSES_COLLECTION).doc();
    batch.set(ref, {
      ...record,
      savedAt: Firestore.Timestamp.now(),
    });
  });
  await batch.commit();
  return records.length;
};

module.exports = {
  saveAnalysis,
  getAnalysesFromCloud,
  saveReportMetadata,
  bulkSyncAnalyses,
};
