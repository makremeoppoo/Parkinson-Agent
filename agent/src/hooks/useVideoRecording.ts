// @refresh reset
import { useEffect, useRef, useState } from "react";
import { CONFIG } from "../global-config";

const ANALYZE_URL = `${CONFIG.serverUrl}/analyze-frame`;

const SCAN_DURATION_MS = 7000;
const LANG = "en";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ScanStatus   = "idle" | "scanning" | "complete";
export type UploadStatus = "idle" | "uploading" | "done" | "error";

export interface AnalysisResult {
  tremor_score:       number;
  rigidity_score:     number;
  bradykinesia_score: number;
  gait_score:         number;
  balance_score:      number;
  overall_severity:   string;
  confidence_score:   string;
  observations:       string;
  recommendation:     string;
  needs_alert:        boolean;
  alert_message:      string;
  voice_message:      string;
}

// ── TTS helper ────────────────────────────────────────────────────────────────

export const speak = (text: string) => {
  if (!text || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang  = LANG === "fr" ? "fr-FR" : "en-US";
  utter.rate  = 0.88;
  utter.pitch = 1.05;
  window.speechSynthesis.speak(utter);
};

// ── Convert a Blob to base64 string (without the data-URL prefix) ────────────

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror  = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useVideoRecording() {
  const [status,       setStatus]       = useState<ScanStatus>("idle");
  const [countdown,    setCountdown]    = useState(0);
  const [recordedUrl,  setRecordedUrl]  = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [analysis,     setAnalysis]     = useState<AnalysisResult | null>(null);

  const videoRef         = useRef<HTMLVideoElement>(null);
  const streamRef        = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const blobRef          = useRef<Blob | null>(null);
  const countdownRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Start camera + MediaRecorder ──────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      chunksRef.current = [];
      blobRef.current   = null;

      setStatus("scanning");
      setCountdown(SCAN_DURATION_MS / 1000);
      setRecordedUrl(null);
      setUploadStatus("idle");
      setAnalysis(null);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        blobRef.current = blob;
        setRecordedUrl(URL.createObjectURL(blob));
        setStatus("complete");
      };

      mediaRecorder.start();

      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setTimeout(() => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
      }, SCAN_DURATION_MS);

    } catch (err) {
      console.error("Camera access denied:", err);
      setStatus("idle");
    }
  };

  // ── ANALYSER button: send video/webm → POST /analyze-frame ────────────────
  const sendToBackend = async () => {
    if (!blobRef.current) return;
    setUploadStatus("uploading");
    try {
      const base64 = await blobToBase64(blobRef.current);
      const res = await fetch(ANALYZE_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ frame: base64, mimeType: "video/webm", currentLang: LANG }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = (await res.json()).data as AnalysisResult;
      setAnalysis(result);
      setUploadStatus("done");
      speak(result.voice_message);
    } catch (err) {
      console.error("[sendToBackend]", err);
      setUploadStatus("error");
    }
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    if (countdownRef.current) clearInterval(countdownRef.current);
    window.speechSynthesis?.cancel();
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);

    streamRef.current        = null;
    mediaRecorderRef.current = null;
    chunksRef.current        = [];
    blobRef.current          = null;

    setCountdown(0);
    setRecordedUrl(null);
    setUploadStatus("idle");
    setAnalysis(null);
    setStatus("idle");
  };

  useEffect(() => {
    if (status === "scanning" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [status]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (countdownRef.current) clearInterval(countdownRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  return { status, countdown, recordedUrl, uploadStatus, analysis, videoRef, startRecording, sendToBackend, reset };
}
