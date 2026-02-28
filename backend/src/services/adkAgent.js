/**
 * adkAgent.js
 * ADK Runner + LlmAgent with Firestore tools for the Parkinson monitoring system.
 *
 * Tools exposed to the agent:
 *   1. save_analysis       – Save one analysis record to Firestore
 *   2. save_report         – Save report metadata to Firestore
 *   3. sync_local_records  – Bulk-sync all local JSON records to Firestore
 *   4. get_cloud_analyses  – Fetch all records stored in Firestore
 */

const { LlmAgent, Runner, InMemorySessionService } = require('@google/adk');

const {
  saveAnalysis,
  saveReportMetadata,
  getAnalysesFromCloud,
} = require('./firestoreService');
const { generateReport } = require('../utils/reportGenerator');

// ── Tool definitions ──────────────────────────────────────────────────────────

const saveAnalysisTool = {
  name: 'save_analysis',
  description: 'Saves a single Parkinson analysis result to Firestore.',
  parameters: {
    type: 'object',
    properties: {
      analysis: {
        type: 'object',
        description: 'The analysis object returned by Gemini.',
      },
    },
    required: ['analysis'],
  },
  execute: async ({ analysis }) => {
    const docId = await saveAnalysis(analysis);
    return { success: true, documentId: docId, collection: process.env.FIRESTORE_COLLECTION || 'parkinson_analyses' };
  },
};

const saveReportTool = {
  name: 'save_report',
  description: 'Generates the HTML medical report and saves its metadata to Firestore.',
  parameters: {
    type: 'object',
    properties: {
      filename: {
        type: 'string',
        description: 'Filename for the report, e.g. rapport-2026-02-27.html',
      },
    },
    required: ['filename'],
  },
  execute: async ({ filename }) => {
    const records = await getAnalysesFromCloud();
    const docId   = await saveReportMetadata(filename, records.length);
    const html    = generateReport(records);
    return {
      success:       true,
      documentId:    docId,
      filename,
      totalSessions: records.length,
      html,
    };
  },
};

const getCloudAnalysesTool = {
  name: 'get_cloud_analyses',
  description: 'Fetches all Parkinson analysis records stored in Firestore.',
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },
  execute: async () => {
    const records = await getAnalysesFromCloud();
    return { success: true, count: records.length, records };
  },
};

// ── Agent ─────────────────────────────────────────────────────────────────────

const parkinsontAgent = new LlmAgent({
  name:        'parkinson_cloud_agent',
  model:       process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  description: 'Medical data agent – saves Parkinson analyses and reports to Google Cloud Firestore.',
  instruction: `You are a medical data management agent for a Parkinson monitoring system.
Use your tools to:
- Save individual analysis results to Firestore with save_analysis.
- Generate and save HTML report metadata with save_report.
- Retrieve cloud records with get_cloud_analyses.
Always respond in JSON format with operation results.`,
  tools: [saveAnalysisTool, saveReportTool, getCloudAnalysesTool],
});

// ── Runner ────────────────────────────────────────────────────────────────────

const sessionService = new InMemorySessionService();

const runner = new Runner({
  agent:          parkinsontAgent,
  sessionService,
  appName:        'parkinson-agent',
});

// ── Helper: run one-shot task and return final text ───────────────────────────

/**
 * Run a single prompt through the ADK Runner and resolve when the agent responds.
 * @param {string} prompt
 * @returns {Promise<string>} Final text response from the agent
 */
const runTask = async (prompt) => {
  const session = await sessionService.createSession({
    appName: 'parkinson-agent',
    userId:  'system',
  });

  const events = runner.run({
    sessionId:  session.id,
    userId:     'system',
    appName:    'parkinson-agent',
    newMessage: {
      role:  'user',
      parts: [{ text: prompt }],
    },
  });

  let finalText = '';
  for await (const event of events) {
    if (event.isFinalResponse?.()) {
      finalText = event.content?.parts?.[0]?.text || JSON.stringify(event.content);
      break;
    }
  }
  return finalText;
};

module.exports = { runner, parkinsontAgent, runTask };
