import { useState } from 'react';
import PatientTableRow from './Patienttablerow';
import type { PatientApiItem } from '@hipo/contracts';

type TabKey = 'all' | 'mine' | 'critical';

interface PatientsTableProps {
  patients: PatientApiItem[];
  currentPage: number;
  totalPages: number;
  totalPatients: number;
  onPageChange: (page: number) => void;
  onPatientClick?: (patient: PatientApiItem) => void;
  onEditPatient?: (patient: PatientApiItem) => void;
  onDeletePatient?: (patient: PatientApiItem) => void;
}

export default function PatientsTable({
  patients,
  currentPage,
  totalPages,
  totalPatients,
  onPageChange,
  onEditPatient,
  onDeletePatient,
}: PatientsTableProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages === 0) return [1];
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

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'Todos os Pacientes' },
    { key: 'mine', label: 'Meus Atendimentos' },
    { key: 'critical', label: 'Críticos' },
  ];

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      {/* Tabs Header */}
      <div className="p-6 border-b border-slate-50">
        <div className="flex gap-1 bg-slate-50 p-1 rounded-xl w-fit">
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
              <th className="px-8 py-5">Paciente</th>
              <th className="px-6 py-5">Prontuário</th>
              <th className="px-6 py-5">Diagnóstico Principal</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5">Última Consulta</th>
              <th className="px-8 py-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {patients.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-8 py-12 text-center text-sm text-slate-400 italic"
                >
                  Nenhum paciente encontrado.
                </td>
              </tr>
            ) : (
              patients.map(patient => (
                <PatientTableRow
                  key={patient.id}
                  patient={patient}
                  onEdit={() => onEditPatient?.(patient)}
                  onDelete={() => onDeletePatient?.(patient)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-6 flex items-center justify-between border-t border-slate-50">
        <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
          Página {currentPage} de {Math.max(totalPages, 1)} ·{' '}
          <span className="text-slate-600 font-semibold">{totalPatients}</span> pacientes
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            className={`size-8 rounded-lg flex items-center justify-center border transition-colors ${
              currentPage === 1
                ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50'
            }`}
          >
            <span className="material-icon text-sm">chevron_left</span>
          </button>

          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ell-${index}`}
                  className="size-8 rounded-lg flex items-center justify-center text-[10px] text-slate-400"
                >
                  ...
                </span>
              );
            }
            const isActive = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page as number)}
                className={`size-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors ${
                  isActive
                    ? 'bg-[var(--medical-navy)] text-white'
                    : 'border border-slate-100 bg-white text-slate-600 hover:bg-slate-50 font-medium'
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            type="button"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            className={`size-8 rounded-lg flex items-center justify-center border transition-colors ${
              currentPage === totalPages || totalPages === 0
                ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50'
            }`}
          >
            <span className="material-icon text-sm">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
