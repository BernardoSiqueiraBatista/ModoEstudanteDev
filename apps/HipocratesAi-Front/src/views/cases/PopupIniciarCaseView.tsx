import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const STUDENT_ID = 'e1925b44-9694-477c-a496-5e638e4a9e25';
const API = 'http://localhost:3333';

interface IniciarCaseProps {
  onClose: () => void;
  caseId: string;
}

export default function IniciarCase({ onClose, caseId }: IniciarCaseProps) {
  const [selectedMode, setSelectedMode] = useState<'hm' | 'osce' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleStart = async () => {
    if (!selectedMode || !caseId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/student/v1/cases/${caseId}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: STUDENT_ID, modo: selectedMode }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      const attemptId: string = data.attempt_id;

      if (selectedMode === 'hm') {
        sessionStorage.setItem('hm-attempt-id', attemptId);
        sessionStorage.setItem('hm-case-id', caseId);
      } else {
        sessionStorage.setItem('osce-attempt-id', attemptId);
        sessionStorage.setItem('osce-case-id', caseId);
      }

      onClose();
      navigate(selectedMode === 'osce' ? '/osce' : '/hm');
    } catch (e) {
      setError('Não foi possível iniciar o caso. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 sm:px-6">
      
      <div className="absolute inset-0 z-0 cursor-pointer" onClick={onClose} />

      {/* Main Modal Container */}
      <main className="relative z-10 w-full max-w-[720px] overflow-hidden rounded-3xl bg-white shadow-[0_32px_64px_rgba(0,0,0,0.15)] flex flex-col">
        
        <div className="p-8 md:p-10 flex flex-col">
          
          {/* Resumo do Caso */}
          <div className="mb-10 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-widest mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> Resumo do Caso
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-3">
              Dispneia Progressiva em Paciente Cardiopata
            </h1>
            <p className="text-sm md:text-base text-slate-500 leading-relaxed">
              Paciente de 64 anos, com histórico prévio de tabagismo e insuficiência cardíaca congestiva, dá entrada na emergência apresentando piora súbita da falta de ar aos menores esforços.
            </p>
          </div>

          {/* Seleção de Modelo */}
          <div className="space-y-4 mb-10">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
              Escolha o modelo de simulação
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card: Simulação HM */}
              <div 
                onClick={() => setSelectedMode('hm')}
                className={`cursor-pointer rounded-2xl p-5 border-2 transition-all duration-200 flex flex-col relative overflow-hidden ${
                  selectedMode === 'hm' 
                    ? 'border-blue-600 bg-blue-50/50 shadow-sm' 
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                {/* Radio indicator */}
                <div className="absolute top-5 right-5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-200">
                  <div className={`w-2.5 h-2.5 rounded-full transition-transform duration-200 ${
                    selectedMode === 'hm' ? 'bg-blue-600 scale-100' : 'scale-0'
                  }`} />
                  <div className={`absolute inset-0 rounded-full border-2 transition-colors duration-200 ${
                    selectedMode === 'hm' ? 'border-blue-600' : 'border-slate-300'
                  }`} />
                </div>

                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[20px]">school</span>
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 mb-2">Simulação HM</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed flex-1">
                  <strong>Aprendizado livre e guiado.</strong> Simulação convencional com suporte cognitivo, apoio do chatbot de IA e dicas ativas. Sem pressão de pontuação visível durante o atendimento.
                </p>
              </div>

              {/* Card: Simulação OSCE */}
              <div 
                onClick={() => setSelectedMode('osce')}
                className={`cursor-pointer rounded-2xl p-5 border-2 transition-all duration-200 flex flex-col relative overflow-hidden ${
                  selectedMode === 'osce' 
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
                }`}
              >
                {/* Radio indicator */}
                <div className="absolute top-5 right-5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-200">
                  <div className={`w-2.5 h-2.5 rounded-full transition-transform duration-200 ${
                    selectedMode === 'osce' ? 'bg-indigo-600 scale-100' : 'scale-0'
                  }`} />
                  <div className={`absolute inset-0 rounded-full border-2 transition-colors duration-200 ${
                    selectedMode === 'osce' ? 'border-indigo-600' : 'border-slate-300'
                  }`} />
                </div>

                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[20px]">fact_check</span>
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 mb-2">Simulação OSCE</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed flex-1">
                  <strong>Foco em avaliação.</strong> Alcance metas realizando procedimentos corretos. Feedbacks instantâneos de pontuação e relatório consolidado apenas no final.
                </p>
              </div>

            </div>
          </div>

          {/* Actions */}
          <div className="w-full flex items-center justify-between mt-auto pt-6 border-t border-slate-100">
            <button 
              onClick={onClose}
              className="px-6 py-3 text-[13px] font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
            >
              Cancelar
            </button>

            <button
              onClick={handleStart}
              disabled={!selectedMode || loading}
              className={`
                px-8 py-3 rounded-xl text-[13px] font-bold uppercase tracking-wider shadow-sm transition-all duration-300 flex items-center gap-2
                ${selectedMode && !loading
                  ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
              `}
            >
              <span>{loading ? 'Iniciando...' : 'Avançar'}</span>
              <span className="material-symbols-outlined text-[18px]">
                {loading ? 'progress_activity' : 'arrow_forward'}
              </span>
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-500 text-center mt-3 font-semibold">{error}</p>
          )}
        </div>
      </main>
    </div>
  );
}