import React from 'react';
import type { MedicalInsight } from '../../../data/ConsultationData';

interface MedicalInsightCardProps {
  insight: MedicalInsight;
}

export default function MedicalInsightCard({ insight }: MedicalInsightCardProps) {
  return (
    <div className="relative mt-12 p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-50 to-white dark:from-white/5 dark:to-transparent border border-slate-100/50 dark:border-white/5 overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined !text-[16px] text-accent-blue">
            auto_awesome
          </span>
          <span className="text-[9px] font-bold text-accent-blue uppercase tracking-widest">
            Medical Insight
          </span>
        </div>
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 italic font-light">
          {insight.text}
        </p>
      </div>
    </div>
  );
}
