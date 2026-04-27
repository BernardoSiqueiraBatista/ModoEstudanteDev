// data/ClosureData.ts
export interface ClosureDiagnosis {
  id: string;
  title: string;
  description: string;
  status: 'confirmed' | 'considered' | 'discarded';
}

export interface ClosureSummary {
  mainComplaint: string;
  keyFindings: string;
  therapeuticPlan: string;
}

export interface ClosureData {
  patientId: string;
  patientName: string;
  summary: ClosureSummary;
  diagnoses: ClosureDiagnosis[];
  suggestedReturn: string;
  referral: string;
}

// Dados mockados (futuramente virão da API)
export const getClosureData = (patientId: string): ClosureData => {
  // Aqui você pode buscar dados específicos por patientId
  const mockData: Record<string, ClosureData> = {
    '1': {
      patientId: '1',
      patientName: 'Ana Martins',
      summary: {
        mainComplaint: 'Dores de cabeça persistentes há 2 semanas, com piora matinal e sensação de pressão na nuca. Relato de tontura postural e formigamento ocasional em membro superior esquerdo.',
        keyFindings: '• PA: 145/95 mmHg\n• Exame neurológico preservado\n• Parestesia em dermátomo C6 (E)',
        therapeuticPlan: 'Monitoramento residencial de PA (MRPA). Relaxante muscular SOS. Solicitação de RM cervical e laboratório.',
      },
      diagnoses: [
        {
          id: '1',
          title: 'Hipertensão Arterial Sistêmica Estágio 1',
          description: 'Baseado em critérios diagnósticos de cefaleia occipital.',
          status: 'confirmed',
        },
        {
          id: '2',
          title: 'Radiculopatia Cervical',
          description: 'Correlação entre cervicalgia e parestesia em C6.',
          status: 'considered',
        },
        {
          id: '3',
          title: 'Enxaqueca com Aura',
          description: 'Ausência de fotofobia e sinais visuais.',
          status: 'discarded',
        },
      ],
      suggestedReturn: '15 dias úteis para revisão de MRPA',
      referral: 'Nenhum encaminhamento crítico',
    },
    '2': {
      patientId: '2',
      patientName: 'João Silva',
      summary: {
        mainComplaint: 'Diabetes tipo 2 - Controle glicêmico. Paciente nega sintomas de hipoglicemia.',
        keyFindings: '• Glicemia: 180 mg/dL\n• Hemoglobina glicada: 7.5%\n• Fundo de olho normal',
        therapeuticPlan: 'Ajuste de Metformina para 1000mg 2x/dia. Encaminhamento para nutrição.',
      },
      diagnoses: [
        {
          id: '1',
          title: 'Diabetes Mellitus tipo 2',
          description: 'Controle glicêmico inadequado nos últimos 3 meses.',
          status: 'confirmed',
        },
        {
          id: '2',
          title: 'Neuropatia Diabética Inicial',
          description: 'Parestesia em membros inferiores.',
          status: 'considered',
        },
      ],
      suggestedReturn: '30 dias para reavaliação',
      referral: 'Nutrição e Endocrinologia',
    },
  };

  return mockData[patientId] || {
    patientId,
    patientName: 'Paciente',
    summary: {
      mainComplaint: '',
      keyFindings: '',
      therapeuticPlan: '',
    },
    diagnoses: [],
    suggestedReturn: 'Não definido',
    referral: 'Não definido',
  };
};