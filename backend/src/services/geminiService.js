const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const getModel = () =>
  genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: { responseMimeType: "application/json" },
  });

// ── Prompt templates ──────────────────────────────────────────────────────────

const handsPrompt = (lang) => `
  You are a compassionate medical AI assistant specialized in Parkinson's disease motor symptom detection.
  Analyze this video frame captured from a patient's camera and return ONLY a JSON response.

  Focus on visible motor indicators — evaluate LEFT and RIGHT hands independently:
  1. TREMOR: Detect resting tremor in each hand/fingers separately (pill-rolling motion).
  2. RIGIDITY: Assess stiffness and reduced arm swing for each side.
  3. BRADYKINESIA: Look for slow or reduced movements in each hand.
  4. GAIT: If lower body visible, detect shuffling gait, festination, or freezing.
  5. BALANCE: Postural instability or asymmetry.
  For left_hand and right_hand: score each indicator 0–3 independently based on what is visible for that side.

  Scoring:
  - Each indicator scored 0 (absent) to 3 (severe).
  - "confidence_score": overall confidence in this analysis (0–100%).
  - "needs_alert": true if any indicator scores >= 2.
  - All text fields MUST be in ${lang}.

  For "voice_message":
  - Speak directly TO the patient using warm first-person address.
  - Acknowledge what was observed using simple, non-clinical language.
  - If severity is "None" or "Mild": explicitly say the patient is stable or doing well.
  - If severity is "Moderate" or "Severe": explicitly say they should contact their doctor.
  - Celebrate any effort or stability, no matter how small.
  - Length: 4–6 sentences, natural spoken language, uplifting and human tone.
  - MUST be entirely in ${lang}.
  - DO NOT use medical jargon.
  - DO NOT include explanations outside the JSON.

  Return ONLY this JSON structure:
  {
    "left_hand": {
      "tremor_score": 0,
      "rigidity_score": 0,
      "bradykinesia_score": 0,
      "overall_severity": "None | Mild | Moderate | Severe"
    },
    "right_hand": {
      "tremor_score": 0,
      "rigidity_score": 0,
      "bradykinesia_score": 0,
      "overall_severity": "None | Mild | Moderate | Severe"
    },
    "tremor_score": 0,
    "rigidity_score": 0,
    "bradykinesia_score": 0,
    "gait_score": 0,
    "balance_score": 0,
    "overall_severity": "None | Mild | Moderate | Severe",
    "confidence_score": "0%",
    "observations": "string (in ${lang})",
    "recommendation": "string (in ${lang})",
    "needs_alert": false,
    "alert_message": "string (in ${lang}, empty string if needs_alert is false)",
    "voice_message": "string (warm spoken summary in ${lang}, <= 50 words)"
  }
`;

const bodyPrompt = (lang) => `
  You are a compassionate medical AI assistant specialized in Parkinson's disease motor symptom detection.
  Analyze this video showing the patient's full body (standing or walking) and return ONLY a JSON response.

  The patient has stepped back so their full body is visible. Focus on:
  1. POSTURE: Stooped/forward-leaning posture, spine curvature, shoulder asymmetry, head drop.
  2. FACIAL EXPRESSION (hypomimia): Reduced facial movement, masked face, reduced blinking.
  3. ARM SWING: Asymmetric or reduced arm swing while walking; arm held stiffly at side.
  4. HEAD TREMOR: Resting or action tremor in head/neck area.
  5. GAIT: Shuffling steps, festination, freezing, reduced step height.
  6. BALANCE: Postural instability, difficulty staying upright.

  Scoring:
  - Each indicator scored 0 (absent) to 3 (severe).
  - "confidence_score": overall confidence (0–100%).
  - "needs_alert": true if any indicator score >= 2.
  - All text fields MUST be in ${lang}.

  For "voice_message":
  - Speak directly TO the patient using warm first-person address.
  - Acknowledge full-body observations in simple, non-clinical language.
  - If severity is "None" or "Mild": say patient is stable and doing well.
  - If severity is "Moderate" or "Severe": advise contacting their doctor.
  - Length: 4–6 sentences, uplifting and human tone.
  - MUST be entirely in ${lang}.
  - DO NOT use medical jargon.
  - DO NOT include explanations outside the JSON.

  Return ONLY this JSON structure:
  {
    "posture_score": 0,
    "facial_score": 0,
    "arm_swing_score": 0,
    "head_tremor_score": 0,
    "gait_score": 0,
    "balance_score": 0,
    "body_severity": "None | Mild | Moderate | Severe",
    "overall_severity": "None | Mild | Moderate | Severe",
    "confidence_score": "0%",
    "observations": "string (in ${lang})",
    "recommendation": "string (in ${lang})",
    "needs_alert": false,
    "alert_message": "string (in ${lang}, empty string if needs_alert is false)",
    "voice_message": "string (warm spoken summary in ${lang}, <= 50 words)"
  }
`;

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Analyse a video frame for Parkinson's symptoms.
 * @param {string} currentLang - Response language ("en", "fr", …)
 * @param {string} base64Data  - Base64-encoded video/image
 * @param {string} mimeType    - MIME type ("video/webm", …)
 * @param {string} scanMode    - "hands" (default) | "body"
 */
const analyzeFrame = async (currentLang, base64Data, mimeType, scanMode = 'hands') => {
  try {
    const model = getModel();
    const imagePart = { inlineData: { data: base64Data, mimeType } };
    const prompt = scanMode === 'body' ? bodyPrompt(currentLang) : handsPrompt(currentLang);
    const result = await model.generateContent([prompt, imagePart]);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("[analyzeFrame] Gemini error:", error);
    throw error;
  }
};

module.exports = { analyzeFrame };
