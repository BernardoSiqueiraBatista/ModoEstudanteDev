import { Router } from 'express';
import { asyncAuthHandler } from '../../shared/http/asyncHandler';
import { validateQuery } from '../../shared/http/validate-query';
import { searchQuerySchema } from './dtos/search.query';
import { globalSearchController } from './search.controller';

const router = Router();

router.get('/', validateQuery(searchQuerySchema), asyncAuthHandler(globalSearchController));

export { router as searchRoutes };
