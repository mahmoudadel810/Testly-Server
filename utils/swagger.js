import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dynamic server configuration based on environment
const getServerConfig = (baseUrl) =>
{
    const servers = [];

    // Production server configuration
    if (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production')
    {
        servers.push({
            url: `https://testly-server.vercel.app/${baseUrl}`,
            description: 'Production server'
        });
    }

    // Development server configuration
    servers.push({
        url: `http://localhost:${process.env.PORT || 3000}/${baseUrl}`,
        description: 'Development server'
    });

    return servers;
};

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
        servers: [], // Will be populated dynamically
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

const swaggerDocs = (app, baseUrl) =>
{
    // Set dynamic servers based on baseUrl
    swaggerOptions.definition.servers = getServerConfig(baseUrl);

    // Generate swagger spec with dynamic configuration
    const swaggerSpec = swaggerJsDoc(swaggerOptions);

    // Swagger page setup - register for both possible BASE_URLs
    const setupSwaggerUI = (path) =>
    {
        app.use(path, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
            explorer: true,
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'Testly API Documentation',
            swaggerOptions: {
                persistAuthorization: true,
                displayRequestDuration: true
            }
        }));
    };

    // JSON docs setup
    const setupSwaggerJSON = (path) =>
    {
        app.get(path, (req, res) =>
        {
            res.setHeader('Content-Type', 'application/json');
            res.send(swaggerSpec);
        });
    };

    // Register swagger routes for current baseUrl
    setupSwaggerUI(`/${baseUrl}/docs`);
    setupSwaggerJSON(`/${baseUrl}/docs.json`);

    // If we're in production and baseUrl is 'api', also register for 'testly/v1'
    if (process.env.VERCEL_ENV === 'production' && baseUrl === 'api')
    {
        setupSwaggerUI('/testly/v1/docs');
        setupSwaggerJSON('/testly/v1/docs.json');
        console.log(`📚 Additional Swagger docs available at /testly/v1/docs`);
    }

    // If we're in development and baseUrl is 'testly/v1', also register for 'api'
    if (process.env.VERCEL_ENV !== 'production' && baseUrl === 'testly/v1')
    {
        setupSwaggerUI('/api/docs');
        setupSwaggerJSON('/api/docs.json');
        console.log(`📚 Additional Swagger docs available at /api/docs`);
    }

    console.log(`📚 Swagger docs available at /${baseUrl}/docs`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🚀 Vercel ENV: ${process.env.VERCEL_ENV || 'not set'}`);
    console.log(`🔗 Current BASE_URL: ${baseUrl}`);
};

export default swaggerDocs; 