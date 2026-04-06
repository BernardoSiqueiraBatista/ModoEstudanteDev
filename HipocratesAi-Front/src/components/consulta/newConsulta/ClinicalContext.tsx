import React from 'react';

interface ClinicalContextProps {
  mainComplaint: string;
  recentAttachments?: Array<{ name: string; icon?: string }>;
  onViewHistory?: () => void;
}

export default function ClinicalContext({
  mainComplaint,
  recentAttachments = [],
  onViewHistory,
}: ClinicalContextProps) {
  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
          Contexto da Visão
        </h3>
        <button
          onClick={onViewHistory}
          className="text-[10px] text-primary/70 font-bold uppercase tracking-widest hover:text-primary transition-colors cursor-pointer"
          type="button"
        >
          Ver histórico completo
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="group">
          <p className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-tighter">
            Queixa Principal
          </p>
          <p className="text-sm font-light text-slate-600 leading-relaxed border-l border-slate-200 pl-3 group-hover:border-primary/30 transition-colors">
            {mainComplaint}
          </p>
        </div>
        {recentAttachments.length > 0 && (
          <div className="group">
            <p className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-tighter">
              Anexos Recentes
            </p>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3 group-hover:border-primary/30 transition-colors">
              {recentAttachments.map((attachment, index) => (
                <React.Fragment key={index}>
                  <span className="material-symbols-outlined text-slate-400 text-base">
                    {attachment.icon || 'description'}
                  </span>
                  <p className="text-sm font-light text-slate-600">{attachment.name}</p>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}