import fs from 'fs';
import yaml from 'js-yaml';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';

// Swagger configuration
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Agency API',
      version: '1.0.0',
      description: 'API документация для AI Agency платформы',
      contact: {
        name: 'AI Agency Support',
        email: 'support@ai-agency.com',
        url: 'https://ai-agency.com/support',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Локальный сервер разработки',
      },
      {
        url: 'https://staging-api.ai-agency.com/v1',
        description: 'Тестовый сервер',
      },
      {
        url: 'https://api.ai-agency.com/v1',
        description: 'Продакшн сервер',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Описание ошибки',
            },
            code: {
              type: 'string',
              description: 'Код ошибки',
            },
            details: {
              type: 'object',
              description: 'Дополнительные детали ошибки',
            },
          },
          required: ['error'],
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Уникальный идентификатор пользователя',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email пользователя',
            },
            name: {
              type: 'string',
              description: 'Имя пользователя',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'moderator'],
              description: 'Роль пользователя',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата создания аккаунта',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата последнего обновления',
            },
          },
          required: ['id', 'email', 'name', 'role'],
        },
        Recommendation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Уникальный идентификатор рекомендации',
            },
            title: {
              type: 'string',
              description: 'Заголовок рекомендации',
            },
            description: {
              type: 'string',
              description: 'Описание рекомендации',
            },
            category: {
              type: 'string',
              description: 'Категория рекомендации',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Приоритет рекомендации',
            },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected', 'implemented'],
              description: 'Статус рекомендации',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата создания',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата последнего обновления',
            },
          },
          required: ['id', 'title', 'description', 'category', 'priority', 'status'],
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./pages/api/**/*.ts', './pages/api/**/*.js'],
};

// Generate swagger spec
let swaggerSpec: any;

try {
  // Try to load existing swagger.yaml
  const swaggerPath = path.join(process.cwd(), 'swagger.yaml');
  if (fs.existsSync(swaggerPath)) {
    const swaggerFile = fs.readFileSync(swaggerPath, 'utf8');
    swaggerSpec = yaml.load(swaggerFile) as any;

    // Merge with generated spec
    const generatedSpec = swaggerJSDoc(options);
    swaggerSpec = {
      ...generatedSpec,
      ...swaggerSpec,
      paths: {
        ...(generatedSpec as any)?.paths,
        ...swaggerSpec.paths,
      },
      components: {
        ...(generatedSpec as any)?.components,
        ...swaggerSpec.components,
        schemas: {
          ...(generatedSpec as any)?.components?.schemas,
          ...swaggerSpec.components?.schemas,
        },
      },
    };
  } else {
    swaggerSpec = swaggerJSDoc(options);
  }
} catch (error) {
  console.error('Error loading swagger spec:', error);
  swaggerSpec = swaggerJSDoc(options);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    res.status(200).json(swaggerSpec);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET method is supported for this endpoint',
    });
  }
}

// Export the swagger spec for use in other files
export { swaggerSpec };
