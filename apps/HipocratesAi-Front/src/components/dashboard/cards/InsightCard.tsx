import type { ReactNode } from 'react';

interface InsightCardProps {
  description: ReactNode;
  onViewMore?: () => void;
}

export default function InsightCard({ description, onViewMore }: InsightCardProps) {
  return (
    <div className="insight-panel p-10 flex flex-col">
      <div className="flex items-center gap-2 mb-8">
        <span className="text-[10px] font-bold text-[var(--medical-navy)] uppercase tracking-[0.2em]">
          Weekly Insights
        </span>
      </div>
      <p className="text-slate-600 text-[15px] leading-relaxed font-light mb-12">
        {description}
      </p>
      <div className="mt-auto">
        <button
          type="button"
          onClick={onViewMore}
          className="w-full py-4 border border-slate-100 bg-slate-50/50 hover:bg-white transition-all rounded-2xl text-[10px] font-bold text-[var(--medical-navy)] tracking-[0.15em] uppercase shadow-sm"
        >
          Abrir Relatório Completo
        </button>
      </div>
    </div>
  );
}
