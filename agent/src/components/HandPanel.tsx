import React from 'react';
import { Activity } from 'lucide-react';
interface HandPanelProps {
  side: 'left' | 'right';
  status: 'idle' | 'scanning' | 'complete';
  label: string;
}
export function HandPanel({ side, status, label }: HandPanelProps) {
  const isComplete = status === 'complete';
  const isScanning = status === 'scanning';
  // Color transition logic
  const colorClass = isComplete ? 'text-emerald-500' : 'text-red-500';
  const bgClass = isComplete ? 'bg-emerald-500/10' : 'bg-red-500/10';
  const borderClass = isComplete ? 'border-emerald-500/30' : 'border-red-500/30';
  return (
    <div
      className={`relative h-full flex flex-col items-center justify-center p-8 border-r border-slate-800 bg-slate-950 overflow-hidden transition-colors duration-700`}>

      {/* Background Grid Effect */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
          'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />


      {/* Label */}
      <div className="absolute top-8 left-0 right-0 text-center">
        <h2 className="text-xl font-mono uppercase tracking-[0.2em] text-slate-400 font-bold">
          {label}
        </h2>
        <div
          className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${borderClass} ${bgClass} ${colorClass} transition-all duration-500`}>

          <Activity className="w-3 h-3" />
          {status === 'idle' && 'STANDBY'}
          {status === 'scanning' && 'REC...'}
          {status === 'complete' && 'NORMAL'}
        </div>
      </div>

      {/* Hand SVG Container */}
      <div
        className={`relative w-64 h-96 transition-all duration-700 ${isScanning ? 'scale-105' : 'scale-100'}`}>

        {/* Scan Line Effect */}
        {isScanning &&
        <div className="absolute inset-0 w-full h-2 bg-blue-400/50 shadow-[0_0_15px_rgba(96,165,250,0.8)] z-10 animate-[scan_2s_ease-in-out_infinite]" />
        }

        {/* Hand SVG */}
        <svg
          viewBox="0 0 200 300"
          className={`w-full h-full drop-shadow-2xl transition-colors duration-700 ${colorClass}`}
          style={{
            transform: side === 'right' ? 'scaleX(-1)' : 'none'
          }}>

          {/* Hand Outline */}
          <path
            fill="currentColor"
            fillOpacity="0.1"
            stroke="currentColor"
            strokeWidth="2"
            d="M60,280 L60,250 C60,250 40,240 30,220 C20,200 20,150 20,150 L20,100 C20,80 30,70 40,70 C50,70 55,80 55,100 L55,140 L60,140 L60,60 C60,40 70,30 80,30 C90,30 95,40 95,60 L95,130 L100,130 L100,40 C100,20 110,10 120,10 C130,10 135,20 135,40 L135,130 L140,130 L140,50 C140,30 150,20 160,20 C170,20 175,30 175,50 L175,160 C175,200 160,240 140,260 C120,280 100,280 100,280 L60,280 Z" />


          {/* Joint Markers / Tech Details */}
          <circle
            cx="40"
            cy="100"
            r="3"
            fill="currentColor"
            className="opacity-60" />

          <circle
            cx="40"
            cy="130"
            r="3"
            fill="currentColor"
            className="opacity-60" />

          <circle
            cx="80"
            cy="60"
            r="3"
            fill="currentColor"
            className="opacity-60" />

          <circle
            cx="80"
            cy="100"
            r="3"
            fill="currentColor"
            className="opacity-60" />

          <circle
            cx="120"
            cy="40"
            r="3"
            fill="currentColor"
            className="opacity-60" />

          <circle
            cx="120"
            cy="90"
            r="3"
            fill="currentColor"
            className="opacity-60" />

          <circle
            cx="160"
            cy="50"
            r="3"
            fill="currentColor"
            className="opacity-60" />

          <circle
            cx="160"
            cy="100"
            r="3"
            fill="currentColor"
            className="opacity-60" />

          <circle
            cx="100"
            cy="200"
            r="5"
            fill="currentColor"
            className="opacity-80" />

        </svg>

        {/* Pulse Effect for Scanning */}
        {isScanning &&
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-full border-2 border-blue-500/30 rounded-full animate-ping opacity-20" />
          </div>
        }
      </div>

      {/* Status Footer */}
      <div className="absolute bottom-8 left-0 right-0 text-center px-4">
        <p className="text-slate-500 text-sm font-mono">
          {side === 'left' ? 'CAM L-01' : 'CAM R-02'} •{' '}
          {isComplete ? '100%' : isScanning ? 'REC...' : 'READY'}
        </p>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>);

}