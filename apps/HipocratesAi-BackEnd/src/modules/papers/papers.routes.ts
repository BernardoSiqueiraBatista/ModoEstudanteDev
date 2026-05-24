import { Router } from 'express';
import { PapersController } from './papers.controller';

const papersRoutes = Router({ mergeParams: true });
const controller = new PapersController();

papersRoutes.post('', controller.createPaper);
papersRoutes.get('', controller.listPapers);
papersRoutes.get('/:paperId', controller.getPaper);
papersRoutes.put('/:paperId', controller.updatePaper);
papersRoutes.delete('/:paperId', controller.deletePaper);
papersRoutes.post('/:paperId/share', controller.sharePaper);

export { papersRoutes };
