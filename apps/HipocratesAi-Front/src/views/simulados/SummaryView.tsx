import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";

interface ClinicalSummaryProps {
  onClose?: () => void;
}

export default function SummaryView({ onClose }: ClinicalSummaryProps) {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Tempo para a animação terminar
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  if (!isVisible && !onClose) return null;

  return (
    <div className="font-['Inter'] selection:bg-blue-600/10 overflow-hidden h-screen w-full relative bg-[#f7f9fc]">
      {/* Background Content Layer (Dimmed Dashboard) */}
      <div className="fixed inset-0 z-0 flex flex-col p-8 opacity-40 grayscale-[0.3] pointer-events-none scale-[1.02]">
        <div className="w-full max-w-7xl mx-auto space-y-10">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-[#d9e4ec] rounded-full"></div>
              <div className="h-10 w-64 bg-[#e1e9f0] rounded-xl"></div>
            </div>
            <div className="flex gap-4">
              <div className="h-12 w-12 bg-[#d9e4ec] rounded-full"></div>
              <div className="h-12 w-32 bg-[#d9e4ec] rounded-xl"></div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-6">
            <div className="h-40 bg-[#f0f4f8] rounded-3xl"></div>
            <div className="h-40 bg-[#f0f4f8] rounded-3xl"></div>
            <div className="h-40 bg-[#f0f4f8] rounded-3xl"></div>
            <div className="h-40 bg-[#f0f4f8] rounded-3xl"></div>
          </div>
          <div className="h-96 bg-[#f0f4f8] rounded-3xl w-full"></div>
        </div>
      </div>

      {/* Modal Backdrop */}
      <div 
        className={`fixed inset-0 z-40 bg-[#29343a]/10 backdrop-blur-[4px] flex items-center justify-center p-6 transition-all duration-300 ${
          !isVisible ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {/* Clinical Summary Pop-up */}
        <div className="relative w-full max-w-[840px] max-h-[90vh] overflow-hidden bg-white/75 backdrop-blur-md backdrop-saturate-150 border border-white/30 rounded-[2.5rem] shadow-[0_32px_80px_rgba(41,52,58,0.12)] flex flex-col animate-in fade-in zoom-in duration-500">
          
          {/* Header */}
          <header className="flex items-center justify-between px-10 py-8 border-b border-[#d9e4ec]/20">
            <div className="flex items-center gap-6">
              <img
                alt="Hipócrates.ai Logo"
                className="h-10 w-auto opacity-90"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBujCkkQFBPdW2Df_67xuh4beaYflDAAz02D5uxffsKkS2B9hbDrzBbpTXJZ890yHbNdL-j9y3Es4ss3pbLvZLiNXHqxo9AFqXtFL43myEOs91APiXsJ9KTnesK6c6oyw9gVoH9Re9ZlmYdxZZtcki4zNCUEStudsa5BmITEEdW65fbo9Lrn4_a3n3aR0PJX5tOLTK-RVxc6Qg4DjFlAk0RLYkUltJGR9Lkw0v4ckoCyENMQjOMRdhgOdCv6ilY5UEzovEmqORejk1Y"
              />
              <div className="w-px h-8 bg-[#a8b3bb]/30"></div>
              <div className="space-y-0.5">
                <h1 className="text-[#29343a] font-bold text-xl tracking-tight">
                  Resumo do Plano: Intensivo Cardio
                </h1>
                <p className="text-[#566168] text-sm font-medium tracking-wide">
                  Gerado em 29 de Maio, 2026
                </p>
              </div>
            </div>
            <button 
              onClick={handleClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#d9e4ec]/50 transition-colors group"
            >
              <span className="material-symbols-outlined text-[#566168] group-hover:text-[#29343a]">
                close
              </span>
            </button>
          </header>

          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto px-10 py-8 space-y-10 scrollbar-thin scrollbar-thumb-[#d9e4ec] scrollbar-track-transparent">
            {/* Section 1: Síntese Clínica */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-blue-600 text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  analytics
                </span>
                <h2 className="text-[#29343a] font-semibold text-lg">Síntese Clínica</h2>
              </div>
              <div className="p-6 rounded-3xl bg-white/50 border border-white/40 shadow-sm">
                <p className="text-[#566168] leading-relaxed">
                  Plano mensal focado em Cardiologia e Nefrologia, com carga horária de 4h/dia. O foco principal é a consolidação de protocolos de ECG e manejo de distúrbios hidroeletrolíticos.
                </p>
              </div>
            </section>

            {/* Section 2: LLM Insights */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-[#526073] text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  psychology
                </span>
                <h2 className="text-[#29343a] font-semibold text-lg">Destaques e Decadências</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Highlights */}
                <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100 space-y-3 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                    <span className="material-symbols-outlined text-[100px] text-blue-600">check_circle</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600">
                    <span className="material-symbols-outlined text-[18px]">trending_up</span>
                    <span className="text-sm font-bold uppercase tracking-widest">Destaque Positivo</span>
                  </div>
                  <p className="text-[#29343a] font-medium leading-snug">
                    Boa aderência ao cronograma (92% dos blocos cumpridos)
                  </p>
                </div>

                {/* Decadence/Attention */}
                <div className="p-6 rounded-3xl bg-red-50 border border-red-100 space-y-3 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                    <span className="material-symbols-outlined text-[100px] text-red-600">warning</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-600">
                    <span className="material-symbols-outlined text-[18px]">timer_off</span>
                    <span className="text-sm font-bold uppercase tracking-widest">Ponto de Atenção</span>
                  </div>
                  <p className="text-[#29343a] font-medium leading-snug">
                    Tempo médio elevado em simulados (+18% vs. meta). Severidade média.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3: AI Recommendations */}
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#566168] text-[20px]">
                  lightbulb
                </span>
                <h2 className="text-[#29343a] font-semibold text-lg">Próximos Passos Sugeridos</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recommendation Card 1 */}
                <div 
                  onMouseMove={handleMouseMove}
                  className="bg-white/90 shadow-[0_12px_40px_rgba(41,52,58,0.04)] hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(41,52,58,0.08)] transition-all duration-300 p-6 rounded-[2rem] flex flex-col justify-between min-h-[160px] border border-white"
                >
                  <div className="space-y-2">
                    <span className="px-3 py-1 bg-[#e8eff4] rounded-full text-[10px] font-bold text-[#566168] uppercase tracking-wider">
                      Alta Prioridade
                    </span>
                    <h3 className="text-[#29343a] font-bold text-lg">Revisar ECG</h3>
                    <p className="text-[#566168] text-sm">Foco em Bradiarritmias e Bloqueios.</p>
                  </div>
                  <button className="mt-6 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-6 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.25)] transition-all active:scale-95 hover:shadow-lg hover:bg-blue-700">
                    <span className="text-sm">Abrir Material</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>

                {/* Recommendation Card 2 */}
                <div 
                  onMouseMove={handleMouseMove}
                  className="bg-white/90 shadow-[0_12px_40px_rgba(41,52,58,0.04)] hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(41,52,58,0.08)] transition-all duration-300 p-6 rounded-[2rem] flex flex-col justify-between min-h-[160px] border border-white"
                >
                  <div className="space-y-2">
                    <span className="px-3 py-1 bg-[#e8eff4] rounded-full text-[10px] font-bold text-[#566168] uppercase tracking-wider">
                      Simulado Pendente
                    </span>
                    <h3 className="text-[#29343a] font-bold text-lg">Refazer Nefrologia</h3>
                    <p className="text-[#566168] text-sm">Reforçar IRA e distúrbios do Potássio.</p>
                  </div>
                  <button
                    onClick={() => navigate("/simulados/rapido")}
                    className="mt-6 flex items-center justify-center gap-2 bg-[#29343a] text-[#f7f9fc] font-bold py-3 px-6 rounded-2xl transition-all active:scale-95 hover:shadow-lg hover:bg-blue-900"
                  >
                    <span className="text-sm">Iniciar Simulado</span>
                    <span className="material-symbols-outlined text-[18px]">
                      play_circle
                    </span>
                  </button>
                </div>
              </div>
            </section>
          </main>

          {/* Footer */}
          <footer className="px-10 py-8 bg-white/80 backdrop-blur-md border-t border-[#d9e4ec]/20 flex items-center justify-end gap-4 z-10">
            <button className="px-8 py-4 text-[#566168] font-semibold hover:text-[#29343a] hover:bg-[#e1e9f0]/30 rounded-2xl transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">refresh</span>
              <span>Regenerar Insights</span>
            </button>
            <button 
              onClick={() => navigate("/dashboard")}
              className="px-10 py-4 bg-gradient-to-r from-blue-700 to-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Fechar Summary
            </button>
          </footer>

          {/* Decorative Organic Element */}
          <div className="absolute -bottom-10 -left-10 w-64 h-64 opacity-[0.08] pointer-events-none">
            <img
              alt="Liquid Aesthetic Background Decor"
              className="w-full h-full object-cover rounded-full blur-2xl"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAb6c2wypwunPezMpU0BfdIfWproiRw2yjC-l6k8b72xWCxnrTco5DX41ZP9KSptSWTsQqPROfI5Xbm6NDDA3t4T33H-fk7FEQNodQ8gnsrSZsNyWjIWyMQ6L7p3Oq58hVOcCS1CTsV4LDy_BoAGQMHpmEQgGwtiuBeiq5ReQS_790C9LC5IAaBMc_l79I9l44k4voFsdVVVYVJjlTp8QDunt-kVR5_QZE-uyUlI8LD9nEIXGoDIM2A3vAJ9M1yltW1QpY06yq8zZx8"
            />
          </div>
        </div>
      </div>
    </div>
  );
}