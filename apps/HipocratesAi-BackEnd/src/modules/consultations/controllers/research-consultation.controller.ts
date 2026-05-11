// TODO: Registrar esta rota em `src/modules/consultations/consultations.routes.ts`
// (arquivo ainda não existe no momento desta implementação) com:
//   router.post('/:id/research', asyncAuthHandler(researchConsultationController));

import type { Response } from 'express';
import type { AuthRequest } from '../../../shared/http/auth-request';
import { logger } from '../../../shared/logger/logger';
import { ConsultationsRepository } from '../consultations.repository';
import { ragService } from '../ai/rag.service';
import { webSearchService } from '../ai/web-search.service';
import { ResearchService } from '../ai/research.service';
import { researchSchema } from '../dtos/research.dto';

const researchService = new ResearchService(ragService, webSearchService);

export async function researchConsultationController(
  req: AuthRequest,
  res: Response,
) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const consultationId = req.params.id as string;
    if (!consultationId) {
      return res.status(400).json({ message: 'ID de consulta obrigatório.' });
    }

    const parsed = researchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Payload inválido.',
        issues: parsed.error.flatten(),
      });
    }

    const repo = new ConsultationsRepository();
    const consultation = await repo.findByIdForDoctor(consultationId, userId);
    if (!consultation) {
      return res
        .status(404)
        .json({ message: 'Consulta não encontrada ou sem permissão.' });
    }

    const { query, includeWeb } = parsed.data;
    const result = await researchService.research(query, { includeWeb });

    return res.json({
      chunks: result.chunks,
      webResults: result.webResults,
      hasLocalEvidence: result.hasLocalEvidence,
      topSimilarity: result.topSimilarity,
    });
  } catch (err) {
    logger.error({ err }, '[researchConsultationController] unexpected failure');
    return res.status(500).json({ message: 'Erro interno.' });
  }
}
