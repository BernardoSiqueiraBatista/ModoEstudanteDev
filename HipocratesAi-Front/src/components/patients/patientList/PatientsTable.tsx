import React from 'react';
import PatientTableRow from './Patienttablerow';
import type { Patient } from '../../../types/PatientTypes';

interface PatientsTableProps {
  patients: Patient[];
  currentPage: number;
  totalPages: number;
  totalPatients: number;
  onPageChange: (page: number) => void;
  onPatientClick?: (patient: Patient) => void;
  onEditPatient?: (patient: Patient) => void;
  onDeletePatient?: (patient: Patient) => void;
}

export default function PatientsTable({
  patients,
  currentPage,
  totalPages,
  totalPatients,
  onPageChange,
  onPatientClick,
  onEditPatient,
  onDeletePatient,
}: PatientsTableProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages === 0) {
      pages.push(1);
      return pages;
    }
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const startIndex = patients.length === 0 ? 0 : (currentPage - 1) * 4 + 1;
  const endIndex = Math.min(currentPage * 4, totalPatients);

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

      {/* Table - Removido overflow-hidden */}
      <div className="w-full">
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
                onEdit={() => onEditPatient?.(patient)}
                onDelete={() => onDeletePatient?.(patient)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-8 flex items-center justify-between border-t border-white/40 pt-6">
        <span className="text-caption text-slate-500 font-medium">
          Mostrando <span className="font-semibold text-slate-700">{startIndex}</span> -{' '}
          <span className="font-semibold text-slate-700">{endIndex}</span> de{' '}
          <span className="font-semibold text-slate-700">{totalPatients}</span> pacientes
        </span>
        
        <div className="flex items-center gap-1">
          <button
            className={`size-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
              currentPage === 1
                ? 'text-slate-300 bg-white/20 cursor-not-allowed'
                : 'text-slate-600 bg-white/40 hover:bg-white hover:shadow-md hover:scale-105 active:scale-95'
            }`}
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <span className="material-icon text-lg">chevron_left</span>
          </button>
          
          {getPageNumbers().map((page, index) => {
            const isActive = page === currentPage;
            const isEllipsis = page === '...';
            
            if (isEllipsis) {
              return (
                <span key={index} className="size-9 rounded-xl flex items-center justify-center text-sm text-slate-400">
                  ...
                </span>
              );
            }
            
            return (
              <button
                key={index}
                className={`size-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-md font-bold'
                    : 'bg-white/50 text-slate-700 hover:bg-white hover:shadow-md hover:scale-105 active:scale-95'
                }`}
                onClick={() => onPageChange(page as number)}
              >
                {page}
              </button>
            );
          })}

          <button
            className={`size-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
              currentPage === totalPages || totalPages === 0
                ? 'text-slate-300 bg-white/20 cursor-not-allowed'
                : 'text-slate-600 bg-white/40 hover:bg-white hover:shadow-md hover:scale-105 active:scale-95'
            }`}
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <span className="material-icon text-lg">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}