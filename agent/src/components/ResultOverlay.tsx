/** @format */

import {
  Download,
  RotateCcw,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  Volume2,
  AlertTriangle,
  FileBarChart2,
} from "lucide-react";
import type { UploadStatus, AnalysisResult } from "../hooks/useVideoRecording";
import { CONFIG } from "../global-config";

// ── Helpers ───────────────────────────────────────────────────────────────────

const severityConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  None: {
    label: "AUCUNE",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  Mild: {
    label: "LÉGÈRE",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
  },
  Moderate: {
    label: "MODÉRÉE",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
  },
  Severe: {
    label: "SÉVÈRE",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
  },
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface ResultOverlayProps {
  recordedUrl: string;
  uploadStatus: UploadStatus;
  analysis: AnalysisResult | null;
  onSend: () => void;
  onReset: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ResultOverlay({
  recordedUrl,
  uploadStatus,
  analysis,
  onSend,
  onReset,
}: ResultOverlayProps) {
  const sev =
    severityConfig[analysis?.overall_severity ?? ""] ?? severityConfig["None"];
  const analysisReady = uploadStatus === "done" && analysis !== null;

  return (
    <div className='absolute inset-0 z-30 bg-black/92 backdrop-blur-sm flex flex-col items-center justify-start gap-5 px-8 py-8 overflow-y-auto'>
      {/* ── Title ──────────────────────────────────────────────────────────── */}
      <div className='text-center shrink-0'>
        <p className='text-xs text-emerald-400 font-mono uppercase tracking-widest mb-1'>
          {analysisReady ? "Analyse Parkinson" : "Recording complete"}
        </p>
        <h2 className='text-xl font-bold text-white'>
          {analysisReady ? "Résultats de la session" : "Hand video"}
        </h2>
      </div>

      {/* ── Video player ───────────────────────────────────────────────────── */}
      <div className='relative w-full max-w-4xl rounded-xl overflow-hidden border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.15)] shrink-0'>
        <div className='absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-400 z-10' />
        <div className='absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-400 z-10' />
        <div className='absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-400 z-10' />
        <div className='absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400 z-10' />
        <video
          src={recordedUrl}
          controls
          className='w-full max-h-[35vh] object-contain bg-black'
          style={{ transform: "scaleX(-1)" }}
        />
      </div>

      {/* ── Action buttons ─────────────────────────────────────────────────── */}
      <div className='flex gap-4 shrink-0'>
        <a
          href={recordedUrl}
          download='recording-hands.webm'
          className='flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-[0.98]'>
          <Download className='w-5 h-5' />
          DOWNLOAD
        </a>

        <button
          onClick={onSend}
          disabled={uploadStatus === "uploading" || uploadStatus === "done"}
          className='flex items-center gap-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 border border-blue-600'>
          {uploadStatus === "uploading" && (
            <Loader2 className='w-5 h-5 animate-spin' />
          )}
          {uploadStatus === "done" && (
            <CheckCircle className='w-5 h-5 text-emerald-300' />
          )}
          {uploadStatus === "error" && (
            <AlertCircle className='w-5 h-5 text-red-300' />
          )}
          {uploadStatus === "idle" && <Send className='w-5 h-5' />}
          {uploadStatus === "uploading"
            ? "ANALYSE…"
            : uploadStatus === "done"
              ? "ANALYSÉ"
              : uploadStatus === "error"
                ? "RÉESSAYER"
                : "ANALYSER"}
        </button>

        <button
          onClick={onReset}
          className='flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 border border-slate-700 hover:border-slate-600'>
          <RotateCcw className='w-5 h-5' />
          RESET
        </button>

        <a
          href={`${CONFIG.serverUrl}/results/report`}
          target='_blank'
          rel='noopener noreferrer'
          className='flex items-center gap-2 bg-violet-800 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 border border-violet-600 hover:border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)]'>
          <FileBarChart2 className='w-5 h-5' />
          RAPPORT
        </a>
      </div>

      {/* ── Analysis results (shown after Send) ────────────────────────────── */}
      {analysisReady && (
        <div className='w-full max-w-xl space-y-4'>
          {/* Separator */}
          <div className='flex items-center gap-3'>
            <div className='flex-1 h-px bg-slate-800' />
            <span className='text-[10px] text-slate-500 font-mono uppercase tracking-widest'>
              Résultats Parkinson
            </span>
            <div className='flex-1 h-px bg-slate-800' />
          </div>

          {/* Severity + confidence */}
          <div className='flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-5 py-4'>
            <div>
              <p className='text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1'>
                Gravité globale
              </p>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${sev.bg} ${sev.border} ${sev.color}`}>
                {sev.label}
              </span>
            </div>
            <div className='text-right'>
              <p className='text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1'>
                Confiance
              </p>
              <span className='text-2xl font-bold text-white font-mono'>
                {analysis.confidence_score}
              </span>
            </div>
          </div>

          {/* Observations + recommendation */}
          <div className='bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 space-y-3'>
            {analysis.observations && (
              <div>
                <p className='text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1'>
                  Observations
                </p>
                <p className='text-sm text-slate-300 leading-relaxed'>
                  {analysis.observations}
                </p>
              </div>
            )}
            {analysis.recommendation && (
              <div>
                <p className='text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1'>
                  Recommandation
                </p>
                <p className='text-sm text-slate-300 leading-relaxed'>
                  {analysis.recommendation}
                </p>
              </div>
            )}
          </div>

          {/* Alert banner */}
          {analysis.needs_alert && analysis.alert_message && (
            <div className='flex gap-3 bg-red-950/60 border border-red-500/40 rounded-xl px-5 py-4'>
              <AlertTriangle className='w-5 h-5 text-red-400 shrink-0 mt-0.5' />
              <p className='text-sm text-red-300 leading-relaxed'>
                {analysis.alert_message}
              </p>
            </div>
          )}

          {/* Voice message quote */}
          {analysis.voice_message && (
            <div className='flex gap-3 items-start bg-blue-950/40 border border-blue-500/20 rounded-xl px-5 py-3'>
              <Volume2 className='w-4 h-4 text-blue-400 shrink-0 mt-0.5' />
              <p className='text-xs text-blue-300 italic leading-relaxed'>
                "{analysis.voice_message}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
