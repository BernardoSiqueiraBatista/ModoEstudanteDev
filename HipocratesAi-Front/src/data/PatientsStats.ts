// data/PatientsData.ts (OPCIONAL - apenas para estatísticas)
import { patients } from './PatientsData';
import type { PatientStats } from '../types/PatientTypes';

// Se precisar de estatísticas específicas para o footer
export const statsData: PatientStats = {
  aiPrecision: '98.4%',
  aiChange: '+0.2%',
  newJustifications: 42,
  avgResponseTime: '1.2s',
  systemStatus: 'Criptografia Ativa',
};

// Se precisar de alguma lógica específica com pacientes
export const getPatientsByStatus = (status: string) => {
  return patients.filter(p => p.status === status);
};