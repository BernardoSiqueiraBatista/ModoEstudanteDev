// types/PatientTypes.ts
import type { EventType } from '../components/agenda/week/Calendarevent';

// Tipo base de Paciente
export interface Patient {
  id: string;
  name: string;
  initials: string;
  gender: string;
  age: number;
  recordNumber: string;
  lastConsultation: {
    date: string;
    doctor: string;
  };
  status: 'ativo' | 'followup' | 'pendente';
  mainDiagnosis?: string;
  observations?: string;
}

// Tipo de Apontamento
export interface Apontamento {
  id?: string;
  dayIndex: number;
  patient: Patient;
  title: string;
  startTime: string;
  endTime: string;
  type: EventType;
  description?: string;
  top: number;
  height: number;
}

// Tipo para Timeline (Histórico)
export interface TimelineEvent {
  id: string;
  patientId: string;
  date: string;
  title: string;
  doctor: string;
  specialty: string;
  type: 'consulta' | 'exame' | 'retorno' | 'telemedicina';
  hypotheses?: Hypothesis[];
  tags?: string[];
  quote?: string;
  isExpanded?: boolean;
  confidence?: 'Alta' | 'Média' | 'Baixa';
}

// Tipo para Hipótese diagnóstica
export interface Hypothesis {
  id: string;
  patientId: string;
  title: string;
  description: string;
  status: 'ativo' | 'descartado' | 'investigando';
  confidence: number;
  createdAt: string;
  lastUpdate?: string;
}

// Tipo para Tratamento
export interface Treatment {
  id: string;
  patientId: string;
  name: string;
  description: string;
  status: 'em_andamento' | 'concluido' | 'pendente' | 'interrompido';
  startDate: string;
  endDate?: string;
  medications?: Medication[];
}

// Tipo para Medicação
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

// Tipo para Sumário Cognitivo
export interface CognitiveSummary {
  primaryFocus: string;
  resolvedPhase: string;
  ruledOut: string[];
  longitudinalInsight: string;
  correlationPercentage?: number;
}

// Estatísticas
export interface PatientStats {
  aiPrecision: string;
  aiChange: string;
  newJustifications: number;
  avgResponseTime: string;
  systemStatus: string;
}
