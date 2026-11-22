const { Pool, types } = require('pg');

// Devolve colunas DATE como texto 'YYYY-MM-DD' (evita deslocamentos de fuso horário).
types.setTypeParser(1082, value => value);

// PostgreSQL é o banco oficial em desenvolvimento e produção.
// Em produção, configure DATABASE_URL no painel do Render.
const poolConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME || 'ajov_cadastro',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD
    };

if (process.env.DATABASE_SSL === 'true' || (process.env.NODE_ENV === 'production' && process.env.DATABASE_SSL !== 'false')) {
    poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool({ ...poolConfig, max: Number(process.env.DB_POOL_MAX || 10) });
pool.on('error', (error) => console.error('Erro inesperado no pool PostgreSQL:', error));

// Mantém os '?' usados pelo controlador e converte-os para parâmetros PostgreSQL ($1, $2...).
function normalizarSQL(sql) {
    let index = 0;
    return sql
        .replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP')
        .replace(/\?/g, () => `$${++index}`);
}

async function initializeDatabase() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS cadastros (
            id TEXT PRIMARY KEY,
            nome_completo TEXT NOT NULL,
            nome_pai TEXT,
            nome_mae TEXT NOT NULL,
            data_nascimento DATE NOT NULL,
            sexo TEXT NOT NULL,
            estado_civil TEXT NOT NULL,
            nacionalidade TEXT NOT NULL,
            naturalidade TEXT NOT NULL,
            formacao TEXT,
            profissao TEXT,
            documentos TEXT,
            numero_identificacao TEXT NOT NULL UNIQUE,
            validade_ate DATE,
            rua_avenida TEXT,
            quarteirao TEXT,
            bairro TEXT,
            celular TEXT NOT NULL,
            email TEXT,
            local_servico TEXT,
            grau_parentesco TEXT,
            motivacao TEXT,
            aceite_declaracao BOOLEAN NOT NULL DEFAULT FALSE,
            data_criacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            ip_origem TEXT,
            user_agent TEXT
        )
    `);

    await pool.query('CREATE INDEX IF NOT EXISTS idx_cadastros_numero_identificacao ON cadastros(numero_identificacao)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_cadastros_celular ON cadastros(celular)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_cadastros_data_criacao ON cadastros(data_criacao)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_cadastros_nome ON cadastros(nome_completo)');
    console.log('PostgreSQL conectado; tabela e índices verificados.');
}

async function query(sql, params = []) {
    const result = await pool.query(normalizarSQL(sql), params);
    return { lastID: null, changes: result.rowCount, rows: result.rows };
}

async function all(sql, params = []) {
    const result = await pool.query(normalizarSQL(sql), params);
    return result.rows;
}

async function get(sql, params = []) {
    const result = await pool.query(normalizarSQL(sql), params);
    return result.rows[0] || null;
}

async function close() {
    await pool.end();
}

async function verificarConexao() {
    await pool.query('SELECT 1');
    return true;
}

module.exports = { pool, query, all, get, close, initializeDatabase, verificarConexao };
