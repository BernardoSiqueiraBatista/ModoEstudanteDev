import React from 'react';
import PatientTableRow from './Patienttablerow';
import type { Patient } from '../../types/PatientTypes';

interface PatientsTableProps {
  patients: Patient[];
  currentPage?: number;
  totalPages?: number;
  totalPatients?: number;
  onPageChange?: (page: number) => void;
  onPatientClick?: (patient: Patient) => void;
}

export default function PatientsTable({
  patients,
  currentPage = 1,
  totalPages = 43,
  totalPatients = 128,
  onPageChange,
  onPatientClick,
}: PatientsTableProps) {
  return (
    <div className="liquid-glass rounded-bubble p-12">
      <div className="edge-refraction"></div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex gap-8">
          <button className="text-label-sm font-semibold text-title relative pb-2 border-b-2 border-graphite">
            Todos os Pacientes
          </button>
          <button className="text-label-sm font-medium text-subtitle hover:text-slate-600 pb-2 transition-colors">
            Meus Atendimentos
          </button>
          <button className="text-label-sm font-medium text-subtitle hover:text-slate-600 pb-2 transition-colors">
            Críticos
          </button>
        </div>
        <div className="flex items-center gap-3 text-subtitle">
          <span className="text-caption-bold uppercase tracking-widest">Filtrar por:</span>
          <span className="material-icon text-lg cursor-pointer hover:text-title">
            filter_list
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-hidden">
        <table className="w-full text-left border-separate border-spacing-y-4">
          <thead>
            <tr className="text-caption-bold text-subtitle uppercase tracking-[0.2em]">
              <th className="px-6 pb-2">Paciente</th>
              <th className="px-6 pb-2">Prontuário</th>
              <th className="px-6 pb-2">Última Consulta</th>
              <th className="px-6 pb-2">Status AI</th>
              <th className="px-6 pb-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="text-body-sm">
            {patients.map((patient) => (
              <PatientTableRow
                key={patient.id}
                patient={patient}
                onViewDetails={() => onPatientClick?.(patient)}
                onMoreActions={() => console.log('More actions:', patient.name)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-12 flex items-center justify-between border-t border-white/40 pt-8">
        <span className="text-caption text-subtitle font-medium">
          Exibindo {patients.length} de {totalPatients} pacientes
        </span>
        <div className="flex gap-2">
          <button
            className="size-8 rounded-lg flex items-center justify-center border border-white/60 bg-white/20 text-subtitle hover:bg-white/60 transition-colors"
            onClick={() => currentPage > 1 && onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <span className="material-icon text-sm">chevron_left</span>
          </button>
          
          {[1, 2, 3].map((page) => (
            <button
              key={page}
              className={`size-8 rounded-lg flex items-center justify-center text-caption font-medium transition-colors ${
                page === currentPage
                  ? 'bg-graphite text-white font-bold'
                  : 'border border-white/60 bg-white/20 text-slate-600 hover:bg-white/60'
              }`}
              onClick={() => onPageChange?.(page)}
            >
              {page}
            </button>
          ))}

          <button
            className="size-8 rounded-lg flex items-center justify-center border border-white/60 bg-white/20 text-subtitle hover:bg-white/60 transition-colors"
            onClick={() => currentPage < totalPages && onPageChange?.(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <span className="material-icon text-sm">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}