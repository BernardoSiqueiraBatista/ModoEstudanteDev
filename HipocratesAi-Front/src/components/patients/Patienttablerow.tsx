import React from 'react';
import type { Patient } from '../../types/PatientTypes';

interface PatientTableRowProps {
  patient: Patient;
  onViewDetails?: () => void;
  onMoreActions?: () => void;
}

export default function PatientTableRow({
  patient,
  onViewDetails,
  onMoreActions,
}: PatientTableRowProps) {
  const getStatusBadge = () => {
    switch (patient.status) {
      case 'ativo':
        return (
          <span className="status-badge status-ativo">
            Ativo
          </span>
        );
      case 'followup':
        return (
          <span className="status-badge status-followup">
            Follow-up
          </span>
        );
      case 'pendente':
        return (
          <span className="status-badge status-pendente">
            Pendente
          </span>
        );
    }
  };

  return (
    <tr 
      className="group hover:scale-[1.005] transition-all duration-500 cursor-pointer"
      onClick={onViewDetails}
    >
      {/* Patient Info */}
      <td className="px-6 py-5 bg-white/40 group-hover:bg-white/80 rounded-l-card border-y border-l border-white/60 transition-colors">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-subtitle text-caption font-medium">
            {patient.initials}
          </div>
          <div>
            <p className="text-heading-3 text-title">{patient.name}</p>
            <p className="text-caption text-subtitle">
              {patient.gender}, {patient.age} anos
            </p>
          </div>
        </div>
      </td>

      {/* Record Number */}
      <td className="px-6 py-5 bg-white/40 group-hover:bg-white/80 border-y border-white/60">
        <span className="font-mono text-caption text-subtitle">{patient.recordNumber}</span>
      </td>

      {/* Last Consultation */}
      <td className="px-6 py-5 bg-white/40 group-hover:bg-white/80 border-y border-white/60">
        <p className="text-body-sm text-slate-600">{patient.lastConsultation.date}</p>
        <p className="text-caption text-subtitle">{patient.lastConsultation.doctor}</p>
      </td>

      {/* Status */}
      <td className="px-6 py-5 bg-white/40 group-hover:bg-white/80 border-y border-white/60">
        {getStatusBadge()}
      </td>

      {/* Actions */}
      <td className="px-6 py-5 bg-white/40 group-hover:bg-white/80 rounded-r-card border-y border-r border-white/60 text-right">
        <button
          className="p-2 hover:bg-slate-100 rounded-full text-subtitle transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onMoreActions?.();
          }}
        >
          <span className="material-icon">more_vert</span>
        </button>
      </td>
    </tr>
  );
}