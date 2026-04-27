import React from 'react';

interface ClosureHeaderProps {
  patientName: string;
  patientId: string;
}

export default function ClosureHeader({ patientName, patientId }: ClosureHeaderProps) {
  return (
    <header className="text-center space-y-3 mb-16">
      <h1 className="text-4xl font-light tracking-tight text-slate-900">Revisão e Encerramento</h1>
      <div className="flex items-center justify-center gap-3">
        <span className="text-xs font-semibold tracking-widest text-medical-graphite uppercase">
          Paciente: {patientName}
        </span>
        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
        <span className="text-xs font-medium text-slate-400">ID #{patientId}</span>
      </div>
    </header>
  );
}