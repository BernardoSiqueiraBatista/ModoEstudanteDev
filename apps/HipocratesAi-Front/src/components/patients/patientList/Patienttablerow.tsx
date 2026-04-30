import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PatientApiItem } from '@hipo/contracts';

interface PatientTableRowProps {
  patient: PatientApiItem;
  onEdit?: () => void;
  onDelete?: () => void;
}

function getStatusBadge(status: PatientApiItem['status']) {
  const baseClass =
    'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all';
  switch (status) {
    case 'ativo':
      return (
        <span className={`${baseClass} bg-blue-50 text-[#0066FF] border-blue-100`}>
          Ativo
        </span>
      );
    case 'followup':
      return (
        <span className={`${baseClass} bg-slate-50 text-slate-500 border-slate-200/60`}>
          Follow-up
        </span>
      );
    case 'pendente':
      return (
        <span className={`${baseClass} bg-gray-50 text-gray-400 border-gray-100`}>
          Pendente
        </span>
      );
  }
}

function getInitialsClasses(status: PatientApiItem['status']) {
  if (status === 'ativo') {
    return 'bg-blue-50 border-blue-100 text-[#0066FF]';
  }
  return 'bg-slate-50 border-slate-100 text-slate-400';
}

export default function PatientTableRow({
  patient,
  onEdit,
  onDelete,
}: PatientTableRowProps) {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewDetails = () => navigate(`/pacientes/${patient.id}`);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(false);
    onEdit?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(false);
    onDelete?.();
  };

  return (
    <tr
      className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer"
      onClick={handleViewDetails}
    >
      <td className="px-8 py-5">
        <div className="flex items-center gap-4">
          <div
            className={`size-9 rounded-full border flex items-center justify-center text-[10px] font-bold ${getInitialsClasses(
              patient.status,
            )}`}
          >
            {patient.initials}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{patient.name}</p>
            <p className="text-[11px] text-slate-400">
              {patient.gender}, {patient.age} anos
            </p>
          </div>
        </div>
      </td>

      <td className="px-6 py-5">
        <span className="font-mono text-[10px] text-slate-500 font-medium">
          {patient.recordNumber}
        </span>
      </td>

      <td className="px-6 py-5">
        <p className="text-xs font-medium text-slate-600">
          {patient.mainDiagnosis ?? (
            <span className="italic text-slate-400">Sem diagnóstico</span>
          )}
        </p>
      </td>

      <td className="px-6 py-5">{getStatusBadge(patient.status)}</td>

      <td className="px-6 py-5">
        {patient.lastConsultation ? (
          <>
            <p className="text-slate-600 font-medium text-xs">
              {patient.lastConsultation.date}
            </p>
            <p className="text-[10px] text-slate-400">
              {patient.lastConsultation.doctor}
            </p>
          </>
        ) : (
          <p className="text-[11px] text-slate-400 italic">Sem consultas</p>
        )}
      </td>

      <td className="px-8 py-5 text-right">
        <div className="relative inline-block" ref={dropdownRef}>
          <button
            type="button"
            aria-label="Ações"
            className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors border border-transparent hover:border-slate-100"
            onClick={e => {
              e.stopPropagation();
              setIsDropdownOpen(s => !s);
            }}
          >
            <span className="material-icon">more_horiz</span>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-[100]">
              <button
                type="button"
                onClick={handleEdit}
                className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
              >
                <span className="material-icon text-lg text-slate-500">edit</span>
                <span>Editar Paciente</span>
              </button>
              <div className="border-t border-slate-100"></div>
              <button
                type="button"
                onClick={handleDelete}
                className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
              >
                <span className="material-icon text-lg text-red-500">delete</span>
                <span>Deletar Paciente</span>
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
