import { StudyPlansService } from '../study-plans.service';
import { AppError } from '../../../shared/errors/AppError';

const mockCreatePlan = jest.fn();
const mockCreateBlocks = jest.fn();
const mockListPlansByStudent = jest.fn();
const mockGetPlanDetails = jest.fn();
const mockUpdateBlockStatus = jest.fn();
const mockDeletePlan = jest.fn();

jest.mock('../study-plans.model', () => {
  return {
    StudyPlansModel: jest.fn().mockImplementation(() => ({
      createPlan: mockCreatePlan,
      createBlocks: mockCreateBlocks,
      listPlansByStudent: mockListPlansByStudent,
      getPlanDetails: mockGetPlanDetails,
      updateBlockStatus: mockUpdateBlockStatus,
      deletePlan: mockDeletePlan
    }))
  };
});

const mockGetLastInsight = jest.fn();
jest.mock('../../insights/insights.model', () => {
  return {
    InsightsModel: jest.fn().mockImplementation(() => ({
      getLastInsight: mockGetLastInsight
    }))
  };
});

jest.mock('openai', () => {
  const mOpenAI = {
    chat: {
      completions: {
        parse: jest.fn().mockResolvedValue({
          usage: { total_tokens: 100 },
          choices: [{
            message: {
              parsed: {
                blocos: [
                  { dia_semana: 'segunda', horario_inicio: '10:00', horario_fim: '11:00', area_foco: 'Cardio', topicos: [], tipo_atividade: 'teoria' }
                ]
              }
            }
          }]
        })
      }
    }
  };
  return { OpenAI: jest.fn(() => mOpenAI) };
});

describe('StudyPlansService', () => {
  let service: StudyPlansService;
  const studentId = 'student-123';

  beforeEach(() => {
    service = new StudyPlansService();
    jest.clearAllMocks();
  });

  it('generateStudyPlan: deve gerar plano via OpenAI e salvar no banco', async () => {
    mockGetLastInsight.mockResolvedValueOnce({ pontos_atencao: [{ titulo: 'Cardio', descricao_curta: 'Fraco' }] });
    mockCreatePlan.mockResolvedValueOnce({ id: 'plan-1', titulo: 'Teste' });
    mockCreateBlocks.mockResolvedValueOnce([{ id: 'block-1', id_plan: 'plan-1' }]);

    const result = await service.generateStudyPlan(studentId, {
      titulo: 'Meu Plano',
      categoria: 'geral',
      areas_foco: ['Cardio'],
      duracao: 'semanal',
      horas_por_dia: 2,
      dias_semana: ['segunda'],
      briefing: 'Preciso focar',
      considerar_insights: true
    });

    expect(result.plan.id).toBe('plan-1');
    expect(result.blocks[0].id).toBe('block-1');
    expect(mockCreatePlan).toHaveBeenCalled();
    expect(mockCreateBlocks).toHaveBeenCalled();
  });

  it('listPlans: repassa para o model', async () => {
    mockListPlansByStudent.mockResolvedValueOnce([{ id: 'p1' }]);
    const result = await service.listPlans(studentId);
    expect(result).toHaveLength(1);
  });

  it('getPlanDetails: retorna erro 404 se plano não existe', async () => {
    mockGetPlanDetails.mockResolvedValueOnce(null);
    await expect(service.getPlanDetails('invalido')).rejects.toThrow(new AppError('Plano de estudos não encontrado.', 404));
  });

  it('updateBlockStatus: atualiza status com sucesso', async () => {
    mockUpdateBlockStatus.mockResolvedValueOnce({ id: 'b1', status: 'concluido' });
    const result = await service.updateBlockStatus('b1', 'concluido');
    expect(result.status).toBe('concluido');
  });

  it('updateBlockStatus: retorna erro 404 se bloco não existe', async () => {
    mockUpdateBlockStatus.mockResolvedValueOnce(null);
    await expect(service.updateBlockStatus('invalido', 'concluido')).rejects.toThrow(new AppError('Bloco não encontrado.', 404));
  });

  it('deletePlan: chama model deletePlan', async () => {
    await service.deletePlan('plan-1', studentId);
    expect(mockDeletePlan).toHaveBeenCalledWith('plan-1', studentId);
  });
});
