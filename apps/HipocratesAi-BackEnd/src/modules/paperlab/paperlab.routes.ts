import { Router } from 'express';
import multer from 'multer';
import { PaperlabController } from './paperlab.controller';

const paperlabRoutes = Router({ mergeParams: true });
const controller = new PaperlabController();

// Configuração do multer em memória para processamento de uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // Limite de 20MB por arquivo
  },
});

// =============================================================================
// SESSÕES (NOTEBOOKS)
// =============================================================================
paperlabRoutes.post('/sessions', controller.createSession);
paperlabRoutes.get('/sessions', controller.listSessions);
paperlabRoutes.get('/sessions/:sessionId', controller.getSessionDetail);
paperlabRoutes.delete('/sessions/:sessionId', controller.deleteSession);

// =============================================================================
// FONTES (SOURCES)
// =============================================================================
paperlabRoutes.post('/sessions/:sessionId/sources', upload.single('file'), controller.addSource);
paperlabRoutes.get('/sessions/:sessionId/sources', controller.listSources);
paperlabRoutes.delete('/sessions/:sessionId/sources/:sourceId', controller.deleteSource);

// =============================================================================
// CHAT UNIVERSAL (RAG)
// =============================================================================
paperlabRoutes.post('/sessions/:sessionId/chat', controller.answerChat);

// =============================================================================
// MATERIAIS DE ESTUDO
// =============================================================================
paperlabRoutes.post('/sessions/:sessionId/materials', controller.triggerMaterialGeneration);
paperlabRoutes.get('/sessions/:sessionId/materials', controller.listMaterials);

paperlabRoutes.get('/materials/:materialId', controller.getMaterialDetail);
paperlabRoutes.put('/materials/:materialId', controller.updateMaterialContent);
paperlabRoutes.delete('/materials/:materialId', controller.deleteMaterial);

// =============================================================================
// AGENDAMENTO E REVISÃO DE FLASHCARDS (ANKI SCHEDULER)
// =============================================================================
paperlabRoutes.post('/materials/:materialId/review', controller.reviewFlashcard);

export { paperlabRoutes };
