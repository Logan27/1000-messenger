import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

const router = Router();

// Load OpenAPI specification
const openApiPath = path.join(__dirname, '../../docs/openapi.yaml');
const openApiFile = fs.readFileSync(openApiPath, 'utf8');
const swaggerDocument = yaml.load(openApiFile) as object;

// Custom CSS for Swagger UI
const customCss = `
  .swagger-ui .topbar { display: none; }
  .swagger-ui .info { margin: 20px 0; }
  .swagger-ui .info .title { color: #2563eb; }
`;

// Swagger UI options
const swaggerOptions = {
  customCss,
  customSiteTitle: '1000-Messenger API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
  },
};

// Serve Swagger UI
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerDocument, swaggerOptions));

// Serve raw OpenAPI spec in JSON format
router.get('/openapi.json', (_req, res) => {
  res.json(swaggerDocument);
});

// Serve raw OpenAPI spec in YAML format
router.get('/openapi.yaml', (_req, res) => {
  res.type('text/yaml');
  res.send(openApiFile);
});

export default router;
