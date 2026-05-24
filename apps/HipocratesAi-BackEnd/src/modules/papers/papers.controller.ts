import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PapersService } from './papers.service';
import { CreatePaperSchema } from './dtos/create-paper.dto';
import { UpdatePaperSchema } from './dtos/update-paper.dto';
import { ListPapersQuerySchema } from './dtos/list-papers.query';

export class PapersController {
  private service: PapersService;

  constructor() {
    this.service = new PapersService();
  }

  /**
   * POST /student/:id/papers
   * Cria um novo paper.
   */
  createPaper = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.params.id as string;
      if (!studentId) {
        return res.status(400).json({ message: 'studentId é obrigatório' });
      }

      const validatedData = CreatePaperSchema.parse(req.body);
      const paper = await this.service.createPaper(studentId, validatedData);

      return res.status(201).json(paper);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      next(error);
    }
  };

  /**
   * GET /student/:id/papers?page=1&size=20&status=...&tag=...&search=...
   * Lista papers do aluno com paginação e filtros.
   */
  listPapers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.params.id as string;
      if (!studentId) {
        return res.status(400).json({ message: 'studentId é obrigatório' });
      }

      const filters = ListPapersQuerySchema.parse(req.query);
      const result = await this.service.listPapers(studentId, filters);

      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Parâmetros de consulta inválidos', errors: error.errors });
      }
      next(error);
    }
  };

  /**
   * GET /student/:id/papers/:paperId
   * Detalhe de um paper.
   */
  getPaper = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.params.id as string;
      const paperId = req.params.paperId as string;

      if (!studentId || !paperId) {
        return res.status(400).json({ message: 'studentId e paperId são obrigatórios' });
      }

      const paper = await this.service.getPaper(paperId, studentId);
      return res.status(200).json(paper);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /student/:id/papers/:paperId
   * Edita um paper existente.
   */
  updatePaper = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.params.id as string;
      const paperId = req.params.paperId as string;

      if (!studentId || !paperId) {
        return res.status(400).json({ message: 'studentId e paperId são obrigatórios' });
      }

      const validatedData = UpdatePaperSchema.parse(req.body);
      const paper = await this.service.updatePaper(paperId, studentId, validatedData);

      return res.status(200).json(paper);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      next(error);
    }
  };

  /**
   * DELETE /student/:id/papers/:paperId
   * Soft delete de um paper.
   */
  deletePaper = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.params.id as string;
      const paperId = req.params.paperId as string;

      if (!studentId || !paperId) {
        return res.status(400).json({ message: 'studentId e paperId são obrigatórios' });
      }

      await this.service.deletePaper(paperId, studentId);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /student/:id/papers/:paperId/share
   * Gera ou atualiza link de compartilhamento.
   */
  sharePaper = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.params.id as string;
      const paperId = req.params.paperId as string;

      if (!studentId || !paperId) {
        return res.status(400).json({ message: 'studentId e paperId são obrigatórios' });
      }

      const visibilidade = req.body?.visibilidade ?? 'link';
      const expiraEm = req.body?.expira_em ?? null;

      const shareResult = await this.service.sharePaper(paperId, studentId, visibilidade, expiraEm);
      return res.status(201).json(shareResult);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /papers/shared/:shareToken
   * Rota PÚBLICA — acessa paper via token opaco.
   */
  getSharedPaper = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const shareToken = req.params.shareToken as string;

      if (!shareToken) {
        return res.status(400).json({ message: 'Token de compartilhamento é obrigatório' });
      }

      const paper = await this.service.getSharedPaper(shareToken);
      return res.status(200).json(paper);
    } catch (error) {
      next(error);
    }
  };
}
