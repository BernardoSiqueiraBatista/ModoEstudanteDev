import swaggerUi from 'swagger-ui-express';
import type { Application } from 'express';
import { generateOpenApiSpec } from './openapi';

export function setupSwagger(app: Application) {
  const spec = generateOpenApiSpec();
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customSiteTitle: 'HipocratesAi API Docs',
    }),
  );
  app.get('/openapi.json', (_req, res) => res.json(spec));
}
