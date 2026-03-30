import React, { useState, useRef, useEffect } from 'react';
import type { Patient } from '../../types/PatientTypes';

interface PatientTableRowProps {
  patient: Patient;
  onViewDetails?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function PatientTableRow({
  patient,
  onViewDetails,
  onEdit,
  onDelete,
}: PatientTableRowProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        <div className="relative" ref={dropdownRef}>
          <button
            className="p-2 hover:bg-slate-100 rounded-full text-subtitle transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
            aria-label="Ações"
          >
            <span className="material-icon">more_vert</span>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-[100]">
              <button
                className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
                onClick={handleEdit}
              >
                <span className="material-icon text-lg text-slate-500">edit</span>
                <span>Editar Paciente</span>
              </button>
              <div className="border-t border-slate-100"></div>
              <button
                className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                onClick={handleDelete}
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