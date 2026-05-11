import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ConsultationHeader from '../../components/consulta/active/ConsultationHeader';
import MessageThread from '../../components/consulta/active/MessageThread';
import FloatingActions from '../../components/consulta/active/FloatingActions';
import CognitiveSupport from '../../components/consulta/active/CognitiveSupport';
import ClinicalReasoningPopup from '../../components/consulta/active/ClinicalReasoningPopUp';
import { useConsultation } from '../../hooks/useConsultations';
import { useConsultationStream } from '../../hooks/useConsultationStream';
import { usePatient } from '../../hooks/usePatients';
import {
  isAlert,
  isChecklist,
  isExamRequest,
  isHypothesis,
  isMedicalInsight,
  isOrientation,
  isReferral,
  mapInsightsToUi,
} from '../../mappers/insights';
import type { InsightRow, TranscriptRow } from '@hipo/contracts';
import { useConfirm } from '../../components/ui/ConfirmationProvider';
import { buildRedFlags, groupFlagsByTranscript } from '../../lib/flagMatcher';

type SpeakerKind = 'MD' | 'PT' | 'AI';

function mapSpeaker(s: string | null | undefined): SpeakerKind {
  if (!s) return 'PT';
  if (s === 'doctor' || s === 'MD') return 'MD';
  if (s === 'AI' || s === 'ai') return 'AI';
  return 'PT';
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function buildMessages(
  initial: TranscriptRow[],
  live: TranscriptRow[],
  partials: Record<string, string>,
) {
  const base = live.length >= initial.length ? live : initial;
  const finals = base.map(t => ({
    id: t.id,
    speaker: mapSpeaker(t.speaker),
    text: t.text,
    timestamp: undefined,
  }));
  const partialItems = Object.entries(partials).map(([speaker, text]) => ({
    id: `partial-${speaker}`,
    speaker: mapSpeaker(speaker),
    text,
    isAI: false as const,
  }));
  return [...finals, ...partialItems];
}

function buildClinicalNote(insights: InsightRow[]) {
  const note = insights.find(i => i.kind === 'clinical_note');
  const insight = insights.find(i => i.kind === 'medical_insight' || i.kind === 'keypoint');
  return {
    hda: note?.content ?? '',
    clinicalImpression: insight ? [insight.content] : [],
  };
}

const HYPOTHESIS_COLORS = ['emerald', 'amber', 'blue', 'rose'];

export default function ActiveConsultationView() {
  const { id: consultationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const consultationQuery = useConsultation(consultationId);
  const consultation = consultationQuery.data?.consultation;
  const patientQuery = usePatient(consultation?.patient_id);
  const patient = patientQuery.data;

  // O hook abre o WS de state automaticamente quando recebe o consultationId.
  // Logo, "abrir o WS assim que a consulta se inicia" já é comportamento
  // padrão. O recorder é opt-in via FloatingActions para não pedir mic
  // sem ação explícita do usuário.
  const stream = useConsultationStream(consultationId);

  const [duration, setDuration] = useState('00:00');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isPopupMinimized, setIsPopupMinimized] = useState(false);

  useEffect(() => {
    if (!consultation?.started_at) return;
    const startMs = new Date(consultation.started_at).getTime();
    const tick = () => {
      const seconds = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setDuration(formatDuration(seconds));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [consultation?.started_at]);

  const insights: InsightRow[] = useMemo(
    () =>
      stream.liveInsights.length
        ? stream.liveInsights
        : (consultationQuery.data?.insights ?? []),
    [stream.liveInsights, consultationQuery.data?.insights],
  );

  const uiInsights = useMemo(() => mapInsightsToUi(insights), [insights]);

  const transcripts = useMemo<TranscriptRow[]>(() => {
    const live = stream.transcripts;
    const initial = consultationQuery.data?.transcripts ?? [];
    return live.length >= initial.length ? live : initial;
  }, [stream.transcripts, consultationQuery.data?.transcripts]);

  // Mapeamento alerta ↔ frase do transcript para o sublinhado vermelho.
  const flagsByTranscript = useMemo(() => {
    const flags = buildRedFlags(insights, transcripts);
    return groupFlagsByTranscript(flags);
  }, [insights, transcripts]);

  const cognitiveData = useMemo(
    () => ({
      hypotheses: uiInsights
        .filter(isHypothesis)
        .filter(h => h.acknowledged !== 'not_useful' && h.acknowledged !== 'dismissed')
        .map((h, idx) => ({
          id: h.id,
          title: h.title,
          confidence:
            h.confidence >= 70
              ? ('High' as const)
              : h.confidence >= 40
                ? ('Moderate' as const)
                : ('Low' as const),
          percentage: h.confidence,
          color: HYPOTHESIS_COLORS[idx % HYPOTHESIS_COLORS.length],
        })),
      examRequests: uiInsights.filter(isExamRequest).map(e => ({
        id: e.id,
        name: e.name,
        status: 'pending' as const,
      })),
      referrals: uiInsights.filter(isReferral).map(r => ({ id: r.id, name: r.name })),
      orientations: uiInsights.filter(isOrientation).map(o => ({ id: o.id, text: o.text })),
      clinicalNote: buildClinicalNote(insights),
      checklistItems: uiInsights.filter(isChecklist).map(c => ({
        id: c.id,
        label: c.label,
        checked: c.checked,
      })),
      alerts: uiInsights.filter(isAlert).map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        type:
          a.severity === 'critical'
            ? ('critical' as const)
            : a.severity === 'warning'
              ? ('warning' as const)
              : ('info' as const),
      })),
      medicalInsight: {
        text: uiInsights.find(isMedicalInsight)?.text ?? '',
      },
    }),
    [uiInsights, insights],
  );

  const messages = useMemo(
    () =>
      buildMessages(
        consultationQuery.data?.transcripts ?? [],
        stream.transcripts,
        stream.partialBySpeaker,
      ),
    [consultationQuery.data?.transcripts, stream.transcripts, stream.partialBySpeaker],
  );

  if (consultationQuery.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Carregando consulta...</p>
      </div>
    );
  }

  if (consultationQuery.error || !consultation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-red-600">
          {consultationQuery.error instanceof Error
            ? consultationQuery.error.message
            : 'Consulta não encontrada.'}
        </p>
      </div>
    );
  }

  const handleEndSession = async () => {
    const ok = await confirm({
      tone: 'warning',
      title: 'Encerrar consulta?',
      description:
        'A gravação será interrompida e você será levado para o resumo de encerramento.',
      confirmLabel: 'Encerrar',
      cancelLabel: 'Continuar',
    });
    if (ok) {
      void stream.stopRecording();
      navigate(`/consulta/encerramento/${consultation.id}`);
    }
  };

  const handleToggleChat = () => {
    if (isPopupOpen && !isPopupMinimized) setIsPopupMinimized(true);
    else if (isPopupOpen && isPopupMinimized) setIsPopupMinimized(false);
    else {
      setIsPopupOpen(true);
      setIsPopupMinimized(false);
    }
  };

  const handleConfirmHypothesis = (id: string) => stream.ackInsight(id, 'useful');
  const handleDismissHypothesis = (id: string) => stream.ackInsight(id, 'dismissed');

  // Auto-inicia o recorder assim que o WS de state abrir. Sem isso o áudio
  // nunca é capturado e Deepgram não devolve transcript. Em caso de erro
  // (mic negado), reseta a flag para permitir retry pelo botão.
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (autoStartedRef.current) return;
    if (stream.status !== 'open') return;
    if (!consultation?.started_at) return;
    autoStartedRef.current = true;
    void stream.startRecording().catch(() => {
      autoStartedRef.current = false;
    });
  }, [stream.status, consultation?.started_at, stream.startRecording]);

  const handleToggleRecord = () => {
    if (stream.isRecording) void stream.stopRecording();
    else void stream.startRecording();
  };

  // Mapeia o status do WS num indicador discreto ao lado do título.
  const wsDot =
    stream.status === 'open'
      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
      : stream.status === 'connecting' || stream.status === 'reconnecting'
        ? 'bg-amber-400 animate-pulse'
        : 'bg-slate-300';
  return (
    <div className="flex h-full w-full relative overflow-hidden">
      <main className="flex-1 flex min-h-0 overflow-hidden">
        <section className="flex-1 flex flex-col min-h-0 relative bg-gradient-to-b from-white to-slate-50/30 dark:from-black dark:to-slate-950/20">
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <ConsultationHeader
              patientName={patient?.name ?? 'Paciente'}
              age={patient?.age ?? 0}
              mainComplaint={patient?.mainDiagnosis ?? 'Consulta em andamento'}
              duration={duration}
              statusDotClass={wsDot}
              onBack={() => navigate(-1)}
            />
            <MessageThread messages={messages} flagsByTranscript={flagsByTranscript} />
          </div>

          {stream.error && (
            <div className="absolute top-4 right-6 px-3 py-1.5 rounded-lg bg-red-50 border border-red-100 text-[10px] font-semibold text-red-600 z-30">
              {stream.error}
            </div>
          )}

          <FloatingActions
            onEndSession={handleEndSession}
            onToggleChat={handleToggleChat}
            onToggleRecord={handleToggleRecord}
            isRecording={stream.isRecording}
          />

          <ClinicalReasoningPopup
            isOpen={isPopupOpen}
            isMinimized={isPopupMinimized}
            isMaximized={false}
            patientName={patient?.name ?? ''}
            duration={duration}
            onClose={() => {
              setIsPopupOpen(false);
              setIsPopupMinimized(false);
            }}
            onMinimize={() => setIsPopupMinimized(true)}
            onExpand={() => setIsPopupMinimized(false)}
            onMaximize={() => {
              setIsPopupOpen(false);
              navigate(`/consulta/raciocinio/${consultation.id}`, {
                state: { patientName: patient?.name, duration },
              });
            }}
          />
        </section>

        <CognitiveSupport
          data={cognitiveData}
          onConfirmHypothesis={handleConfirmHypothesis}
          onDismissHypothesis={handleDismissHypothesis}
        />
      </main>
    </div>
  );
}
