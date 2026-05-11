// data/patientsData.ts
import type { Patient } from '../types/PatientTypes';

export const patients: Patient[] = [
  {
    id: '1',
    name: 'Ana Martins',
    initials: 'AM',
    gender: 'Feminino',
    age: 45,
    recordNumber: 'P-2024-001',
    lastConsultation: {
      date: '2024-02-15',
      doctor: 'Dra. Ana Beatriz',
    },
    status: 'ativo',
    mainDiagnosis: 'Hipertensão',
    observations: 'Alérgica a penicilina',
  },
  {
    id: '2',
    name: 'João Silva',
    initials: 'JS',
    gender: 'Masculino',
    age: 52,
    recordNumber: 'P-2024-002',
    lastConsultation: {
      date: '2024-01-20',
      doctor: 'Dr. Carlos Mendes',
    },
    status: 'followup',
    mainDiagnosis: 'Diabetes tipo 2',
    observations: 'Histórico familiar de cardiopatias',
  },
  {
    id: '3',
    name: 'Carlos Santos',
    initials: 'CS',
    gender: 'Masculino',
    age: 38,
    recordNumber: 'P-2024-003',
    lastConsultation: {
      date: '2024-02-10',
      doctor: 'Dra. Ana Beatriz',
    },
    status: 'ativo',
    mainDiagnosis: 'Asma',
    observations: 'Uso de bombinha diariamente',
  },
  {
    id: '4',
    name: 'Maria Oliveira',
    initials: 'MO',
    gender: 'Feminino',
    age: 29,
    recordNumber: 'P-2024-004',
    lastConsultation: {
      date: '2024-02-01',
      doctor: 'Dr. Ricardo Alves',
    },
    status: 'pendente',
    mainDiagnosis: 'Enxaqueca crônica',
    observations: 'Sensibilidade à luz',
  },
  {
    id: '5',
    name: 'Roberto Souza',
    initials: 'RS',
    gender: 'Masculino',
    age: 61,
    recordNumber: 'P-2024-005',
    lastConsultation: {
      date: '2024-01-05',
      doctor: 'Dra. Ana Beatriz',
    },
    status: 'followup',
    mainDiagnosis: 'Insuficiência cardíaca',
    observations: 'Restrição de sódio na dieta',
  },
  {
    id: '6',
    name: 'Maria Cavalcanti',
    initials: 'MC',
    gender: 'Feminino',
    age: 32,
    recordNumber: '#HP-2024-0742',
    lastConsultation: {
      date: 'Ontem, 16:45',
      doctor: 'Dra. Helena Souza',
    },
    status: 'followup',
    mainDiagnosis: 'Hipotireoidismo',
  },
  {
    id: '7',
    name: 'Roberto Pontes',
    initials: 'RP',
    gender: 'Masculino',
    age: 68,
    recordNumber: '#HP-2024-0910',
    lastConsultation: {
      date: '12 Mai, 11:20',
      doctor: 'Dr. Ricardo Amaro',
    },
    status: 'pendente',
    mainDiagnosis: 'Parkinson',
    observations: 'Acompanhamento com neurologista',
  },
];

// Estatísticas para o footer (opcional)
export const patientStats = {
  aiPrecision: '98.4%',
  aiChange: '+0.2%',
  newJustifications: 42,
  avgResponseTime: '1.2s',
  systemStatus: 'Criptografia Ativa',
};
