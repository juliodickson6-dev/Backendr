require('dotenv').config();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const { initializeDatabase } = require('../config/database');

const sqlitePath = process.env.SQLITE_SOURCE || path.join(__dirname, '..', 'ajov_cadastro.db');
const pgConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false } }
    : { host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 5432), database: process.env.DB_NAME || 'ajov_cadastro', user: process.env.DB_USER || 'postgres', password: process.env.DB_PASSWORD };

function readSqliteRows() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY, error => {
            if (error) return reject(error);
            db.all('SELECT * FROM cadastros', [], (err, rows) => {
                db.close();
                if (err) reject(err); else resolve(rows);
            });
        });
    });
}

(async () => {
    const pool = new Pool(pgConfig);
    try {
        await initializeDatabase();
        const rows = await readSqliteRows();
        const columns = [
            'id','nome_completo','nome_pai','nome_mae','data_nascimento','sexo','estado_civil',
            'nacionalidade','naturalidade','formacao','profissao','documentos','numero_identificacao',
            'validade_ate','rua_avenida','quarteirao','bairro','celular','email','local_servico',
            'grau_parentesco','motivacao','aceite_declaracao','data_criacao','data_atualizacao','ip_origem','user_agent'
        ];
        let imported = 0;
        for (const row of rows) {
            const values = columns.map(column => column === 'aceite_declaracao' ? Boolean(row[column]) : (row[column] ?? null));
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            const result = await pool.query(
                `INSERT INTO cadastros (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
                values
            );
            imported += result.rowCount;
        }
        console.log(`Importação concluída: ${imported} registo(s) novo(s), ${rows.length - imported} já existente(s).`);
    } catch (error) {
        console.error('Falha na importação SQLite → PostgreSQL:', error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
        // O pool usado pela aplicação também é fechado pelo processo ao terminar.
        const db = require('../config/database');
        await db.close().catch(() => {});
    }
})();
