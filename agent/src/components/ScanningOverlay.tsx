import React from "react";
import { HandGuide } from "./HandGuide";

interface ScanningOverlayProps {
  countdown: number;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export function ScanningOverlay({ countdown, videoRef }: ScanningOverlayProps) {
  return (
    <div className='absolute inset-0 z-30 bg-black'>
      {/* Live full-screen video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className='w-full h-full object-cover'
        style={{ transform: "scaleX(-1)" }}
      />

      {/* Hand guides */}
      <div className='absolute inset-0 flex items-center justify-around px-16 pointer-events-none'>
        <HandGuide />
        <HandGuide flip />
      </div>

      {/* Scan line */}
      <div className='absolute inset-0 pointer-events-none overflow-hidden'>
        <div className='w-full h-1 bg-blue-400/50 shadow-[0_0_20px_rgba(96,165,250,0.9)] animate-scanline' />
      </div>

      {/* Corner brackets */}
      <div className='absolute top-6 left-6 w-10 h-10 border-t-2 border-l-2 border-blue-400' />
      <div className='absolute top-6 right-6 w-10 h-10 border-t-2 border-r-2 border-blue-400' />
      <div className='absolute bottom-6 left-6 w-10 h-10 border-b-2 border-l-2 border-blue-400' />
      <div className='absolute bottom-6 right-6 w-10 h-10 border-b-2 border-r-2 border-blue-400' />

      {/* REC + countdown */}
      <div className='absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10'>
        <div className='flex items-center gap-2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full border border-red-500/50'>
          <div className='w-3 h-3 bg-red-500 rounded-full animate-pulse' />
          <span className='text-red-400 font-mono font-bold tracking-widest'>REC</span>
        </div>
        <div className='bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-500/40'>
          <span className='text-blue-300 font-mono font-bold text-lg'>{countdown}s</span>
        </div>
      </div>

      {/* Instruction */}
      <div className='absolute bottom-6 left-0 right-0 text-center z-10'>
        <p className='text-blue-300 font-mono text-sm bg-black/60 backdrop-blur-sm inline-block px-5 py-2 rounded-full border border-blue-500/20'>
          Align both hands on the guides
        </p>
      </div>
    </div>
  );
}
