const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const getModel = () =>
  genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: { responseMimeType: "application/json" },
  });

/**
 * Analyse une frame vidéo (base64) pour détecter les symptômes de Parkinson.
 * Retourne aussi un `voice_message` prêt à être lu via TTS.
 *
 * @param {string} currentLang - Langue de la réponse (ex: "fr", "en")
 * @param {string} base64Data  - Image encodée en base64
 * @param {string} mimeType    - Type MIME (ex: "image/jpeg")
 */
const analyzeFrame = async (currentLang, base64Data, mimeType) => {
  try {
    const model = getModel();

    const imagePart = {
      inlineData: { data: base64Data, mimeType },
    };

    const prompt = `
      You are a compassionate medical AI assistant specialized in Parkinson's disease motor symptom detection.
      Analyze this video frame captured from a patient's camera and return ONLY a JSON response.

      Focus on visible motor indicators:
      1. TREMOR: Detect resting tremor in hands, fingers, or limbs (pill-rolling motion).
      2. RIGIDITY & POSTURE: Assess stooped posture, reduced arm swing, stiffness.
      3. BRADYKINESIA: Look for slow movements, reduced facial expression (hypomimia), reduced blinking.
      4. GAIT: If lower body visible, detect shuffling gait, festination, or freezing.
      5. BALANCE: Postural instability or asymmetry.

      Scoring:
      - Each indicator scored 0 (absent) to 3 (severe).
      - "confidence_score": overall confidence in this analysis (0–100%).
      - "needs_alert": true if any indicator scores >= 2.
      - All text fields MUST be in ${currentLang}.

      For "voice_message":
      - Speak directly TO the patient using warm first-person address (example: "Hello" / "Bonjour").
      - Acknowledge what was observed using simple, non-clinical language.
      - Always clearly state the situation:
          • If severity is "None" or "Mild": explicitly say the patient is stable or doing well (e.g., "You are stable today" or "You're doing well today").
          • If severity is "Moderate" or "Severe": explicitly say they should contact their doctor or care team (e.g., "You should contact your doctor" or "Please reach out to your care team").
      - Celebrate any effort or stability, no matter how small.
      - Offer comfort if symptoms increased.
      - Length: 4–6 sentences, natural spoken language, uplifting and human tone.
      - MUST be entirely in ${currentLang}.
      - DO NOT use medical jargon.
      - DO NOT include explanations outside the JSON.


      Return ONLY this JSON structure:
      {
        "tremor_score": 0,
        "rigidity_score": 0,
        "bradykinesia_score": 0,
        "gait_score": 0,
        "balance_score": 0,
        "overall_severity": "None | Mild | Moderate | Severe",
        "confidence_score": "0%",
        "observations": "string (in ${currentLang})",
        "recommendation": "string (in ${currentLang})",
        "needs_alert": false,
        "alert_message": "string (in ${currentLang}, empty string if needs_alert is false)",
        "voice_message": "string (warm spoken summary in ${currentLang}, <= 50 words)"
      }
    `;

    const result = await model.generateContent([prompt, imagePart]);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("[analyzeFrame] Gemini error:", error);
    throw error;
  }
};



module.exports = { analyzeFrame };
