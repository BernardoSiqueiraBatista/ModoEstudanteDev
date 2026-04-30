import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ClosureHeader from '../../components/consulta/closure/ClosureHeader';
import ClosureSummarySection from '../../components/consulta/closure/ClosureSummarySection';
import ClosureClinicalReasoning from '../../components/consulta/closure/ClosureClinicalReasoning';
import ClosureFooter from '../../components/consulta/closure/ClosureFooter';
import {
  useConsultation,
  useDraftSummary,
  useFinishConsultation,
} from '../../hooks/useConsultations';
import { usePatient } from '../../hooks/usePatients';
import { isExamRequest, isHypothesis, mapInsightsToUi } from '../../mappers/insights';
import type { InsightRow } from '@hipo/contracts';
import { useToast } from '../../components/ui/ToastProvider';
import { useConfirm } from '../../components/ui/ConfirmationProvider';

function buildSummary(opts: {
  draft: string | null;
  consultationSummary: string | null;
  insights: InsightRow[];
}) {
  const summaryText = opts.draft ?? opts.consultationSummary ?? '';
  // Tenta extrair seções heurísticamente do resumo gerado pela IA. Sem
  // estrutura confiável, mostramos o texto completo na queixa principal.
  return {
    mainComplaint: summaryText.slice(0, 1000),
    keyFindings: opts.insights
      .filter(i => i.kind === 'keypoint' || i.kind === 'medical_insight')
      .map(i => `• ${i.content}`)
      .join('\n'),
    therapeuticPlan: opts.insights
      .filter(i => i.kind === 'medication' || i.kind === 'orientation' || i.kind === 'referral')
      .map(i => `• ${i.content}`)
      .join('\n'),
  };
}

function buildDiagnoses(insights: InsightRow[]) {
  return mapInsightsToUi(insights)
    .filter(isHypothesis)
    .slice(0, 8)
    .map((h, i) => ({
      id: h.id,
      title: h.title,
      description: h.description || `Confiança: ${h.confidence}%`,
      status: (i === 0 ? 'confirmed' : h.confidence >= 50 ? 'considered' : 'discarded') as
        | 'confirmed'
        | 'considered'
        | 'discarded',
    }));
}

export default function ConsultationClosureView() {
  const { id: consultationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const consultationQuery = useConsultation(consultationId);
  const consultation = consultationQuery.data?.consultation;
  const insights = consultationQuery.data?.insights ?? [];
  const examRequests = mapInsightsToUi(insights).filter(isExamRequest);
  const patientQuery = usePatient(consultation?.patient_id);

  const draftMutation = useDraftSummary(consultationId ?? '');
  const finishMutation = useFinishConsultation(consultationId ?? '');

  const [draftText, setDraftText] = useState<string | null>(null);

  useEffect(() => {
    if (!consultation || draftText !== null) return;
    if (consultation.summary) {
      setDraftText(consultation.summary);
      return;
    }
    if (consultation.status !== 'in_progress') return;
    draftMutation
      .mutateAsync()
      .then(res => setDraftText(res.plainText))
      .catch(err => {
        console.error('[Closure] failed to draft summary', err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultation?.id]);

  const summary = useMemo(
    () =>
      buildSummary({
        draft: draftText,
        consultationSummary: consultation?.summary ?? null,
        insights,
      }),
    [draftText, consultation?.summary, insights],
  );

  const diagnoses = useMemo(() => buildDiagnoses(insights), [insights]);

  const handleCloseConsultation = async () => {
    if (!consultation) return;
    const ok = await confirm({
      tone: 'warning',
      title: 'Encerrar consulta?',
      description:
        'O resumo será gravado no prontuário do paciente. Esta ação não pode ser desfeita.',
      confirmLabel: 'Encerrar consulta',
      cancelLabel: 'Continuar atendendo',
    });
    if (!ok) return;
    try {
      await finishMutation.mutateAsync({ summaryOverride: summary.mainComplaint });
      toast.success('Consulta encerrada', 'O resumo foi salvo no prontuário do paciente.');
      navigate(`/pacientes/${consultation.patient_id}`);
    } catch (e) {
      toast.error(
        'Erro ao encerrar consulta',
        e instanceof Error ? e.message : 'Tente novamente em instantes.',
      );
    }
  };

  if (consultationQuery.isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (consultationQuery.error || !consultation) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <p className="text-red-600">
          {consultationQuery.error instanceof Error
            ? consultationQuery.error.message
            : 'Consulta não encontrada.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-white">
      <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center py-20 px-8 bg-[#fdfdfe]">
        <div className="max-w-4xl w-full space-y-12 pb-24">
          <ClosureHeader
            patientName={patientQuery.data?.name ?? 'Paciente'}
            patientId={consultation.patient_id}
          />

          {draftMutation.isPending && !draftText && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 text-center">
              Gerando rascunho do resumo via IA...
            </div>
          )}

          <ClosureSummarySection summary={summary} />

          <ClosureClinicalReasoning diagnoses={diagnoses} />

          {examRequests.length > 0 && (
            <section className="liquid-glass p-10 space-y-4">
              <h2 className="text-xs font-bold text-medical-navy uppercase tracking-[0.2em]">
                Exames Solicitados
              </h2>
              <ul className="space-y-2 text-sm text-slate-700">
                {examRequests.map(e => (
                  <li key={e.id}>• {e.name}</li>
                ))}
              </ul>
            </section>
          )}

          <ClosureFooter
            onCloseConsultation={handleCloseConsultation}
            isClosing={finishMutation.isPending}
          />
        </div>
      </main>
    </div>
  );
}
