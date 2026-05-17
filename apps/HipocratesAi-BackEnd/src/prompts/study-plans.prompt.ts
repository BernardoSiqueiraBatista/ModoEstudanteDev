import { z } from 'zod';

export const StudyPlanGenerationSchema = z.object({
  blocos: z.array(z.object({
    data: z.string().describe('Data no formato YYYY-MM-DD'),
    hora_inicio: z.string().describe('Horário de início no formato HH:MM'),
    hora_fim: z.string().describe('Horário de término no formato HH:MM'),
    tipo: z.enum(['revisao', 'simulado', 'teoria', 'caso_clinico', 'aula']),
    titulo: z.string().describe('Título curto da atividade'),
    especialidade: z.string().describe('Especialidade médica relacionada (ex: Cardiologia, Nefrologia)'),
    descricao: z.string().describe('Breve descrição do que deve ser estudado')
  }))
});

export const getStudyPlanPrompt = (params: {
  briefing: string;
  areas_foco: string[];
  duracao: string;
  horas_por_dia: number;
  dias_semana: string[];
  horarios_bloqueados?: { dia: string; inicio: string; fim: string }[];
  insights_performance?: string;
}): string => {
  const agora = new Date();
  const dataFormatada = agora.toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return `
Você é um arquiteto de aprendizagem médica especializado em preparar alunos para provas de residência.
Sua tarefa é gerar um cronograma de estudos detalhado e personalizado.

CONTEXTO TEMPORAL:
- Hoje é: ${dataFormatada}.
- Considere esta data como ponto de partida para o agendamento dos blocos.

DADOS DO ESTUDANTE:
- Objetivos/Briefing: "${params.briefing}"
- Especialidades Prioritárias: ${params.areas_foco.join(', ')}
- Duração do Plano: ${params.duracao}
- Carga horária máxima: ${params.horas_por_dia} horas por dia
- Dias disponíveis na semana: ${params.dias_semana.join(', ')}

${params.horarios_bloqueados && params.horarios_bloqueados.length > 0 ? `
BLOQUEIOS DE AGENDA (Não agende nada nestes horários):
${params.horarios_bloqueados.map(b => `- ${b.dia}: das ${b.inicio} às ${b.fim}`).join('\n')}
` : ''}

${params.insights_performance ? `
PONTOS DE ATENÇÃO (FOCO EM DEFICIÊNCIAS):
${params.insights_performance}
` : ''}

REGRAS DE GERAÇÃO:
1. Respeite rigorosamente a carga horária diária.
2. Nunca sobreponha blocos aos horários bloqueados.
3. Alterne entre teoria, revisão e simulados para manter o engajamento.
4. Foque as especialidades prioritárias e os pontos de atenção fornecidos.
5. Cada bloco deve ter duração lógica (ex: 1h a 2h).
6. Garanta que a data de cada bloco seja válida e futura em relação a hoje.

Retorne apenas o JSON estruturado conforme o schema.
`.trim();
};
