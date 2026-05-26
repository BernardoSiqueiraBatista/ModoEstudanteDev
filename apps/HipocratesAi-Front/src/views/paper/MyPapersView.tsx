import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SetupPlanoModal from './SetupPlanoModal';

export default function MyPapers() {
  const [openModal, setOpenModal] = useState(false);

  const navigate = useNavigate();

  const notebooks = [
    {
      id: 1,
      categoria: 'Medicina Interna',
      titulo: 'Protocolos de Cardiologia 2024',
      descricao:
        'Análise profunda de arritmias, insuficiência cardíaca e novos manejos terapêuticos conforme diretrizes recentes.',
      icon: 'stethoscope',
      footer: 'ATUALIZADO HÁ 2H',
    },
    {
      id: 2,
      categoria: 'Genética',
      titulo: 'Sequenciamento Oncológico',
      descricao:
        'Estudos sobre biomarcadores em câncer de pulmão e respostas a imunoterapia personalizada.',
      icon: 'genetics',
      footer: 'ATUALIZADO ONTEM',
    },
    {
      id: 3,
      categoria: 'Neurologia',
      titulo: 'Mapeamento Cognitivo',
      descricao:
        'Notas sobre neuroplasticidade em pacientes pós-AVC e protocolos de reabilitação intensiva.',
      icon: 'neurology',
      footer: 'HÁ 3 DIAS',
    },
    {
      id: 4,
      categoria: 'Bioquímica',
      titulo: 'Análise Laboratorial Avançada',
      descricao:
        'Interpretação de exames complexos de eletrólitos e balanço ácido-base em pacientes críticos.',
      icon: 'biotech',
      footer: 'HÁ 1 SEMANA',
    },
  ];

  function handleOpenNotebook(notebook: any) {
    navigate(`/paper/${notebook.id}`, {
      state: notebook,
    });
  }

  return (
    <div className="bg-background min-h-screen text-on-surface font-body">
      <div className="pt-10 pb-16 px-4 md:px-6">
        <main className="max-w-[1280px] mx-auto">
          {/* HEADER */}
          <header className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-[3rem] leading-none font-extrabold tracking-tight mb-2">
                Laboratório de Estudo
              </h1>

              <p className="text-on-surface-variant max-w-xl text-sm font-medium leading-relaxed">
                Organize seus protocolos médicos e descobertas clínicas em um
                ambiente de alto desempenho.
              </p>
            </div>
          </header>

          {/* GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* CREATE */}
            <button
              onClick={() => setOpenModal(true)}
              className="group relative h-[320px] rounded-[2rem] bg-surface-container-low border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center hover:border-primary/50 hover:bg-white transition-all active:scale-[0.98]"
            >
              <div className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center mb-3 group-hover:bg-primary-container transition-colors">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant group-hover:text-primary">
                  add
                </span>
              </div>

              <span className="text-sm font-bold text-on-surface-variant group-hover:text-primary transition-colors">
                Criar novo notebook
              </span>
            </button>

            {/* NOTEBOOKS */}
            {notebooks.map((notebook) => (
              <div
                key={notebook.id}
                onClick={() => handleOpenNotebook(notebook)}
                className="group relative h-[320px] rounded-[2rem] p-5 flex flex-col overflow-hidden border border-white/40 bg-white/70 backdrop-blur-xl shadow-[0_10px_30px_rgba(41,52,58,0.05)] hover:-translate-y-1 transition-all cursor-pointer"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-container opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* TOP */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      {notebook.icon}
                    </span>
                  </div>

                  <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-on-surface-variant opacity-60 text-right">
                    {notebook.categoria}
                  </span>
                </div>

                {/* CONTENT */}
                <h3 className="text-[1.85rem] leading-[1.05] font-extrabold tracking-tight mb-3">
                  {notebook.titulo}
                </h3>

                <p className="text-[13px] leading-relaxed text-on-surface-variant line-clamp-4 mb-auto">
                  {notebook.descricao}
                </p>

                {/* FOOTER */}
                <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wide text-outline">
                    {notebook.footer}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      <SetupPlanoModal
        open={openModal}
        onClose={() => setOpenModal(false)}
      />
    </div>
  );
}