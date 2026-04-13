// data/ClinicalData.ts
import type { TimelineEvent, Hypothesis, Treatment, CognitiveSummary } from '../types/PatientTypes';
import { patients } from './PatientsData';

// ============================================
// Dados clínicos da paciente Ana Martins (id: '1')
// ============================================

// Timeline (Histórico) - Ana Martins
export const anaMartinsTimeline: TimelineEvent[] = [
  {
    id: 'a1',
    patientId: patients[0].id,
    date: 'Hoje',
    title: 'Cefaleia e Novos Sintomas Neurológicos',
    doctor: patients[0].lastConsultation.doctor,
    specialty: 'Consulta de Retorno',
    type: 'consulta',
    hypotheses: [
      {
        id: 'h1',
        patientId: patients[0].id,
        title: 'Cefaleia Tensional',
        description:
          'Considerada devido ao padrão de pressão na nuca e histórico de estresse ocupacional.',
        status: 'ativo',
        confidence: 85,
        createdAt: '2024-02-15',
      },
      {
        id: 'h2',
        patientId: patients[0].id,
        title: 'Crise Hipertensiva',
        description: 'Avaliada em tempo real após relato de tontura ao levantar.',
        status: 'investigando',
        confidence: 60,
        createdAt: '2024-02-15',
      },
    ],
    isExpanded: true,
    confidence: 'Alta',
  },
  {
    id: 'a2',
    patientId: patients[0].id,
    date: '15 Fev 2024',
    title: 'Acompanhamento de Hipertensão',
    doctor: patients[0].lastConsultation.doctor,
    specialty: 'Consulta de Rotina',
    type: 'consulta',
    tags: ['Pressão Controlada', 'Ajuste de Medicação'],
  },
  {
    id: 'a3',
    patientId: patients[0].id,
    date: '10 Jan 2024',
    title: 'Primeira Consulta - Diagnóstico de Hipertensão',
    doctor: patients[0].lastConsultation.doctor,
    specialty: 'Consulta Inicial',
    type: 'consulta',
    quote:
      '"Paciente apresenta níveis pressóricos elevados em medições repetidas. Iniciaremos tratamento com Losartana."',
  },
];

// Hipóteses - Ana Martins
export const anaMartinsHypotheses: Hypothesis[] = [
  {
    id: 'h1',
    patientId: patients[0].id,
    title: 'Cefaleia Tensional',
    description:
      'Padrão de dor compressiva bilateral na região frontal e occipital, associada a estresse ocupacional e tensão muscular na região cervical. Melhora com analgésicos comuns.',
    status: 'ativo',
    confidence: 85,
    createdAt: '2024-02-15',
    lastUpdate: '2024-02-20',
  },
  {
    id: 'h2',
    patientId: patients[0].id,
    title: 'Crise Hipertensiva',
    description:
      'Episódios de elevação pressórica associados a tontura e cefaleia occipital, possivelmente relacionados a picos de estresse. Monitoramento domiciliar sugerido.',
    status: 'investigando',
    confidence: 60,
    createdAt: '2024-02-15',
    lastUpdate: '2024-02-18',
  },
  {
    id: 'h3',
    patientId: patients[0].id,
    title: 'Efeito Colateral de Medicação',
    description:
      'Possibilidade de cefaleia como efeito adverso da medicação anti-hipertensiva. Descartada após ajuste de horário.',
    status: 'descartado',
    confidence: 15,
    createdAt: '2024-01-20',
    lastUpdate: '2024-01-25',
  },
];

// Tratamentos - Ana Martins
export const anaMartinsTreatments: Treatment[] = [
  {
    id: 't1',
    patientId: patients[0].id,
    name: 'Losartana',
    description: 'Anti-hipertensivo para controle pressórico',
    status: 'em_andamento',
    startDate: '2024-01-15',
    medications: [
      {
        id: 'm1',
        name: 'Losartana Potássica',
        dosage: '50mg',
        frequency: '1x ao dia',
        duration: 'Contínuo',
      },
    ],
  },
  {
    id: 't2',
    patientId: patients[0].id,
    name: 'Acompanhamento Nutricional',
    description: 'Dieta com restrição de sódio para controle pressórico',
    status: 'em_andamento',
    startDate: '2024-01-20',
  },
];

// Sumário Cognitivo - Ana Martins
export const anaMartinsCognitiveSummary: CognitiveSummary = {
  primaryFocus:
    'Diferenciação entre cefaleia tensional e crise hipertensiva como causa da cefaleia atual.',
  resolvedPhase: 'Hipertensão controlada com medicação atual. Paciente aderente ao tratamento.',
  ruledOut: ['Efeito colateral de medicação', 'Enxaqueca Clássica', 'Problemas Oftalmológicos'],
  longitudinalInsight:
    'Picos de estresse no ambiente de trabalho correlacionam com 85% dos episódios de elevação pressórica registrados.',
  correlationPercentage: 85,
};

// ============================================
// Dados clínicos do paciente João Silva (id: '2')
// ============================================

