import React from 'react';

interface PatientInfoCardProps {
  name: string;
  initials: string;
  age: number;
  lastAccess: string;
  status?: string;
  gender?: string;
  recordNumber?: string;
}

export default function PatientInfoCard({
  name,
  initials,
  age,
  lastAccess,
  status = 'Prontuário Ativo',
  gender,
  recordNumber,
}: PatientInfoCardProps) {
  return (
    <div className="flex items-center gap-6 py-4 border-b border-slate-100/50">
      {/* Avatar maior */}
      <div className="size-16 rounded-full overflow-hidden bg-primary/10 flex-shrink-0 ring-1 ring-slate-100 flex items-center justify-center">
        <span className="text-xl font-medium text-primary">{initials}</span>
      </div>
      
      <div className="flex-1">
        {/* Nome e Status */}
        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
          <h2 className="text-xl font-medium text-slate-800 tracking-tight">{name}</h2>
          <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-emerald-500/80 bg-emerald-50 px-2 py-0.5 rounded-full">
            {status}
          </span>
        </div>
        
        {/* Informações em grid para melhor espaçamento */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1.5 mt-1">
          {gender && (
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-slate-400">person</span>
              <span className="text-xs text-slate-600">{gender}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-slate-400">cake</span>
            <span className="text-xs text-slate-600">{age} anos</span>
          </div>
          {recordNumber && (
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-slate-400">badge</span>
              <span className="text-xs text-slate-600 font-mono">{recordNumber}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-slate-400">history</span>
            <span className="text-xs text-slate-600">Último acesso: {lastAccess}</span>
          </div>
        </div>
      </div>
    </div>
  );
}