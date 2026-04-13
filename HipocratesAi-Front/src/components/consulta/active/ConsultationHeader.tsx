import React from 'react';

interface ConsultationHeaderProps {
  patientName: string;
  age: number;
  mainComplaint: string;
  duration: string;
}

export default function ConsultationHeader({
  patientName,
  age,
  mainComplaint,
  duration,
}: ConsultationHeaderProps) {
  return (
    <header className="px-20 py-16 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className="size-1 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
          <span className="text-[9px] font-semibold tracking-ultra text-slate-400 uppercase">
            Live Clinical Session
          </span>
        </div>
        <h1 className="text-3xl font-light tracking-tightest text-slate-900 dark:text-white">
          {patientName}
        </h1>
        <div className="flex items-center gap-4 mt-2.5">
          <span className="text-[9px] font-bold tracking-widest text-rose-500/80 uppercase">
            QUEIXA PRINCIPAL: {mainComplaint}
          </span>
          <span className="size-1 bg-slate-200 dark:bg-slate-800 rounded-full"></span>
          <span className="text-[9px] font-bold tracking-widest text-emerald-500/80 uppercase">
            {age} anos
          </span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">
            Duration
          </span>
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 tabular-nums">
            {duration}
          </span>
        </div>
      </div>
    </header>
  );
}
