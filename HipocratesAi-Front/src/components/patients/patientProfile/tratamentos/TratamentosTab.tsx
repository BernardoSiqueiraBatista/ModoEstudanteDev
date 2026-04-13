import React, { useState } from 'react';
import { getTreatmentsByPatientId } from '../../../../data/ClinicalData';
import type { Treatment } from '../../../../types/PatientTypes';

interface TratamentosTabProps {
  patientId: string;
}

export default function TratamentosTab({ patientId }: TratamentosTabProps) {
  const [filter, setFilter] = useState<'todos' | 'em_andamento' | 'concluido' | 'pendente'>(
    'todos'
  );

  const patientTreatments = getTreatmentsByPatientId(patientId);

  const filteredTreatments = patientTreatments.filter(t => {
    if (filter === 'todos') return true;
    return t.status === filter;
  });

  const getStatusColor = (status: Treatment['status']) => {
    switch (status) {
      case 'em_andamento':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'concluido':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pendente':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'interrompido':
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  const getStatusLabel = (status: Treatment['status']) => {
    switch (status) {
      case 'em_andamento':
        return 'Em Andamento';
      case 'concluido':
        return 'Concluído';
      case 'pendente':
        return 'Pendente';
      case 'interrompido':
        return 'Interrompido';
    }
  };

  const getFilterButtonClass = (filterValue: string) => {
    const isActive = filter === filterValue;
    return `px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
      isActive
        ? 'bg-gray-800 text-white shadow-md'
        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
    }`;
  };

  if (patientTreatments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <span className="material-symbols-outlined text-4xl mb-2">medication</span>
        <p className="text-sm">Nenhum tratamento registrado para este paciente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros - sempre visíveis */}
      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">
        <button onClick={() => setFilter('todos')} className={getFilterButtonClass('todos')}>
          Todos
        </button>
        <button
          onClick={() => setFilter('em_andamento')}
          className={getFilterButtonClass('em_andamento')}
        >
          Em Andamento
        </button>
        <button
          onClick={() => setFilter('concluido')}
          className={getFilterButtonClass('concluido')}
        >
          Concluídos
        </button>
        <button onClick={() => setFilter('pendente')} className={getFilterButtonClass('pendente')}>
          Pendentes
        </button>
      </div>

      {/* Contador de resultados */}
      <div className="text-xs text-gray-500">
        Mostrando {filteredTreatments.length} de {patientTreatments.length} tratamentos
      </div>

      {/* Lista de Tratamentos */}
      <div className="space-y-4">
        {filteredTreatments.map(treatment => (
          <div
            key={treatment.id}
            className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-base font-medium text-gray-800">{treatment.name}</h3>
              <span
                className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${getStatusColor(treatment.status)}`}
              >
                {getStatusLabel(treatment.status)}
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">{treatment.description}</p>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span>Início: {new Date(treatment.startDate).toLocaleDateString('pt-BR')}</span>
              {treatment.endDate && (
                <span>Término: {new Date(treatment.endDate).toLocaleDateString('pt-BR')}</span>
              )}
            </div>
            {treatment.medications && treatment.medications.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-700 mb-2">Medicações:</p>
                {treatment.medications.map(med => (
                  <div key={med.id} className="text-xs text-gray-600 ml-2 mb-1">
                    • {med.name} - {med.dosage}, {med.frequency} ({med.duration})
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredTreatments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <span className="material-symbols-outlined text-4xl mb-2">filter_alt_off</span>
          <p className="text-sm">Nenhum tratamento encontrado para este filtro.</p>
        </div>
      )}
    </div>
  );
}
