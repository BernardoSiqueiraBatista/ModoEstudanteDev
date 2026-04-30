import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../../hooks/usePatients';
import { useCreateConsultation } from '../../hooks/useConsultations';
import type { Apontamento } from '../../data/WeekCalendarData';
import { useToast } from '../ui/ToastProvider';

interface OpenConsultationModalProps {
  isOpen: boolean;
  apontamento: Apontamento | null;
  onClose: () => void;
}

export default function OpenConsultationModal({
  isOpen,
  apontamento,
  onClose,
}: OpenConsultationModalProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);

  const patientId = apontamento?.patient.id;
  const { data: patientDetails } = usePatient(isOpen ? patientId : undefined);
  const createConsultation = useCreateConsultation();

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const t = window.requestAnimationFrame(() => setShown(true));
      return () => window.cancelAnimationFrame(t);
    }
    setShown(false);
    const t = window.setTimeout(() => setMounted(false), 260);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!mounted || !apontamento) return null;

  const patient = apontamento.patient;
  const mainComplaint =
    patientDetails?.mainDiagnosis ??
    'Sem queixa principal registrada para este paciente.';
  const lastAccess = patientDetails?.lastConsultation?.date ?? '—';

  const consultationLabel =
    apontamento.type === 'urgencia'
      ? 'Urgência'
      : apontamento.type === 'video'
        ? 'Teleconsulta'
        : apontamento.type === 'compromisso'
          ? 'Compromisso'
          : 'Consulta Geral';

  const statusLabel =
    patient.status === 'ativo'
      ? 'Prontuário Ativo'
      : patient.status === 'followup'
        ? 'Em Acompanhamento'
        : 'Pendente';

  const handleStartConsultation = async () => {
    if (!patient.id) return;
    try {
      const res = await createConsultation.mutateAsync({
        patientId: patient.id,
        ...(apontamento.id ? { appointmentId: apontamento.id } : {}),
      });
      onClose();
      navigate(`/consulta/ativa/${res.consultation.id}`);
    } catch (e) {
      toast.error(
        'Erro ao iniciar consulta',
        e instanceof Error ? e.message : 'Tente novamente em instantes.',
      );
    }
  };

  const handleViewHistory = () => {
    onClose();
    navigate(`/pacientes/${patient.id}`);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-[#29343a]/10 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Iniciar Atendimento"
      style={{
        opacity: shown ? 1 : 0,
        transition: 'opacity 220ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Liquid Glass Modal Card */}
      <div
        className="relative w-full max-w-xl liquid-glass rounded-[40px] shadow-[0_32px_120px_rgba(41,52,58,0.12)] overflow-hidden border border-white/50"
        style={{
          opacity: shown ? 1 : 0,
          transform: shown
            ? 'translateY(0) scale(1)'
            : 'translateY(8px) scale(0.97)',
          transition:
            'opacity 240ms cubic-bezier(0.22, 1, 0.36, 1), transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Header */}
        <header className="flex justify-between items-center px-10 pt-10 pb-6">
          <div className="flex flex-col">
            <h1 className="text-[#29343a] font-bold text-2xl tracking-tight">
              Iniciar Atendimento
            </h1>
            <p className="text-[#566168] text-[13px] font-medium tracking-wide">
              Apontamento das {apontamento.startTime} • {consultationLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#e1e9f0]/50 text-[#29343a] hover:bg-[#d9e4ec] transition-colors active:scale-95 duration-200"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </header>

        {/* Main Content Area */}
        <div className="px-10 pb-10 space-y-8">
          {/* Patient Summary */}
          <section className="p-8 rounded-[32px] bg-white/40 border border-white/60 shadow-sm space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-white text-xl font-bold">
                {patient.initials}
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-extrabold text-[#29343a] tracking-tighter">
                  {patient.name}
                </h2>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      patient.status === 'ativo'
                        ? 'bg-blue-500'
                        : patient.status === 'followup'
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                    }`}
                  ></span>
                  <span className="text-xs font-bold text-[#566168] uppercase tracking-wider">
                    {statusLabel}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-y-4 pt-2 border-t border-white/40">
              <div className="flex items-center gap-2 text-[#566168]">
                <span className="material-symbols-outlined text-lg">person</span>
                <span className="text-sm font-medium">{patient.gender}</span>
              </div>
              <div className="flex items-center gap-2 text-[#566168]">
                <span className="material-symbols-outlined text-lg">
                  calendar_month
                </span>
                <span className="text-sm font-medium">{patient.age} anos</span>
              </div>
              <div className="flex items-center gap-2 text-[#566168]">
                <span className="material-symbols-outlined text-lg">
                  fingerprint
                </span>
                <span className="text-sm font-medium">{patient.recordNumber}</span>
              </div>
              <div className="flex items-center gap-2 text-[#566168]">
                <span className="material-symbols-outlined text-lg">history</span>
                <span className="text-sm font-medium">
                  Último acesso: {lastAccess}
                </span>
              </div>
            </div>
          </section>

          {/* Session Configuration */}
          <section className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#566168] opacity-60">
                  Contexto da Visão
                </span>
                <button
                  type="button"
                  onClick={handleViewHistory}
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  Ver histórico completo
                </button>
              </div>
              <div className="p-4 rounded-2xl bg-[#f0f4f8]/40 border border-white/40">
                <p className="text-sm text-[#566168]">{mainComplaint}</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#566168] opacity-60 ml-1">
                Queixa Principal
              </span>
              <div className="flex items-center gap-3 px-6 py-4 rounded-3xl bg-slate-800 text-white shadow-lg shadow-slate-900/20">
                <span className="material-symbols-outlined text-[20px]">
                  medical_services
                </span>
                <span className="text-sm font-bold tracking-tight">
                  {consultationLabel}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="px-10 py-8 bg-[#f0f4f8]/30 flex items-center gap-4 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-4 rounded-full text-sm font-bold text-[#566168] hover:text-[#29343a] transition-colors active:scale-95 duration-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleStartConsultation}
            disabled={createConsultation.isPending}
            className="group relative flex items-center gap-1 overflow-hidden rounded-[100px] border-[1.5px] border-[#1A365D]/40 bg-transparent px-8 py-3 text-sm font-semibold text-[#1A365D] cursor-pointer transition-[color,border-color,border-radius] duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-transparent hover:text-white hover:rounded-[14px] active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {/* Left arrow (entra durante o hover) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-[-25%] z-[9] stroke-[#1A365D] group-hover:left-4 group-hover:stroke-white transition-[left,stroke] duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>

            {/* Texto */}
            <span className="relative z-[1] -translate-x-3 group-hover:translate-x-3 transition-transform duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)]">
              {createConsultation.isPending ? 'Iniciando...' : 'Iniciar Consulta'}
            </span>

            {/* Círculo azul que expande do centro no hover */}
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#1A365D] rounded-full opacity-0 group-hover:w-[280px] group-hover:h-[280px] group-hover:opacity-100 transition-[width,height,opacity] duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none"></span>

            {/* Right arrow (sai pra direita no hover) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute right-4 z-[9] stroke-[#1A365D] group-hover:right-[-25%] group-hover:stroke-white transition-[right,stroke] duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </footer>
      </div>
    </div>
  );
}
