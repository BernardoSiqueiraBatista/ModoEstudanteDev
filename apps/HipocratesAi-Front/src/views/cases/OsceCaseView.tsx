import React, { useState, useEffect } from 'react';

export default function OsceCaseView() {
  const [showToast, setShowToast] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowToast(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 selection:bg-blue-100 relative overflow-hidden">
      
      {/* Simulação de Notificação Temporária (Toast) */}
      <div className={`fixed top-24 right-4 z-50 transition-all duration-500 transform ${showToast ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}>
        <div className="bg-emerald-600 text-white px-3 py-2.5 rounded-xl shadow-lg flex items-center gap-2.5 border border-emerald-500">
          <div className="bg-white/20 p-1 rounded-md flex items-center justify-center">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
          </div>
          <div>
            <p className="text-xs font-bold tracking-wide">+15 pts — Ausculta Cardíaca</p>
            <p className="text-[9px] text-emerald-100 font-medium">Procedimento correto registrado</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Header de Identificação do Paciente */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600"></span>
              </span>
              <span className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">Ambiente de Simulação OSCE</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Maria Eduarda Santos
              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-md uppercase tracking-wider">32 Anos</span>
            </h1>
            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide mt-1">
              Queixa Principal: Cefaleia tensional persistente
            </p>
          </div>
          
          <button className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[16px]">flag</span>
            <span className="text-xs font-bold uppercase tracking-wider">Finalizar Sessão</span>
          </button>
        </header>

        {/* Layout Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Coluna Esquerda (2/3): Transcrição e Chat */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[580px] relative">
            
            {/* Histórico da Consulta */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-slate-200">
              
              {/* Doctor Message */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">MD</div>
                <div className="w-full max-w-[90%]">
                  <p className="text-sm leading-relaxed text-slate-700 bg-white border border-slate-200 p-3.5 rounded-xl rounded-tl-none shadow-sm">
                    Bom dia, Maria. Como você tem se sentido desde nossa última consulta sobre as dores de cabeça?
                  </p>
                </div>
              </div>

              {/* Patient Message */}
              <div className="flex gap-3 flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">PT</div>
                <div className="w-full max-w-[90%]">
                  <p className="text-sm leading-relaxed text-slate-800 bg-blue-50 border border-blue-100 p-3.5 rounded-xl rounded-tr-none shadow-sm">
                    Bom dia, Doutor. Na verdade, as dores pioraram um pouco. Agora sinto uma pressão muito forte na região da nuca, especialmente quando acordo. Às vezes sinto uma leve tontura também.
                  </p>
                </div>
              </div>

              {/* Doctor Action Log */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-slate-400">stethoscope</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Ação: Ausculta Cardíaca e Pulmonar</span>
                </div>
              </div>

              {/* Patient Response to Action */}
              <div className="flex gap-3 flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">PT</div>
                <div className="w-full max-w-[90%]">
                  <p className="text-sm leading-relaxed text-slate-800 bg-blue-50 border border-blue-100 p-3.5 rounded-xl rounded-tr-none shadow-sm">
                    <span className="block text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Achados</span>
                    Ritmo cardíaco regular, em 2 tempos, bulhas normofonéticas, sem sopros. Murmúrio vesicular presente bilateralmente, sem ruídos adventícios.
                  </p>
                </div>
              </div>

              {/* Doctor Message */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">MD</div>
                <div className="w-full max-w-[90%]">
                  <p className="text-sm leading-relaxed text-slate-700 bg-white border border-slate-200 p-3.5 rounded-xl rounded-tl-none shadow-sm">
                    Certo, seu coração e pulmões estão ótimos. Você mencionou uma tontura. Além disso, sentiu mais alguma coisa diferente recentemente?
                  </p>
                </div>
              </div>

              {/* Patient Message */}
              <div className="flex gap-3 flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">PT</div>
                <div className="w-full max-w-[90%]">
                  <p className="text-sm leading-relaxed text-slate-800 bg-blue-50 border border-blue-100 p-3.5 rounded-xl rounded-tr-none shadow-sm">
                    Ontem à noite eu senti um formigamento no braço esquerdo, mas durou poucos minutos e passou. Achei que tinha dormido por cima do braço.
                  </p>
                </div>
              </div>

            </div>

            {/* Input Area */}
            <div className="bg-slate-50 border-t border-slate-200 p-3 flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-white hover:shadow-sm hover:text-slate-700 transition-all border border-transparent hover:border-slate-200">
                  <span className="material-symbols-outlined text-[20px]">mic</span>
                </button>
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    placeholder="Faça uma pergunta ou prescreva..." 
                    className="w-full bg-white border border-slate-300 rounded-xl pl-4 pr-10 py-2.5 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-inner"
                  />
                  <button className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[16px]">send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita (1/3): Ferramentas Clínicas */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* Monitor de Sinais Vitais */}
            <div className="bg-slate-900 rounded-2xl p-5 shadow-lg border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <span className="material-symbols-outlined text-6xl text-white">monitor_heart</span>
              </div>
              <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Sinais Vitais</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/40 rounded-lg p-2.5 border border-white/5">
                  <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">FC (bpm)</span>
                  <p className="text-2xl font-light text-emerald-400 mt-0.5 tabular-nums animate-pulse">84</p>
                </div>
                <div className="bg-black/40 rounded-lg p-2.5 border border-white/5">
                  <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">SpO2 (%)</span>
                  <p className="text-2xl font-light text-blue-400 mt-0.5 tabular-nums">98</p>
                </div>
                <div className="bg-black/40 rounded-lg p-2.5 border border-white/5">
                  <span className="text-[8px] font-bold text-rose-400 uppercase tracking-widest">PA (mmHg)</span>
                  <p className="text-xl font-light text-rose-400 mt-0.5 tabular-nums">140x90</p>
                </div>
                <div className="bg-black/40 rounded-lg p-2.5 border border-white/5">
                  <span className="text-[8px] font-bold text-amber-400 uppercase tracking-widest">Temp (°C)</span>
                  <p className="text-xl font-light text-amber-400 mt-0.5 tabular-nums">36.8</p>
                </div>
              </div>
            </div>

            {/* Painel de Ações Clínicas */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
              
              {/* Cronômetro */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="material-symbols-outlined text-[18px]">timer</span>
                  <span className="text-xs font-semibold uppercase tracking-wider">Tempo</span>
                </div>
                <span className="text-2xl font-bold text-slate-800 tabular-nums tracking-tight">14:32</span>
              </div>

              {/* Botões de Ação */}
              <div className="space-y-2.5">
                <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ações</h3>
                
                <button className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-all group">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-white shadow-sm flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">front_hand</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700">Exame Físico</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-blue-500">chevron_right</span>
                </button>

                <button className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-all group">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-white shadow-sm flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">biotech</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700">Solicitar Exames</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-blue-500">chevron_right</span>
                </button>

                <button className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-all group">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-white shadow-sm flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">prescriptions</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700">Conduta / Prescrição</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-blue-500">chevron_right</span>
                </button>

              </div>
            </div>
          </div>

        </div>
      </main>

      
    </div>
  );
}