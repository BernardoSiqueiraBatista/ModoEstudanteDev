import React from 'react';

interface ClosureDiagnosisItemProps {
  title: string;
  description: string;
  status: 'confirmed' | 'considered' | 'discarded';
}

export default function ClosureDiagnosisItem({ title, description, status }: ClosureDiagnosisItemProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'confirmed':
        return {
          icon: 'check',
          text: 'Confirmado',
          opacity: '',
          grayscale: '',
          border: '',
          lineThrough: '',
        };
      case 'considered':
        return {
          icon: 'check',
          text: 'Considerado',
          opacity: '',
          grayscale: '',
          border: '',
          lineThrough: '',
        };
      case 'discarded':
        return {
          icon: 'close',
          text: 'Descartado',
          opacity: 'opacity-40',
          grayscale: 'grayscale',
          border: 'border-dashed',
          lineThrough: 'line-through',
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div className={`group flex items-center justify-between p-5 rounded-2xl bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-100 transition-all duration-300 ${styles.opacity} ${styles.grayscale}`}>
      <div className="flex items-center gap-5">
        <div className={`size-6 rounded-full border-2 border-slate-200 flex items-center justify-center bg-white ${styles.border}`}>
          <span className="material-symbols-outlined text-medical-navy text-lg">{styles.icon}</span>
        </div>
        <div>
          <h4 className={`text-sm font-semibold text-medical-navy ${styles.lineThrough}`}>{title}</h4>
          <p className={`text-xs text-slate-400 mt-0.5 ${styles.lineThrough}`}>{description}</p>
        </div>
      </div>
      <span className="text-[10px] font-bold text-slate-300 uppercase">{styles.text}</span>
    </div>
  );
}