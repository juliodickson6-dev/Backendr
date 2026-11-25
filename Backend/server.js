require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cadastroRoutes = require('./routes/cadastro');
const { initializeDatabase, verificarConexao } = require('./config/database');

const app = express();
const PORT = Number(process.env.PORT || 3000);
app.set('trust proxy', 1);

// Origens autorizadas para os frontends AJOV (Cloudflare e Netlify).
// CORS_ORIGIN no Render pode acrescentar outros domínios separados por vírgulas.
const defaultOrigins = [
    'https://icy-sun-011c.juliodickson6.workers.dev',
    'https://effulgent-syrniki-ce2487.netlify.app',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000'
];
const configuredOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(origin => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...configuredOrigins])];

app.use(cors({
    origin(origin, callback) {
        // Permite ferramentas locais sem Origin (curl/health checks) e domínios explicitamente autorizados.
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Origem não autorizada pelo CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

const uploadDir = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
const backupDir = process.env.DATA_BACKUP_DIR || path.join(__dirname, 'data-backup');
for (const directory of [uploadDir, backupDir]) {
    if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
}

app.get('/api/health', async (req, res) => {
    try {
        await verificarConexao();
        res.json({ status: 'ok', message: 'API AJOV operacional', database: 'connected', timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Health check: PostgreSQL indisponível:', error.message);
        res.status(503).json({ status: 'error', database: 'disconnected' });
    }
});

app.get('/', (req, res) => res.json({
    message: 'Backend AJOV - Ficha de Cadastro',
    version: '1.0.0',
    endpoints: {
        health: '/api/health',
        criar_cadastro: 'POST /api/cadastro/criar',
        listar_cadastros: 'GET /api/cadastro/listar (requer token administrativo)',
        obter_cadastro: 'GET /api/cadastro/:id (requer token administrativo)',
        atualizar_cadastro: 'PUT /api/cadastro/:id (requer token administrativo)',
        deletar_cadastro: 'DELETE /api/cadastro/:id (requer token administrativo)'
    }
}));

app.use('/api/cadastro', cadastroRoutes);
app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada', path: req.path, method: req.method }));
app.use((err, req, res, next) => {
    console.error('Erro na API:', err.message);
    const status = err.status || (err.message.includes('CORS') ? 403 : 500);
    res.status(status).json({ error: status === 500 ? 'Erro interno do servidor' : err.message });
});

async function startServer() {
    try {
        console.log('A iniciar backend AJOV...');
        await initializeDatabase();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Backend AJOV disponível na porta ${PORT}`);
            console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        const detalhes = [error.message, error.code, ...(error.errors || []).map(e => `${e.code || ''} ${e.address || ''}:${e.port || ''} ${e.message || ''}`.trim())]
            .filter(Boolean).join(' | ');
        console.error('Não foi possível iniciar o backend:', detalhes || error);
        if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
            console.error('DATABASE_URL não está definida. No Render: Environment > adicione DATABASE_URL com a "Internal Database URL" do PostgreSQL.');
        }
        process.exit(1);
    }
}

if (require.main === module) startServer();
module.exports = app;
