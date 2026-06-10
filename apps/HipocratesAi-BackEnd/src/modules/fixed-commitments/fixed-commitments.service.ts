import { AppError } from '../../shared/errors/AppError';
import { FixedCommitmentsModel, IFixedCommitment } from './fixed-commitments.model';

export class FixedCommitmentsService {
  private model: FixedCommitmentsModel;

  constructor() {
    this.model = new FixedCommitmentsModel();
  }

  /**
   * Lista todos os compromissos fixos de um plano.
   */
  async listByPlan(planId: string): Promise<IFixedCommitment[]> {
    return this.model.listByPlan(planId);
  }

  /**
   * Cria um novo compromisso fixo com validação de sobreposição.
   */
  async create(
    planId: string,
    data: { dia: string; inicio: string; fim: string; label?: string; tipo?: string }
  ): Promise<IFixedCommitment> {
    const hasOverlap = await this.model.checkOverlap(planId, data.dia, data.inicio, data.fim);
    if (hasOverlap) {
      throw new AppError(
        `Conflito de horário: já existe um compromisso fixo em ${data.dia} que se sobrepõe ao intervalo ${data.inicio}–${data.fim}.`,
        409
      );
    }

    return this.model.create({ ...data, id_plan: planId });
  }

  /**
   * Cria vários compromissos fixos de uma vez (usado na criação do plano).
   * Valida overlap entre os itens do batch e os já existentes.
   */
  async createBatch(
    planId: string,
    items: { dia: string; inicio: string; fim: string; label?: string; tipo?: string }[]
  ): Promise<IFixedCommitment[]> {
    if (!items || items.length === 0) return [];

    // Verifica overlap com registros já existentes no banco para cada item
    for (const item of items) {
      const hasOverlap = await this.model.checkOverlap(planId, item.dia, item.inicio, item.fim);
      if (hasOverlap) {
        throw new AppError(
          `Conflito de horário: já existe um compromisso fixo em ${item.dia} que se sobrepõe ao intervalo ${item.inicio}–${item.fim}.`,
          409
        );
      }
    }

    // Verifica overlap entre os próprios itens do batch
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (items[i].dia === items[j].dia) {
          const a = items[i];
          const b = items[j];
          if (a.inicio < b.fim && a.fim > b.inicio) {
            throw new AppError(
              `Conflito de horário entre compromissos no batch: ${a.dia} ${a.inicio}–${a.fim} sobrepõe ${b.inicio}–${b.fim}.`,
              409
            );
          }
        }
      }
    }

    return this.model.createBatch(planId, items);
  }

  /**
   * Atualiza um compromisso fixo existente com validação de sobreposição.
   */
  async update(
    commitmentId: string,
    data: { dia?: string; inicio?: string; fim?: string; label?: string }
  ): Promise<IFixedCommitment> {
    const existing = await this.model.getById(commitmentId);
    if (!existing) {
      throw new AppError('Compromisso fixo não encontrado.', 404);
    }

    // Mescla dados existentes com a atualização parcial para validar overlap
    const mergedDia = data.dia ?? existing.dia;
    const mergedInicio = data.inicio ?? existing.inicio;
    const mergedFim = data.fim ?? existing.fim;

    // Valida que fim > inicio após a mesclagem
    if (mergedFim <= mergedInicio) {
      throw new AppError('O horário de fim deve ser posterior ao horário de início.', 422);
    }

    const hasOverlap = await this.model.checkOverlap(
      existing.id_plan,
      mergedDia,
      mergedInicio,
      mergedFim,
      commitmentId
    );

    if (hasOverlap) {
      throw new AppError(
        `Conflito de horário: já existe um compromisso fixo em ${mergedDia} que se sobrepõe ao intervalo ${mergedInicio}–${mergedFim}.`,
        409
      );
    }

    const updated = await this.model.update(commitmentId, data);
    if (!updated) {
      throw new AppError('Erro ao atualizar compromisso fixo.', 500);
    }

    return updated;
  }

  /**
   * Remove um compromisso fixo.
   */
  async delete(commitmentId: string): Promise<void> {
    const deleted = await this.model.delete(commitmentId);
    if (!deleted) {
      throw new AppError('Compromisso fixo não encontrado.', 404);
    }
  }

  /**
   * Retorna compromissos formatados para uso no prompt do LLM.
   */
  async getForPrompt(
    planId: string
  ): Promise<{ dia: string; inicio: string; fim: string; label?: string }[]> {
    const commitments = await this.model.listByPlan(planId);
    return commitments.map((c) => ({
      dia: c.dia,
      inicio: typeof c.inicio === 'string' ? c.inicio.substring(0, 5) : c.inicio,
      fim: typeof c.fim === 'string' ? c.fim.substring(0, 5) : c.fim,
      ...(c.label ? { label: c.label } : {}),
    }));
  }
}
