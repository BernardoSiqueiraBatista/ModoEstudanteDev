import React from 'react';
import type { Patient } from '../../../types/PatientTypes';

interface PatientSearchInputProps {
  value: string;
  onChange?: (value: string) => void;
  searchResults?: Patient[];
  onSelectPatient?: (patient: Patient) => void;
  showResults?: boolean;
}

export default function PatientSearchInput({
  value,
  onChange,
  searchResults = [],
  onSelectPatient,
  showResults = false,
}: PatientSearchInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 group">
          <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-600 transition-colors text-base">
            search
          </span>
          <input
            type="text"
            value={value}
            onChange={handleChange}
            className="w-full pl-7 pr-3 py-2 bg-transparent border-b border-gray-200 focus:border-gray-400 focus:outline-none transition-all placeholder:text-gray-400 font-light text-sm"
            placeholder="Nome do paciente, CPF ou prontuário..."
            autoComplete="off"
          />
        </div>
      </div>

      {/* Resultados da busca */}
      {showResults && searchResults.length > 0 && (
        <div
          className="absolute z-50 mt-2 w-full bg-white rounded-xl border border-gray-200 shadow-lg max-h-80 overflow-y-auto"
          style={{ top: '100%' }}
        >
          {searchResults.map(patient => (
            <button
              key={patient.id}
              onClick={() => onSelectPatient?.(patient)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{patient.name}</p>
                  <p className="text-xs text-gray-500">
                    {patient.recordNumber} • {patient.gender}, {patient.age} anos
                  </p>
                </div>
                <div className="text-xs text-gray-400">
                  {patient.mainDiagnosis && (
                    <span className="bg-gray-100 px-2 py-1 rounded-full text-xs">
                      {patient.mainDiagnosis.length > 20
                        ? patient.mainDiagnosis.substring(0, 20) + '...'
                        : patient.mainDiagnosis}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && searchResults.length === 0 && value.trim().length > 0 && (
        <div
          className="absolute z-50 mt-2 w-full bg-white rounded-xl border border-gray-200 shadow-lg p-4 text-center"
          style={{ top: '100%' }}
        >
          <p className="text-sm text-gray-500">Nenhum paciente encontrado.</p>
        </div>
      )}
    </div>
  );
}
