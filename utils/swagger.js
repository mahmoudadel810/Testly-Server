import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Swagger options
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Testly API Documentation',
            version: '1.0.0',
            description: 'Documentation for the Testly Quiz Application API',
            contact: {
                name: 'Testly Support',
                url: 'https://testly-server.vercel.app',
                email: 'support@testly.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'https://testly-server.vercel.app',
                description: 'Production server'
            },
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: [
        join(__dirname, '../modules/auth/authRoutes.js'),
        join(__dirname, '../modules/admin/adminRoutes.js'),
        join(__dirname, '../modules/exam/examRoutes.js'),
        join(__dirname, '../modules/attempt/attemptRoutes.js'),
        join(__dirname, '../modules/contact/contactRoutes.js'),
        join(__dirname, '../DB/models/*.js'),
        join(__dirname, '../modules/*/*.js')
    ]
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

const swaggerDocs = (app, baseUrl) =>
{
    // Swagger page
    app.use(`/${baseUrl}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Testly API Documentation'
    }));

    // Docs in JSON format
    app.get(`/${baseUrl}/docs.json`, (req, res) =>
    {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    console.log(`Swagger docs available at /${baseUrl}/docs`);
};

export default swaggerDocs; 