import type { EventType } from '../components/agenda/week/Calendarevent';

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
  mainDiagnosis?: string; // Diagnóstico principal (opcional)
  observations?: string; // Observações (opcional)
}

export interface Apontamento {
  dayIndex: number; // 0-6 (Seg-Dom)
  patient: Patient; 
  title: string; // patient.name (redundante mas útil)
  startTime: string;
  endTime: string;
  type: EventType;
  description?: string;
  top: number;
  height: number;
}

export interface PatientStats {
  aiPrecision: string;
  aiChange: string;
  newJustifications: number;
  avgResponseTime: string;
  systemStatus: string;
}
