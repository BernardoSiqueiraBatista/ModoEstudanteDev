import React from 'react';
import SetupPlanoModal from './SetupPlanoModal';

export default function StudyPlansPage() {
  const [openModal, setOpenModal] = React.useState(false);

  const plans = [
    {
      title: 'Residência em Cardiologia',
      progress: 68,
      tag: 'Especialização',
      status: 'Ativo',
      active: true,
    },
    {
      title: 'Intensivo de Emergência',
      progress: 42,
      tag: 'Urgência',
      status: 'Ativo',
      active: true,
    },
    {
      title: 'Atualização em Farmacologia',
      progress: 15,
      tag: 'Atualização',
      status: 'Em Pausa',
      active: false,
    },
    {
      title: 'Board Exams USA - Step 1',
      progress: 92,
      tag: 'Certificação',
      status: 'Ativo',
      active: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#191c21] font-['Inter'] pb-16">
      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-5 pt-20">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#005aa8] shadow-[0_0_10px_rgba(0,90,168,0.7)]" />

            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#005aa8]">
              Clinical Learning Lab
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Meus Planos de Estudo
          </h1>

          <p className="text-[#414752] max-w-2xl leading-relaxed text-sm">
            Gerencie seus cronogramas de especialização e revisão clínica com
            precisão algorítmica.
          </p>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* NOVO PLANO */}
          <button
            onClick={() => setOpenModal(true)}
            className="min-h-[240px] rounded-[2rem] border border-dashed border-[#c1c6d4] hover:border-[#005aa8] hover:bg-white/50 transition-all duration-300 flex flex-col items-center justify-center group"
          >
            <div className="w-14 h-14 rounded-full bg-[#ecedf6] flex items-center justify-center mb-3 group-hover:bg-[#005aa8]/10 transition-colors">
              <span className="material-symbols-outlined text-[#005aa8] text-3xl">
                add
              </span>
            </div>

            <span className="text-lg font-bold text-[#005aa8]">
              Novo Plano
            </span>

            <span className="text-sm text-[#414752] mt-1">
              Definir novos objetivos clínicos
            </span>
          </button>

          {/* CARDS */}
          {plans.map((plan) => (
            <div
              key={plan.title}
              className="rounded-[2rem] border border-white/40 bg-white/60 backdrop-blur-[40px] p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-5">
                  <span className="px-3 py-1 rounded-full bg-[#005aa8]/5 text-[#005aa8] text-[10px] uppercase tracking-[0.15em] font-bold">
                    {plan.tag}
                  </span>

                  {plan.active ? (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-green-100 bg-green-50">
                      <div className="w-2 h-2 rounded-full bg-green-500" />

                      <span className="text-[10px] font-bold uppercase text-green-700">
                        {plan.status}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-[#e0e2ea] bg-[#e0e2ea]/20">
                      <div className="w-2 h-2 rounded-full bg-[#717783]" />

                      <span className="text-[10px] font-bold uppercase text-[#414752]">
                        {plan.status}
                      </span>
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold mb-4">
                  {plan.title}
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#414752]">
                    <span>Progresso do Módulo</span>
                    <span>{plan.progress}%</span>
                  </div>

                  <div className="w-full h-2 rounded-full overflow-hidden bg-[#ecedf6]">
                    <div
                      className="h-full rounded-full bg-[#005aa8]"
                      style={{ width: `${plan.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#e0e2ea]/40 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button className="w-9 h-9 rounded-full hover:bg-white transition-all flex items-center justify-center outline-none border-none focus:outline-none">
                    <span className="material-symbols-outlined text-[#414752] hover:text-[#005aa8]">
                      visibility
                    </span>
                  </button>

                  <button className="w-9 h-9 rounded-full hover:bg-white transition-all flex items-center justify-center outline-none border-none focus:outline-none">
                    <span className="material-symbols-outlined text-[#414752] hover:text-[#005aa8]">
                      edit
                    </span>
                  </button>
                </div>

                <button className="w-9 h-9 rounded-full hover:bg-white transition-all flex items-center justify-center outline-none border-none focus:outline-none">
                  <span className="material-symbols-outlined text-[#414752] hover:text-red-500">
                    delete
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL */}
      <SetupPlanoModal
        open={openModal}
        onClose={() => setOpenModal(false)}
      />
    </div>
  );
}