/**
 * adkAgent.js
 * ADK Runner + LlmAgent with Firestore tools for the Parkinson monitoring system.
 *
 * Tools exposed to the agent:
 *   1. save_analysis       – Save one analysis record to Firestore
 *   2. save_report         – Save report metadata to Firestore
 *   3. get_cloud_analyses  – Fetch all records for the user from Firestore
 */

const { LlmAgent, Runner, InMemorySessionService } = require('@google/adk');

const {
  saveAnalysis,
  saveReportMetadata,
  getAnalysesFromCloud,
} = require('./firestoreService');
const { generateReport } = require('../utils/reportGenerator');

// ── Tool factory (creates tools bound to a specific userId) ───────────────────

const makeTools = (userId) => {
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
      const docId = await saveAnalysis(analysis, userId);
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
          description: 'Filename for the report, e.g. report-2026-02-27.html',
        },
      },
      required: ['filename'],
    },
    execute: async ({ filename }) => {
      const records = await getAnalysesFromCloud(userId);
      const docId   = await saveReportMetadata(filename, records.length, userId);
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
    description: 'Fetches all Parkinson analysis records for the user from Firestore.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    execute: async () => {
      const records = await getAnalysesFromCloud(userId);
      return { success: true, count: records.length, records };
    },
  };

  return [saveAnalysisTool, saveReportTool, getCloudAnalysesTool];
};

// ── Runner ────────────────────────────────────────────────────────────────────

const sessionService = new InMemorySessionService();

/**
 * Run a single prompt through the ADK Runner scoped to a userId.
 * @param {string} prompt
 * @param {string} userId - Firebase UID
 * @returns {Promise<string>} Final text response from the agent
 */
const runTask = async (prompt, userId) => {
  const agent = new LlmAgent({
    name:        'parkinson_cloud_agent',
    model:       process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    description: 'Medical data agent – saves Parkinson analyses and reports to Google Cloud Firestore.',
    instruction: `You are a medical data management agent for a Parkinson monitoring system.
Use your tools to:
- Save individual analysis results to Firestore with save_analysis.
- Generate and save HTML report metadata with save_report.
- Retrieve cloud records with get_cloud_analyses.
Always respond in JSON format with operation results.`,
    tools: makeTools(userId),
  });

  const runner = new Runner({
    agent,
    sessionService,
    appName: 'parkinson-agent',
  });

  const session = await sessionService.createSession({
    appName: 'parkinson-agent',
    userId,
  });

  const events = runner.run({
    sessionId:  session.id,
    userId,
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

module.exports = { runTask };
