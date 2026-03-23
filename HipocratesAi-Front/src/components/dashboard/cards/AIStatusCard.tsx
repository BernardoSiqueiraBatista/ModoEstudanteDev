import React from 'react';

interface AIStatusCardProps {
  isOnline?: boolean;
  title?: string;
  description?: string;
  statusLabel?: string;
}

export default function AIStatusCard({
  isOnline = true,
  title = 'Análise em Tempo Real',
  description = 'Processando prontuários da manhã para identificação de padrões de risco.',
  statusLabel = 'Hipócrates AI Online',
}: AIStatusCardProps) {
  return (
    <div className="bg-slate-900 p-5 rounded-xl border border-slate-700 shadow-xl overflow-hidden relative">
      {/* Background Icon */}
      <div className="absolute -right-4 -top-4 opacity-20">
        <span className="material-icon text-[100px] text-primary">neurology</span>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`size-2 ${
              isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-500'
            } rounded-full`}
          ></div>
          <span className="text-caption-bold text-slate-400">{statusLabel}</span>
        </div>
        <h4 className="text-white text-heading-3 mb-1">{title}</h4>
        <p className="text-slate-400 text-caption leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
