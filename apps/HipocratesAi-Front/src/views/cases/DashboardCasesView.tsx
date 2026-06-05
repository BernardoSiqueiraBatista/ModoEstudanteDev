import React, { useState } from 'react';
import PopupIniciarCaseView from './PopupIniciarCaseView';

export default function HipocratesDashboard() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 selection:bg-blue-100">
      
      {/* Main Content - Enquadrado com max-w-7xl */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header & Greeting */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Olá, Dr. Aris Thorne</h1>
          </div>
        </header>

        {/* NEW Metrics Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          
          {/* Card 1: Total de Casos Resolvidos */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Casos Resolvidos</span>
              <span className="material-symbols-outlined text-blue-500 text-[18px]">fact_check</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-slate-800 tracking-tight">142</span>
              <span className="text-xs font-semibold text-slate-400">total</span>
            </div>
          </div>

          {/* Card 2: Assertividade Média */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assertividade</span>
              <span className="material-symbols-outlined text-emerald-500 text-[18px]">track_changes</span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-800 tracking-tight">88%</span>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">+3%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '88%' }}></div>
              </div>
            </div>
          </div>

          {/* Card 3: Tempo Médio por Caso */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tempo Médio</span>
              <span className="material-symbols-outlined text-amber-500 text-[18px]">timer</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-800 tracking-tight">12<span className="text-lg text-slate-500">m</span> 45<span className="text-lg text-slate-500">s</span></span>
              <span className="text-xs font-semibold text-slate-400 ml-1">/ caso</span>
            </div>
          </div>

          {/* Card 4: Distribuição por Especialidade (Donut Chart CSS Nativo) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-32">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Especialidades</span>
            <div className="flex items-center gap-4 mt-1">
              {/* Donut Chart visual feito com conic-gradient */}
              <div 
                className="relative w-12 h-12 rounded-full flex-shrink-0 shadow-sm" 
                style={{ background: 'conic-gradient(#2563eb 0% 55%, #10b981 55% 85%, #f59e0b 85% 100%)' }}
              >
                <div className="absolute inset-2 bg-white rounded-full"></div>
              </div>
              
              {/* Legenda do Gráfico */}
              <div className="flex flex-col gap-1 w-full justify-center">
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>Clínica</span>
                  <span>55%</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Emerg.</span>
                  <span>30%</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Cirurgia</span>
                  <span>15%</span>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* Main Grid: Feed (Esquerda) e Analytics (Direita) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Side: Cases Feed (Ocupa 2/3 da tela) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold tracking-tight text-slate-800">Casos Disponíveis</h2>
              <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                <button className="px-4 py-1.5 bg-slate-800 text-white rounded-full text-xs font-semibold whitespace-nowrap shadow-sm">Todos</button>
                <button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-full text-xs font-semibold whitespace-nowrap transition-colors">Clínica</button>
                <button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-full text-xs font-semibold whitespace-nowrap transition-colors">Emergência</button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Case Card 1 */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estável • R1</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight">Dispneia Progressiva</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">Paciente 64 anos, histórico de tabagismo e insuficiência cardíaca apresentando piora...</p>
                </div>
                <button 
                  onClick={() => setIsPopupOpen(true)}
                  className="w-full mt-6 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Iniciar Caso
                </button>
              </div>

              {/* Case Card 2 */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-red-200 transition-all group flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Crítico • R3</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight">Trauma Torácico</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">Vítima de colisão automobilística em alta velocidade. Hipotensão, taquicardia...</p>
                </div>
                <button 
                  onClick={() => setIsPopupOpen(true)}
                  className="w-full mt-6 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Iniciar Caso
                </button>
              </div>

              {/* Case Card 3 */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estável • Especialista</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight">Arritmia Atrial</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">Paciente jovem com palpitações paroxísticas e síncope ocasional. ECG demonstra...</p>
                </div>
                <button 
                  onClick={() => setIsPopupOpen(true)}
                  className="w-full mt-6 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Iniciar Caso
                </button>
              </div>

              {/* Case Card 4 */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-red-200 transition-all group flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Crítico • R1</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight">Anafilaxia Aguda</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">Reação alérgica grave pós-administração de contraste. Estridor laríngeo...</p>
                </div>
                <button 
                  onClick={() => setIsPopupOpen(true)}
                  className="w-full mt-6 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Iniciar Caso
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Analytics & Evolution (Ocupa 1/3 da tela) */}
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-xl font-bold tracking-tight text-slate-800 hidden lg:block mb-4">Analytics</h2>
            
            <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between h-[360px]">
              <h3 className="text-sm font-bold text-slate-800 mb-8">Evolução Semanal</h3>
              
              {/* Gráfico de Barras Refinado */}
              <div className="flex-1 flex items-end justify-between gap-2 border-b border-slate-100 pb-2">
                {[40, 65, 50, 85, 70, 30, 55].map((height, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group">
                    <div 
                      className={`w-full max-w-[12px] rounded-t-sm transition-all duration-500 ${idx === 4 ? 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]' : 'bg-slate-200 group-hover:bg-blue-300'}`} 
                      style={{ height: `${height}%` }}
                    ></div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase mt-2 px-1">
                <span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span className="text-blue-600">Sex</span><span>Sáb</span><span>Dom</span>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-800">Eficiência Diagnóstica</span>
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">+12%</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">Seu tempo de resposta médio reduziu em 45 segundos nesta semana.</p>
              </div>
            </section>
            
            {/* Simulações Pausadas (Card Lateral) */}
            <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
               <h3 className="text-sm font-bold text-slate-800 mb-4">Em andamento</h3>
               <div className="space-y-4">
                  <div className="flex items-center gap-4 group cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:border-blue-200 transition-colors">
                      <span className="material-symbols-outlined text-blue-600 text-[20px]">medical_services</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-800">Choque Séptico</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                           <div className="bg-blue-600 h-full w-[65%] rounded-full"></div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">65%</span>
                      </div>
                    </div>
                  </div>
               </div>
            </section>
          </div>
        </div>
      </main>

      {/* Bottom Mobile Nav */}
      <nav className="fixed bottom-0 inset-x-0 z-50 flex justify-around items-center px-2 py-3 lg:hidden bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col items-center justify-center text-blue-600 p-2">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
          <span className="text-[10px] font-semibold mt-1">Início</span>
        </div>
        <div className="flex flex-col items-center justify-center text-slate-400 hover:text-slate-900 transition-colors cursor-pointer p-2">
          <span className="material-symbols-outlined text-2xl">medical_services</span>
          <span className="text-[10px] font-medium mt-1">Casos</span>
        </div>
        <div className="flex flex-col items-center justify-center text-slate-400 hover:text-slate-900 transition-colors cursor-pointer p-2">
          <span className="material-symbols-outlined text-2xl">trending_up</span>
          <span className="text-[10px] font-medium mt-1">Evolução</span>
        </div>
        <div className="flex flex-col items-center justify-center text-slate-400 hover:text-slate-900 transition-colors cursor-pointer p-2">
          <span className="material-symbols-outlined text-2xl">person</span>
          <span className="text-[10px] font-medium mt-1">Perfil</span>
        </div>
      </nav>

      {/* Renderização Condicional do Popup */}
      {isPopupOpen && (
        <PopupIniciarCaseView onClose={() => setIsPopupOpen(false)} />
      )}
    </div>
  );
}