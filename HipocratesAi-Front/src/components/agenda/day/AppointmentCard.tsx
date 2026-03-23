import React from 'react';
import type { Patient } from '../../../types/PatientTypes';
import type { Apontamento } from '../../../data/WeekCalendarData';

export type AppointmentStatus =
  | 'confirmado'
  | 'aguardando'
  | 'nao-iniciado'
  | 'video';

interface AppointmentCardProps {
  apontamento: Apontamento;
  status: AppointmentStatus;
  onViewPatient?: (patient: Patient) => void;
  onOpenConsulta?: (apontamento: Apontamento) => void;
}

export default function AppointmentCard({
  apontamento,
  status,
  onViewPatient,
  onOpenConsulta,
}: AppointmentCardProps) {
  const { patient, startTime, type, description } = apontamento;
  
  const specialty = description?.split('-')[1]?.trim() || 'Consulta Geral';

  const getStatusBadge = () => {
    switch (status) {
      case 'confirmado':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-green-50 text-green-600 text-caption-bold uppercase tracking-wider border border-green-100">
            Confirmado
          </span>
        );
      case 'aguardando':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-caption-bold uppercase tracking-wider border border-blue-100">
            Aguardando
          </span>
        );
      case 'nao-iniciado':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-caption-bold uppercase tracking-wider border border-slate-200">
            Não iniciado
          </span>
        );
      case 'video':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-caption-bold uppercase tracking-wider border border-indigo-100 flex items-center gap-1">
            <span className="material-icon text-[12px] leading-none">videocam</span>
            Vídeo
          </span>
        );
    }
  };

  const getBorderStyle = () => {
    return status === 'nao-iniciado' ? 'border-dashed border-slate-300' : '';
  };

  return (
    <div className="relative mb-12 group">
      <div className="absolute -left-24 top-2 text-body-sm font-bold text-subtitle">{startTime}</div>
      <div className="absolute left-[3rem] -translate-x-1/2 top-3 size-2.5 rounded-full border-2 border-white bg-slate-300 ring-4 ring-slate-50"></div>

      <div
        className={`glass-effect p-6 rounded-2xl flex items-center justify-between group-hover:scale-[1.01] transition-transform duration-300 ${getBorderStyle()}`}
      >
        <div className="flex items-center gap-5">
          {/* Avatar com iniciais do paciente */}
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-body-sm font-semibold text-slate-600">
              {patient.initials}
            </span>
          </div>
          
          <div>
            <h3 className="text-heading-3 text-title">{patient.name}</h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-caption text-subtitle">
                {type} • {specialty}
              </span>
              {getStatusBadge()}
            </div>
            {/* Informações adicionais do paciente */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-caption text-subtitle">
                {patient.gender} • {patient.age} anos • {patient.recordNumber}
              </span>
              <span className={`text-caption px-2 py-0.5 rounded-full ${
                patient.status === 'ativo' ? 'bg-green-50 text-green-600' :
                patient.status === 'followup' ? 'bg-blue-50 text-blue-600' :
                'bg-yellow-50 text-yellow-600'
              }`}>
                {patient.status === 'ativo' ? 'Ativo' :
                 patient.status === 'followup' ? 'Follow-up' : 'Pendente'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="px-4 py-2 text-caption-bold text-subtitle hover:bg-slate-100 rounded-lg transition-colors"
            onClick={() => onViewPatient?.(patient)}
          >
            Ver Paciente
          </button>
          <button
            className="px-4 py-2 text-caption-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
            onClick={() => onOpenConsulta?.(apontamento)}
          >
            Abrir Consulta
          </button>
        </div>
      </div>
    </div>
  );
}