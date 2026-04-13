import React from 'react';

interface NewConsultationHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function NewConsultationHeader({
  title = 'Iniciar Nova Consulta',
  subtitle = 'Interface assistida por Inteligência Clínica',
}: NewConsultationHeaderProps) {
  return (
    <div className="text-center mb-3">
      <h1 className="text-2xl font-light tracking-tight text-slate-900 mb-0.5">{title}</h1>
      <p className="text-slate-400 text-xs font-light tracking-wide">{subtitle}</p>
    </div>
  );
}
