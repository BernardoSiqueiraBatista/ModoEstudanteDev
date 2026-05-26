import { Request, Response, NextFunction } from 'express';
import { PaperlabService } from './paperlab.service';
import { CreateSessionSchema } from './dtos/create-session.dto';
import { CreateMaterialSchema } from './dtos/create-material.dto';
import { ReviewCardSchema } from './dtos/review-card.dto';
import { ChatQuestionSchema } from './dtos/chat-question.dto';
import { ShareSessionSchema } from './dtos/share-session.dto';
import { AddCollaboratorSchema } from './dtos/add-collaborator.dto';

export class PaperlabController {
  private service: PaperlabService;

  constructor() {
    this.service = new PaperlabService();
  }

  // ===========================================================================
  // SESSÕES (NOTEBOOKS)
  // ===========================================================================

  createSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = req.params.id as string;
      const data = CreateSessionSchema.parse(req.body);

      const session = await this.service.createSession(studentId, data.titulo);
      res.status(201).json(session);
    } catch (err) {
      next(err);
    }
  };

  listSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = req.params.id as string;
      const sessions = await this.service.listSessions(studentId);
      res.status(200).json(sessions);
    } catch (err) {
      next(err);
    }
  };

  getSessionDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.params.sessionId as string;
      const studentId = req.params.id as string;
      const detail = await this.service.getSessionDetail(sessionId, studentId);
      res.status(200).json(detail);
    } catch (err) {
      next(err);
    }
  };

  deleteSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.params.sessionId as string;
      const studentId = req.params.id as string;
      await this.service.deleteSession(sessionId, studentId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  // ===========================================================================
  // FONTES (SOURCES)
  // ===========================================================================

  addSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.params.sessionId as string;
      const studentId = req.params.id as string;
      const { tipo, titulo, url } = req.body;

      if (!tipo || !titulo) {
        res.status(400).json({ message: 'Campos tipo e titulo são obrigatórios.' });
        return;
      }

      // Valida se o tipo fornecido é aceitável
      const validTypes = ['pdf', 'docx', 'image', 'youtube', 'link'];
      if (!validTypes.includes(tipo)) {
        res.status(400).json({ message: `Tipo inválido. Deve ser um dos seguintes: ${validTypes.join(', ')}` });
        return;
      }

      // Multer file upload check
      const file = req.file;

      const source = await this.service.addSource(sessionId, studentId, tipo, titulo, file, url);
      // Retorna 202 Accepted, indicando ingestão assíncrona
      res.status(202).json(source);
    } catch (err) {
      next(err);
    }
  };

  listSources = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.params.sessionId as string;
      const studentId = req.params.id as string;
      const sources = await this.service.listSources(sessionId, studentId);
      res.status(200).json(sources);
    } catch (err) {
      next(err);
    }
  };

  deleteSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sourceId = req.params.sourceId as string;
      const studentId = req.params.id as string;
      await this.service.deleteSource(sourceId, studentId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  // ===========================================================================
  // CHAT UNIVERSAL (RAG)
  // ===========================================================================

  answerChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.params.sessionId as string;
      const studentId = req.params.id as string;
      const { pergunta } = ChatQuestionSchema.parse(req.body);

      const result = await this.service.answerChatQuestion(sessionId, studentId, pergunta);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  // ===========================================================================
  // MATERIAIS DE ESTUDO
  // ===========================================================================

  triggerMaterialGeneration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.params.sessionId as string;
      const studentId = req.params.id as string;
      const { tipo, prompt, numeroCards, dificuldade } = CreateMaterialSchema.parse(req.body);

      const material = await this.service.triggerMaterialGeneration(sessionId, studentId, tipo, prompt, numeroCards, dificuldade);
      // Retorna 202 Accepted, indicando geração assíncrona enfileirada
      res.status(202).json(material);
    } catch (err) {
      next(err);
    }
  };

  listMaterials = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.params.sessionId as string;
      const studentId = req.params.id as string;
      const materials = await this.service.listMaterials(sessionId, studentId);
      res.status(200).json(materials);
    } catch (err) {
      next(err);
    }
  };

  getMaterialDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const materialId = req.params.materialId as string;
      const studentId = req.params.id as string;
      const onlyDue = req.query.only_due === 'true';

      const detail = await this.service.getMaterialDetail(materialId, studentId, onlyDue);
      res.status(200).json(detail);
    } catch (err) {
      next(err);
    }
  };

  updateMaterialContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const materialId = req.params.materialId as string;
      const studentId = req.params.id as string;
      const conteudo = req.body;

      const updated = await this.service.updateMaterialContent(materialId, studentId, conteudo);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  };

  deleteMaterial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const materialId = req.params.materialId as string;
      const studentId = req.params.id as string;
      await this.service.deleteMaterial(materialId, studentId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  // ===========================================================================
  // AGENDAMENTO E REVISÃO DE FLASHCARDS (ANKI SCHEDULER)
  // ===========================================================================

  reviewFlashcard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = req.params.id as string;
      const { resultado, cardId } = ReviewCardSchema.parse(req.body);

      const updatedCard = await this.service.reviewFlashcard(cardId, studentId, resultado);
      res.status(200).json(updatedCard);
    } catch (err) {
      next(err);
    }
  };

  // ===========================================================================
  // COMPARTILHAMENTO PÚBLICO E COLABORADORES
  // ===========================================================================

  shareSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.params.sessionId as string;
      const studentId = req.params.id as string;
      const { visibilidade, expira_em } = ShareSessionSchema.parse(req.body);

      const share = await this.service.shareSession(sessionId, studentId, visibilidade, expira_em);
      res.status(200).json(share);
    } catch (err) {
      next(err);
    }
  };

  unshareSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.params.sessionId as string;
      const studentId = req.params.id as string;

      await this.service.unshareSession(sessionId, studentId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  getSharedSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shareToken = req.params.shareToken as string;

      const sharedSession = await this.service.getSharedSession(shareToken);
      res.status(200).json(sharedSession);
    } catch (err) {
      next(err);
    }
  };

  addCollaborator = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.params.sessionId as string;
      const ownerStudentId = req.params.id as string;
      const { id_student } = AddCollaboratorSchema.parse(req.body);

      const collaborator = await this.service.addCollaborator(sessionId, ownerStudentId, id_student);
      res.status(201).json(collaborator);
    } catch (err) {
      next(err);
    }
  };

  listCollaborators = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.params.sessionId as string;
      const studentId = req.params.id as string;

      const collaborators = await this.service.listCollaborators(sessionId, studentId);
      res.status(200).json(collaborators);
    } catch (err) {
      next(err);
    }
  };

  removeCollaborator = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.params.sessionId as string;
      const collaboratorId = req.params.collaboratorId as string;
      const ownerStudentId = req.params.id as string;

      await this.service.removeCollaborator(sessionId, collaboratorId, ownerStudentId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  getChatHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.params.sessionId as string;
      const studentId = req.params.id as string;
      const page = parseInt(req.query.page as string || '1', 10);
      const size = parseInt(req.query.size as string || '20', 10);

      const history = await this.service.getChatHistory(sessionId, studentId, page, size);
      res.status(200).json(history);
    } catch (err) {
      next(err);
    }
  };
}
export default PaperlabController;
