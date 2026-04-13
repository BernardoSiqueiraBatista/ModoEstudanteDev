import React, { useState } from 'react';
import { getHypothesesByPatientId } from '../../../../data/ClinicalData';
import type { Hypothesis } from '../../../../types/PatientTypes';

interface HipotesesTabProps {
  patientId: string;
}

export default function HipotesesTab({ patientId }: HipotesesTabProps) {
  const [filter, setFilter] = useState<'todas' | 'ativo' | 'investigando' | 'descartado'>('todas');

  const patientHypotheses = getHypothesesByPatientId(patientId);

  const filteredHypotheses = patientHypotheses.filter(h => {
    if (filter === 'todas') return true;
    return h.status === filter;
  });

  const getStatusColor = (status: Hypothesis['status']) => {
    switch (status) {
      case 'ativo':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'investigando':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'descartado':
        return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const getStatusLabel = (status: Hypothesis['status']) => {
    switch (status) {
      case 'ativo':
        return 'Ativa';
      case 'investigando':
        return 'Em Investigação';
      case 'descartado':
        return 'Descartada';
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

  if (patientHypotheses.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <span className="material-symbols-outlined text-4xl mb-2">psychology</span>
        <p className="text-sm">Nenhuma hipótese registrada para este paciente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros - sempre visíveis */}
      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">
        <button onClick={() => setFilter('todas')} className={getFilterButtonClass('todas')}>
          Todas
        </button>
        <button onClick={() => setFilter('ativo')} className={getFilterButtonClass('ativo')}>
          Ativas
        </button>
        <button
          onClick={() => setFilter('investigando')}
          className={getFilterButtonClass('investigando')}
        >
          Em Investigação
        </button>
        <button
          onClick={() => setFilter('descartado')}
          className={getFilterButtonClass('descartado')}
        >
          Descartadas
        </button>
      </div>

      {/* Contador de resultados */}
      <div className="text-xs text-gray-500">
        Mostrando {filteredHypotheses.length} de {patientHypotheses.length} hipóteses
      </div>

      {/* Lista de Hipóteses */}
      <div className="space-y-4">
        {filteredHypotheses.map(hypothesis => (
          <div
            key={hypothesis.id}
            className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-base font-medium text-gray-800">{hypothesis.title}</h3>
              <span
                className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${getStatusColor(hypothesis.status)}`}
              >
                {getStatusLabel(hypothesis.status)}
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">{hypothesis.description}</p>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Confiança: {hypothesis.confidence}%</span>
              <span>Criado em: {new Date(hypothesis.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
            {hypothesis.lastUpdate && (
              <div className="mt-2 text-xs text-gray-400">
                Última atualização: {new Date(hypothesis.lastUpdate).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredHypotheses.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <span className="material-symbols-outlined text-4xl mb-2">filter_alt_off</span>
          <p className="text-sm">Nenhuma hipótese encontrada para este filtro.</p>
        </div>
      )}
    </div>
  );
}
