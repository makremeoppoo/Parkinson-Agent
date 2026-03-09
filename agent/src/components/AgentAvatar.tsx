import React from 'react';
import { Bot, Play, RotateCcw, HelpCircle } from 'lucide-react';
import type { ScanMode } from '../hooks/useVideoRecording';

interface AgentAvatarProps {
  status: 'idle' | 'scanning' | 'complete';
  onStart: () => void;
  onReset: () => void;
  onGuide: () => void;
  scanMode: ScanMode;
  onModeChange: (m: ScanMode) => void;
}

export function AgentAvatar({ status, onStart, onReset, onGuide, scanMode, onModeChange }: AgentAvatarProps) {
  return (
    <div className="h-full w-full max-w-md bg-slate-900 border-x border-slate-800 flex flex-col items-center justify-between py-12 px-6 relative z-10 shadow-2xl">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 mb-4 shadow-lg">
          <Bot className="w-8 h-8 text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          AGENT PARKINSON
        </h1>
        <p className="text-slate-400 text-sm uppercase tracking-widest font-medium">
          Tremor Detection
        </p>
      </div>

      {/* Center Visualization */}
      <div className="flex-1 flex flex-col items-center justify-center w-full my-8">
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Status Rings */}
          <div
            className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${status === 'scanning' ? 'border-blue-500/50 scale-110 animate-pulse' : status === 'complete' ? 'border-emerald-500/50' : 'border-slate-700'}`} />

          <div
            className={`absolute inset-4 rounded-full border border-dashed transition-all duration-500 ${status === 'scanning' ? 'border-blue-400/30 animate-[spin_10s_linear_infinite]' : status === 'complete' ? 'border-emerald-400/30' : 'border-slate-800'}`} />

          {/* Center Content */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            {status === 'idle' &&
            <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                <span className="text-5xl">🧠</span>
              </div>
            }

            {status === 'scanning' &&
            <div className="w-24 h-24 rounded-full bg-blue-900/20 flex items-center justify-center border border-blue-500/50 relative overflow-hidden">
                <div className="absolute w-2 h-2 bg-red-500 rounded-full animate-ping" />
                <span className="relative z-10 text-blue-400 font-mono text-xs">
                  REC
                </span>
              </div>
            }

            {status === 'complete' &&
            <div className="w-24 h-24 rounded-full bg-emerald-900/20 flex items-center justify-center border border-emerald-500/50">
                <span className="text-5xl">🧠</span>
              </div>
            }
          </div>
        </div>

        {/* Status Text */}
        <div className="mt-8 text-center h-16">
          {status === 'idle' &&
          <p className="text-slate-400 animate-pulse">
              Ready to record...
            </p>
          }
          {status === 'scanning' &&
          <div className="space-y-1">
              <p className="text-blue-400 font-medium">
                Recording in progress...
              </p>
              <p className="text-xs text-slate-500 font-mono">
                VIDEO IN PROGRESS
              </p>
            </div>
          }
          {status === 'complete' &&
          <div className="space-y-1">
              <p className="text-emerald-400 font-medium">Recording Complete</p>
              <p className="text-xs text-slate-500">Video sent to server</p>
            </div>
          }
        </div>
      </div>

      {/* Controls */}
      <div className="w-full space-y-3">
        {status === 'idle' &&
        <>
          {/* Scan mode toggle */}
          <div className="flex rounded-xl border border-slate-700 overflow-hidden">
            <button
              onClick={() => onModeChange('hands')}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                scanMode === 'hands'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}>
              👋 Hand Scan
            </button>
            <button
              onClick={() => onModeChange('body')}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                scanMode === 'body'
                  ? 'bg-indigo-700 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}>
              🧍 Full Body
            </button>
          </div>

          <button
            onClick={onStart}
            className="w-full group relative flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] active:scale-[0.98]">
              <Play className="w-5 h-5 fill-current" />
              {scanMode === 'body' ? 'START BODY SCAN' : 'START RECORDING'}
          </button>
          <button
            onClick={onGuide}
            className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 border border-slate-700 hover:border-slate-500 active:scale-[0.98]">
              <HelpCircle className="w-4 h-4" />
              HOW TO USE
          </button>
        </>
        }

        {status === 'scanning' &&
        <button
          disabled
          className="w-full flex items-center justify-center gap-3 bg-slate-800 text-slate-500 px-6 py-4 rounded-xl font-semibold cursor-not-allowed border border-slate-700">

            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            RECORDING IN PROGRESS...
          </button>
        }

        {status === 'complete' &&
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 border border-slate-700 hover:border-slate-600">

            <RotateCcw className="w-5 h-5" />
            RESET
          </button>
        }

        <div className="flex justify-between text-[10px] text-slate-600 font-mono uppercase px-2">
          <span>Ver 2.4.1</span>
          <span>Sys: Online</span>
        </div>
      </div>
    </div>);

}
