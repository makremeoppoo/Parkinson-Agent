import React from "react";

const HAND_PATH =
  "M60,280 L60,250 C60,250 40,240 30,220 C20,200 20,150 20,150 L20,100 C20,80 30,70 40,70 C50,70 55,80 55,100 L55,140 L60,140 L60,60 C60,40 70,30 80,30 C90,30 95,40 95,60 L95,130 L100,130 L100,40 C100,20 110,10 120,10 C130,10 135,20 135,40 L135,130 L140,130 L140,50 C140,30 150,20 160,20 C170,20 175,30 175,50 L175,160 C175,200 160,240 140,260 C120,280 100,280 100,280 L60,280 Z";

const HAND_JOINTS = [
  { cx: 40, cy: 100 },
  { cx: 40, cy: 130 },
  { cx: 80, cy: 60 },
  { cx: 80, cy: 100 },
  { cx: 120, cy: 40 },
  { cx: 120, cy: 90 },
  { cx: 160, cy: 50 },
  { cx: 160, cy: 100 },
  { cx: 100, cy: 200 },
];

export function HandGuide({ flip }: { flip?: boolean }) {
  return (
    <div className='flex flex-col items-center gap-2'>
      <svg
        viewBox='0 0 200 300'
        className='w-32 h-48 text-blue-400/90 drop-shadow-[0_0_6px_rgba(96,165,250,0.9)] animate-pulse'
        style={flip ? { transform: "scaleX(-1)" } : undefined}>
        <path
          fill='currentColor'
          fillOpacity='0.5'
          stroke='currentColor'
          strokeWidth='2'
          strokeDasharray='6 3'
          d={HAND_PATH}
        />
        {HAND_JOINTS.map((p, i) => (
          <circle
            key={i}
            cx={p.cx}
            cy={p.cy}
            r='4'
            fill='currentColor'
            className='opacity-70'
          />
        ))}
      </svg>
      <span className='text-blue-400/70 font-mono text-xs uppercase tracking-widest'>
        {flip ? "R. Hand" : "L. Hand"}
      </span>
    </div>
  );
}
