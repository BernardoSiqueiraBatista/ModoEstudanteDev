import crypto from 'crypto';
import { AppError } from '../../shared/errors/AppError';
import { PapersModel } from './papers.model';
import { CreatePaperDto } from './dtos/create-paper.dto';
import { UpdatePaperDto } from './dtos/update-paper.dto';
import { ListPapersQuery } from './dtos/list-papers.query';
import { PaperRow, PaperShareRow, PaginatedResponse } from './types/paper.types';

export class PapersService {
  private model: PapersModel;

  constructor() {
    this.model = new PapersModel();
  }

  /**
   * Cria um novo paper para o estudante.
   */
  async createPaper(studentId: string, data: CreatePaperDto): Promise<PaperRow> {
    return this.model.create(studentId, data);
  }

  /**
   * Lista papers do estudante com paginação e filtros.
   */
  async listPapers(
    studentId: string,
    filters: ListPapersQuery,
  ): Promise<PaginatedResponse<Omit<PaperRow, 'conteudo' | 'deleted_at'>>> {
    const { rows, total } = await this.model.findByStudentPaginated(studentId, filters);

    const totalPages = Math.ceil(total / filters.size);

    return {
      data: rows,
      pagination: {
        page: filters.page,
        size: filters.size,
        total,
        totalPages,
      },
    };
  }

  /**
   * Busca um paper específico por ID.
   * Verifica se o paper pertence ao estudante.
   */
  async getPaper(paperId: string, studentId: string): Promise<PaperRow> {
    const paper = await this.model.findById(paperId);

    if (!paper) {
      throw new AppError('Paper não encontrado.', 404);
    }

    if (paper.id_student !== studentId) {
      throw new AppError('Paper não encontrado.', 404);
    }

    return paper;
  }

  /**
   * Atualiza um paper existente.
   * Verifica se o paper pertence ao estudante.
   */
  async updatePaper(
    paperId: string,
    studentId: string,
    data: UpdatePaperDto,
  ): Promise<PaperRow> {
    const updated = await this.model.update(paperId, studentId, data);

    if (!updated) {
      throw new AppError('Paper não encontrado.', 404);
    }

    return updated;
  }

  /**
   * Soft delete de um paper.
   * Verifica se o paper pertence ao estudante.
   */
  async deletePaper(paperId: string, studentId: string): Promise<void> {
    const deleted = await this.model.softDelete(paperId, studentId);

    if (!deleted) {
      throw new AppError('Paper não encontrado.', 404);
    }
  }

  /**
   * Gera ou atualiza o link de compartilhamento de um paper.
   * Verifica se o paper pertence ao estudante.
   */
  async sharePaper(
    paperId: string,
    studentId: string,
    visibilidade: 'link' | 'privado' = 'link',
    expiraEm: string | null = null,
  ): Promise<{ share_token: string; url: string; visibilidade: string; expira_em: string | null }> {
    // Verifica se o paper existe e pertence ao estudante
    const paper = await this.model.findById(paperId);

    if (!paper || paper.id_student !== studentId) {
      throw new AppError('Paper não encontrado.', 404);
    }

    const share = await this.model.createOrUpdateShare(paperId, visibilidade, expiraEm);

    return {
      share_token: share.share_token,
      url: `/papers/shared/${share.share_token}`,
      visibilidade: share.visibilidade,
      expira_em: share.expira_em,
    };
  }

  /**
   * Acesso público a um paper via share token.
   * Verifica se o token é válido, se o paper não está excluído,
   * e se o share não expirou.
   */
  async getSharedPaper(shareToken: string): Promise<PaperRow> {
    const paper = await this.model.findByShareToken(shareToken);

    if (!paper) {
      throw new AppError('Paper não encontrado ou link inválido.', 404);
    }

    // Verifica expiração
    if (paper.expira_em) {
      const expDate = new Date(paper.expira_em);
      if (expDate < new Date()) {
        throw new AppError('O link de compartilhamento expirou.', 410);
      }
    }

    return paper;
  }
}
