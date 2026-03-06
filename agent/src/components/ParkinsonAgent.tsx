/** @format */

import { FileBarChart2, FileDown, LogOut, UserCheck, RefreshCw } from "lucide-react";
import { User } from "firebase/auth";
import { HandPanel } from "./HandPanel";
import { AgentAvatar } from "./AgentAvatar";
import { ScanningOverlay } from "./ScanningOverlay";
import { ResultOverlay } from "./ResultOverlay";
import { useVideoRecording, speak } from "../hooks/useVideoRecording";
import { CONFIG } from "../global-config";

interface ParkinsonAgentProps {
  getToken:        () => Promise<string>;
  onSignOut:       () => Promise<void>;
  user:            User;
  isDoctor?:       boolean;
  patientCode?:    string;
  onChangePatient?: () => void;
}

export function ParkinsonAgent({
  getToken,
  onSignOut,
  user,
  isDoctor,
  patientCode,
  onChangePatient,
}: ParkinsonAgentProps) {
  const {
    status,
    countdown,
    recordedUrl,
    uploadStatus,
    analysis,
    videoRef,
    startRecording,
    sendToBackend,
    reset,
    scanMode,
    setScanMode,
  } = useVideoRecording({ type: 'token', getToken, patientCode });

  const handleGuide = () => {
    speak(
      "Welcome to Agent Parkinson-Doctor. This app helps detect Parkinson's disease symptoms through tremor analysis. " +
        "To begin, click Start Recording and hold your hands steady in front of the camera for 7 seconds. " +
        "After recording, click Analyze to send the video to our AI. " +
        "The agent will evaluate your hand movements for tremors, rigidity, and bradykinesia, and give you a detailed report.",
    );
  };

  // Append the Firebase ID token + optional patientCode as query params so the
  // browser can open the report directly without a custom Authorization header.
  const handleOpenReport = async () => {
    try {
      const token = await getToken();
      let url = `${CONFIG.serverUrl}/results/report?token=${encodeURIComponent(token)}`;
      if (patientCode) url += `&patientCode=${encodeURIComponent(patientCode)}`;
      window.open(url, "_blank");
    } catch (err) {
      console.error("[handleOpenReport]", err);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const token = await getToken();
      let url = `${CONFIG.serverUrl}/results/report?token=${encodeURIComponent(token)}&format=print`;
      if (patientCode) url += `&patientCode=${encodeURIComponent(patientCode)}`;
      window.open(url, "_blank");
    } catch (err) {
      console.error("[handleDownloadPdf]", err);
    }
  };

  return (
    <div className='min-h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden flex flex-col'>
      <div className='h-1 w-full bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900' />

      <div className='flex items-center justify-between px-4 py-2 border-b border-slate-800/50'>
        {/* User / patient info */}
        <div className='flex items-center gap-3'>
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt='avatar'
              style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid #334155" }}
            />
          )}
          <div>
            <span style={{ fontSize: ".8rem", color: "#94a3b8" }}>
              {user.displayName || user.email}
            </span>
            {isDoctor && patientCode && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.1rem" }}>
                <UserCheck size={12} color="#60a5fa" />
                <span style={{ fontSize: ".72rem", color: "#60a5fa", fontWeight: 600 }}>
                  Patient: {patientCode}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className='flex items-center gap-2'>
          {isDoctor && onChangePatient && (
            <button
              onClick={onChangePatient}
              title='Change patient'
              className='flex items-center gap-1 text-slate-400 hover:text-slate-200 px-3 py-2 rounded-xl text-sm transition-colors border border-slate-700 hover:border-slate-500'>
              <RefreshCw className='w-4 h-4' />
              Change Patient
            </button>
          )}

          <button
            onClick={handleOpenReport}
            className='flex items-center gap-2 bg-violet-800 hover:bg-violet-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 border border-violet-600 hover:border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)]'>
            <FileBarChart2 className='w-4 h-4' />
            REPORT
          </button>

          <button
            onClick={handleDownloadPdf}
            title='Download as PDF'
            className='flex items-center gap-2 text-stone-400 hover:text-stone-200 px-3 py-2 rounded-xl text-sm transition-colors border border-stone-700 hover:border-stone-500'>
            <FileDown className='w-4 h-4' />
            PDF
          </button>

          <button
            onClick={onSignOut}
            title='Sign out'
            className='flex items-center gap-1 text-slate-400 hover:text-slate-200 px-3 py-2 rounded-xl text-sm transition-colors border border-slate-700 hover:border-slate-500'>
            <LogOut className='w-4 h-4' />
            Sign out
          </button>
        </div>
      </div>

      <main className='flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px_1fr] h-full relative'>
        {/* Left Panel */}
        <div className='h-full border-r border-slate-800/50 relative order-2 lg:order-1'>
          <HandPanel side='left' status={status} label={scanMode === 'body' ? 'LEFT SIDE' : 'LEFT HAND'} scanMode={scanMode} />
        </div>

        {/* Center Panel */}
        <div className='h-full relative z-20 order-1 lg:order-2 border-b lg:border-b-0 border-slate-800'>
          <AgentAvatar
            status={status}
            onStart={startRecording}
            onReset={reset}
            onGuide={handleGuide}
            scanMode={scanMode}
            onModeChange={setScanMode}
          />
        </div>

        {/* Right Panel */}
        <div className='h-full border-l border-slate-800/50 relative order-3'>
          <HandPanel side='right' status={status} label={scanMode === 'body' ? 'RIGHT SIDE' : 'RIGHT HAND'} scanMode={scanMode} />
        </div>

        {status === "scanning" && (
          <ScanningOverlay countdown={countdown} videoRef={videoRef} scanMode={scanMode} />
        )}

        {status === "complete" && recordedUrl && (
          <ResultOverlay
            recordedUrl={recordedUrl}
            uploadStatus={uploadStatus}
            analysis={analysis}
            onSend={sendToBackend}
            onReset={reset}
          />
        )}
      </main>
    </div>
  );
}
