const fs   = require('fs');
const path = require('path');

const DATA_DIR  = path.join(__dirname, '../../data');
const JSON_FILE = path.join(DATA_DIR, 'results.json');
const CSV_FILE  = path.join(DATA_DIR, 'results.csv');

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

// Ensure /data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Init CSV with headers if the file is new
if (!fs.existsSync(CSV_FILE)) {
  fs.writeFileSync(CSV_FILE, CSV_HEADERS.join(',') + '\n', 'utf8');
}

/**
 * Escape a value for CSV (wrap in quotes if it contains comma/newline/quote).
 */
const csvEscape = (val) => {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
};

/**
 * Append one analysis result to results.json and results.csv.
 * @param {object} analysis  - The Gemini analysis object
 */
const logResult = (analysis) => {
  const entry = {
    timestamp: new Date().toISOString(),
    ...analysis,
  };

  // ── JSON ──────────────────────────────────────────────────────────────────
  let records = [];
  if (fs.existsSync(JSON_FILE)) {
    try {
      records = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
    } catch {
      records = [];
    }
  }
  records.push(entry);
  fs.writeFileSync(JSON_FILE, JSON.stringify(records, null, 2), 'utf8');

  // ── CSV ───────────────────────────────────────────────────────────────────
  const row = CSV_HEADERS.map((h) => csvEscape(entry[h])).join(',') + '\n';
  fs.appendFileSync(CSV_FILE, row, 'utf8');
};

/**
 * Return all saved results as a JS array.
 */
const getResults = () => {
  if (!fs.existsSync(JSON_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
  } catch {
    return [];
  }
};

/**
 * Return the raw CSV string.
 */
const getCsv = () => {
  if (!fs.existsSync(CSV_FILE)) return CSV_HEADERS.join(',') + '\n';
  return fs.readFileSync(CSV_FILE, 'utf8');
};

module.exports = { logResult, getResults, getCsv };
