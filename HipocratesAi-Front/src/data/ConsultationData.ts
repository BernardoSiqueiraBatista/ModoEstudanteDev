// data/ConsultationData.ts
import type { Patient } from '../types/PatientTypes';

// Tipos para a consulta ativa
export interface Message {
  id: string;
  speaker: 'MD' | 'PT' | 'AI';
  text: string;
  isAI?: boolean;
  timestamp?: string;
}

export interface Hypothesis {
  id: string;
  title: string;
  confidence: 'High' | 'Moderate' | 'Low';
  percentage: number;
  color: string;
}

export interface ExamRequest {
  id: string;
  name: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface Referral {
  id: string;
  name: string;
}

export interface Orientation {
  id: string;
  text: string;
}

export interface ClinicalNote {
  hda: string;
  clinicalImpression: string[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'info' | 'critical';
}

export interface MedicalInsight {
  text: string;
}

// ============================================
// Dados Mockados para Consulta Ativa
// ============================================

// Mensagens do chat
export const mockMessages: Message[] = [
  {
    id: '1',
    speaker: 'MD',
    text: 'Bom dia, Maria. Como você tem se sentido desde nossa última consulta sobre as dores de cabeça?',
    timestamp: '09:00',
  },
  {
    id: '2',
    speaker: 'PT',
    text: 'Bom dia, Doutor. Na verdade, as dores pioraram um pouco. Agora sinto uma pressão muito forte na região da nuca, especialmente quando acordo. Às vezes sinto uma leve tontura também.',
    timestamp: '09:01',
  },
  {
    id: '3',
    speaker: 'MD',
    text: 'Entendo. E essa tontura acontece em momentos específicos do dia ou é constante? Você notou alguma alteração na visão quando isso ocorre?',
    timestamp: '09:02',
  },
  {
    id: '4',
    speaker: 'PT',
    text: 'Não notei nada na visão, mas a tontura parece vir quando me levanto rápido demais. Ah, e comecei a sentir um formigamento leve no braço esquerdo ontem à noite.',
    timestamp: '09:03',
  },
  {
    id: '5',
    speaker: 'AI',
    text: 'Correlating history and symptoms in real-time...',
    isAI: true,
    timestamp: '09:03',
  },
];

// Hipóteses diagnósticas
export const mockHypotheses: Hypothesis[] = [
  {
    id: '1',
    title: 'Cefaleia Tensional',
    confidence: 'High',
    percentage: 85,
    color: 'emerald',
  },
  {
    id: '2',
    title: 'Crise Hipertensiva',
    confidence: 'Moderate',
    percentage: 45,
    color: 'amber',
  },
];

// Exames solicitados
export const mockExamRequests: ExamRequest[] = [
  { id: '1', name: 'ECG de 12 derivações', status: 'pending' },
  { id: '2', name: 'Troponina Ultra-sensível', status: 'pending' },
];

// Encaminhamentos
export const mockReferrals: Referral[] = [{ id: '1', name: 'Avaliação Cardiológica de Urgência' }];

// Orientações
export const mockOrientations: Orientation[] = [
  { id: '1', text: 'Manter repouso absoluto em leito com cabeceira elevada.' },
  { id: '2', text: 'Monitorização contínua de sinais vitais e oximetria.' },
];

// Nota clínica
export const mockClinicalNote: ClinicalNote = {
  hda: 'Paciente feminina, 32 anos, refere agravamento de cefaleia tensional pré-existente. Descreve sensação de pressão intensa em região occipital/nuca com predomínio matinal. Relata episódios intermitentes de tontura postural (ao ortostatismo rápido). Nas últimas 24h, iniciou quadro de parestesia leve em membro superior esquerdo. Nega alterações visuais ou déficits motores focais evidentes.',
  clinicalImpression: [
    'Cefaleia tensional com sinais de alarme (mudança no padrão).',
    'Parestesia em MSE a esclarecer (D/D: Radiculopatia cervical vs. Evento vascular).',
    'Necessidade de monitorização pressórica rigorosa.',
  ],
};

// Checklist diferencial
export const mockChecklistItems: ChecklistItem[] = [
  { id: '1', label: 'Histórico de Enxaqueca', checked: true },
  { id: '2', label: 'Aferição de PA em repouso', checked: false },
  { id: '3', label: 'Exame neurológico de força', checked: false },
];

// Alertas
export const mockAlerts: Alert[] = [
  {
    id: '1',
    title: 'Cardiovascular Warning',
    description:
      'Formigamento súbito em braço esquerdo requer investigação imediata para afastar evento vascular agudo.',
    type: 'warning',
  },
];

// Insight médico
export const mockMedicalInsight: MedicalInsight = {
  text: '"A dor occipital com tontura postural pode sugerir disfunção cervical ou hipertensão secundária. Recomenda-se realizar manobra de Dix-Hallpike."',
};

// Funções para buscar dados (futuramente, integrar com API)
export const getConsultationData = (patientId: string) => {
  // Futuramente, aqui viria uma chamada API
  return {
    messages: mockMessages,
    hypotheses: mockHypotheses,
    examRequests: mockExamRequests,
    referrals: mockReferrals,
    orientations: mockOrientations,
    clinicalNote: mockClinicalNote,
    checklistItems: mockChecklistItems,
    alerts: mockAlerts,
    medicalInsight: mockMedicalInsight,
  };
};