// Timeline (Histórico) - João Silva
export const joaoSilvaTimeline: TimelineEvent[] = [
  {
    id: 'j1',
    patientId: patients[1].id,
    date: '20 Jan 2024',
    title: 'Acompanhamento de Diabetes',
    doctor: patients[1].lastConsultation.doctor,
    specialty: 'Consulta de Retorno',
    type: 'consulta',
    tags: ['Glicemia Controlada', 'Follow-up Agendado'],
    isExpanded: false,
  },
  {
    id: 'j2',
    patientId: patients[1].id,
    date: '10 Dez 2023',
    title: 'Primeira Consulta - Diagnóstico de Diabetes tipo 2',
    doctor: patients[1].lastConsultation.doctor,
    specialty: 'Consulta Inicial',
    type: 'consulta',
    quote:
      '"Paciente apresenta glicemia de jejum elevada e histórico familiar positivo. Iniciaremos Metformina e orientação nutricional."',
  },
];

// Hipóteses - João Silva
export const joaoSilvaHypotheses: Hypothesis[] = [
  {
    id: 'h4',
    patientId: patients[1].id,
    title: 'Resistência Insulínica',
    description:
      'Paciente apresenta histórico familiar de diabetes tipo 2 e necessidade de ajuste na medicação atual devido a picos glicêmicos pós-prandiais.',
    status: 'ativo',
    confidence: 75,
    createdAt: '2024-01-20',
    lastUpdate: '2024-01-25',
  },
  {
    id: 'h5',
    patientId: patients[1].id,
    title: 'Neuropatia Diabética Inicial',
    description:
      'Paciente relata formigamento ocasional em membros inferiores. Investigação em andamento.',
    status: 'investigando',
    confidence: 40,
    createdAt: '2024-01-20',
    lastUpdate: '2024-01-22',
  },
  {
    id: 'h6',
    patientId: patients[1].id,
    title: 'Síndrome Metabólica',
    description:
      'Considerada inicialmente, mas paciente já apresenta controle de dislipidemia com dieta.',
    status: 'descartado',
    confidence: 20,
    createdAt: '2023-12-15',
    lastUpdate: '2024-01-05',
  },
];

// Tratamentos - João Silva
export const joaoSilvaTreatments: Treatment[] = [
  {
    id: 't3',
    patientId: patients[1].id,
    name: 'Metformina',
    description: 'Controle glicêmico para diabetes tipo 2',
    status: 'em_andamento',
    startDate: '2023-12-15',
    medications: [
      {
        id: 'm3',
        name: 'Metformina',
        dosage: '850mg',
        frequency: '2x ao dia',
        duration: 'Contínuo',
      },
    ],
  },
  {
    id: 't4',
    patientId: patients[1].id,
    name: 'Acompanhamento Nutricional',
    description: 'Dieta para controle glicêmico e perda de peso',
    status: 'em_andamento',
    startDate: '2023-12-20',
  },
  {
    id: 't5',
    patientId: patients[1].id,
    name: 'Atividade Física Orientada',
    description: 'Caminhada 30 minutos diários',
    status: 'concluido',
    startDate: '2024-01-01',
    endDate: '2024-02-01',
  },
];

// Sumário Cognitivo - João Silva
export const joaoSilvaCognitiveSummary: CognitiveSummary = {
  primaryFocus:
    'Otimização do controle glicêmico e prevenção de complicações crônicas do diabetes.',
  resolvedPhase: 'Paciente atingiu metas iniciais de controle glicêmico com Metformina isolada.',
  ruledOut: ['Diabetes tipo 1', 'Hipertensão Arterial', 'Dislipidemia Grave'],
  longitudinalInsight:
    'Picos glicêmicos pós-prandiais correlacionam com 70% dos episódios de fadiga relatados pelo paciente.',
  correlationPercentage: 70,
};

// ============================================
// Funções auxiliares para buscar dados por paciente
// ============================================

// Buscar timeline por patientId
export const getTimelineByPatientId = (patientId: string): TimelineEvent[] => {
  const timelines: Record<string, TimelineEvent[]> = {
    '1': anaMartinsTimeline,
    '2': joaoSilvaTimeline,
  };
  return timelines[patientId] || [];
};

// Buscar hipóteses por patientId
export const getHypothesesByPatientId = (patientId: string): Hypothesis[] => {
  const hypotheses: Record<string, Hypothesis[]> = {
    '1': anaMartinsHypotheses,
    '2': joaoSilvaHypotheses,
  };
  return hypotheses[patientId] || [];
};

// Buscar tratamentos por patientId
export const getTreatmentsByPatientId = (patientId: string): Treatment[] => {
  const treatments: Record<string, Treatment[]> = {
    '1': anaMartinsTreatments,
    '2': joaoSilvaTreatments,
  };
  return treatments[patientId] || [];
};

// Buscar sumário cognitivo por patientId
export const getCognitiveSummaryByPatientId = (patientId: string): CognitiveSummary | undefined => {
  const summaries: Record<string, CognitiveSummary> = {
    '1': anaMartinsCognitiveSummary,
    '2': joaoSilvaCognitiveSummary,
  };
  return summaries[patientId];
};
