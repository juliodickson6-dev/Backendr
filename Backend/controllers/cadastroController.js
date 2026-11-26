
const { query, all, get } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const {
    enviarEmailCadastro,
    enviarEmailConfirmacao
} = require('../services/emailService');

const DOCUMENTOS_VALIDOS = ['bilhete', 'passaporte', 'cPessoal'];

// Validar data YYYY-MM-DD
function dataValida(texto) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null;

    const d = new Date(`${texto}T00:00:00Z`);

    if (
        Number.isNaN(d.getTime()) ||
        d.toISOString().slice(0, 10) !== texto
    ) {
        return null;
    }

    return d;
}

// Validar e limpar os dados recebidos
function validarCadastro(body) {
    const erros = [];
    const b = body && typeof body === 'object' ? body : {};

    function texto(nome, { obrigatorio = false, max = 200 } = {}) {
        const valor = b[nome];

        if (valor === undefined || valor === null || valor === '') {
            if (obrigatorio) erros.push(`${nome} é obrigatório`);
            return null;
        }

        if (typeof valor !== 'string') {
            erros.push(`${nome} deve ser texto`);
            return null;
        }

        const limpo = valor.trim();

        if (!limpo) {
            if (obrigatorio) erros.push(`${nome} é obrigatório`);
            return null;
        }

        if (limpo.length > max) {
            erros.push(`${nome} deve ter no máximo ${max} caracteres`);
            return null;
        }

        return limpo;
    }

    const c = {
        nomeCompleto: texto('nomeCompleto', { obrigatorio: true, max: 150 }),
        nomePai: texto('nomePai', { max: 150 }),
        nomeMae: texto('nomeMae', { obrigatorio: true, max: 150 }),
        dataNascimento: texto('dataNascimento', { obrigatorio: true, max: 10 }),
        sexo: texto('sexo', { obrigatorio: true, max: 20 }),
        estadoCivil: texto('estadoCivil', { obrigatorio: true, max: 50 }),
        nacionalidade: texto('nacionalidade', { obrigatorio: true, max: 100 }),
        naturalidade: texto('naturalidade', { obrigatorio: true, max: 150 }),
        formacao: texto('formacao', { max: 150 }),
        profissao: texto('profissao', { max: 150 }),
        numeroIdentificacao: texto('numeroIdentificacao', { obrigatorio: true, max: 50 }),
        validadeAte: texto('validadeAte', { max: 10 }),
        ruaAvenida: texto('ruaAvenida', { max: 200 }),
        quarteirao: texto('quarteirao', { max: 50 }),
        bairro: texto('bairro', { max: 150 }),
        celular: texto('celular', { obrigatorio: true, max: 30 }),
        email: texto('email', { max: 254 }),
        localServico: texto('localServico', { max: 200 }),
        grauParentesco: texto('grauParentesco', { max: 100 }),
        motivacao: texto('motivacao', { max: 3000 })
    };

    if (c.sexo && !['masculino', 'feminino'].includes(c.sexo)) {
        erros.push('sexo deve ser "masculino" ou "feminino"');
    }

    if (c.dataNascimento) {
        const nasc = dataValida(c.dataNascimento);

        if (!nasc) {
            erros.push('dataNascimento deve ser uma data válida no formato YYYY-MM-DD');
        } else if (
            nasc > new Date() ||
            nasc.getUTCFullYear() < 1900
        ) {
            erros.push('dataNascimento está fora do intervalo permitido');
        }
    }

    if (c.validadeAte && !dataValida(c.validadeAte)) {
        erros.push('validadeAte deve ser uma data válida no formato YYYY-MM-DD');
    }

    if (c.celular && !/^[+\d\s()-]{7,30}$/.test(c.celular)) {
        erros.push('celular deve conter apenas números, espaços e o sinal +');
    }

    if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) {
        erros.push('email deve estar em um formato válido');
    }

    if (
        b.aceiteDeclaracao !== true &&
        b.aceiteDeclaracao !== 'true'
    ) {
        erros.push('Você deve aceitar a declaração');
    }

    let documentos = null;

    if (b.documentos !== undefined && b.documentos !== null) {
        if (
            !Array.isArray(b.documentos) ||
            b.documentos.length > 10 ||
            b.documentos.some(
                d => typeof d !== 'string' ||
                !DOCUMENTOS_VALIDOS.includes(d)
            )
        ) {
            erros.push('documentos contém valores inválidos');
        } else if (b.documentos.length > 0) {
            documentos = JSON.stringify([...new Set(b.documentos)]);
        }
    }

    return { erros, c, documentos };
}

// Backup JSON
function salvarBackupJSON(dados) {
    if (
        process.env.NODE_ENV === 'production' &&
        process.env.BACKUP_JSON_ENABLED !== 'true'
    ) {
        return;
    }

    try {
        const backupDir = process.env.DATA_BACKUP_DIR || './data-backup';

        fs.mkdirSync(backupDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `cadastro_${timestamp}_${dados.id}.json`;
        const filepath = path.join(backupDir, filename);

        fs.writeFileSync(
            filepath,
            JSON.stringify(dados, null, 2),
            'utf-8'
        );

        console.log(`📝 Backup salvo: ${filename}`);

    } catch (error) {
        console.error('Erro ao salvar backup JSON:', error.message);
    }
}

// Processar emails em segundo plano
function processarNotificacoes(dados) {
    setImmediate(async () => {
        console.log('📧 [EMAIL] Iniciando processamento das notificações...');

        // Notificação para AJOV
        try {
            const enviadoAJOV = await enviarEmailCadastro(dados);

            if (enviadoAJOV) {
                console.log('✅ [EMAIL] Notificação enviada para AJOV.');
            } else {
                console.error('❌ [EMAIL] Falha ao notificar AJOV.');
            }
        } catch (error) {
            console.error(
                '❌ [EMAIL] Erro ao notificar AJOV:',
                error.message
            );
        }

        // Confirmação para o candidato
        try {
            if (dados.email) {
                const enviadoCandidato = await enviarEmailConfirmacao(
                    dados.email,
                    dados.nome_completo
                );

                if (enviadoCandidato) {
                    console.log('✅ [EMAIL] Confirmação enviada ao candidato.');
                } else {
                    console.error('⚠️ [EMAIL] Confirmação ao candidato não enviada.');
                }
            }
        } catch (error) {
            console.error(
                '❌ [EMAIL] Erro ao enviar confirmação:',
                error.message
            );
        }

        console.log('📧 [EMAIL] Processamento de notificações concluído.');
    });
}

// Criar novo cadastro
exports.criarCadastro = async (req, res) => {
    const startTime = Date.now();

    console.log('\n' + '='.repeat(60));
    console.log('📥 [CADASTRO] Nova requisição recebida');
    console.log('IP:', req.ip);
    console.log('Hora:', new Date().toLocaleString('pt-BR'));

    try {
        const { erros, c, documentos } = validarCadastro(req.body);

        if (erros.length > 0) {
            console.log('❌ [VALIDAÇÃO] Erros encontrados:', erros.length);

            return res.status(400).json({
                success: false,
                error: 'Validação falhou',
                detalhes: erros
            });
        }

        console.log('✅ [VALIDAÇÃO] Dados correctos');

        // Verificar número de identificação duplicado
        console.log('🔍 [BD] Verificando número de identificação...');

        const existente = await get(
            'SELECT id FROM cadastros WHERE numero_identificacao = ?',
            [c.numeroIdentificacao]
        );

        if (existente) {
            console.log('❌ [BD] Número de identificação duplicado');

            return res.status(409).json({
                success: false,
                error: 'Este número de identificação já está cadastrado'
            });
        }

        console.log('✅ [BD] Número de identificação disponível');

        const id = uuidv4();

        const ipOrigem =
            req.ip ||
            req.connection?.remoteAddress ||
            'unknown';

        const userAgent = req.get('user-agent') || 'unknown';

        // Inserir cadastro no PostgreSQL
        try {
            console.log('💾 [BD] A guardar cadastro...');

            await query(
                `INSERT INTO cadastros (
                    id, nome_completo, nome_pai, nome_mae,
                    data_nascimento, sexo, estado_civil,
                    nacionalidade, naturalidade, formacao,
                    profissao, documentos, numero_identificacao,
                    validade_ate, rua_avenida, quarteirao,
                    bairro, celular, email, local_servico,
                    grau_parentesco, motivacao, aceite_declaracao,
                    ip_origem, user_agent
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?
                )`,
                [
                    id,
                    c.nomeCompleto,
                    c.nomePai,
                    c.nomeMae,
                    c.dataNascimento,
                    c.sexo,
                    c.estadoCivil,
                    c.nacionalidade,
                    c.naturalidade,
                    c.formacao,
                    c.profissao,
                    documentos,
                    c.numeroIdentificacao,
                    c.validadeAte,
                    c.ruaAvenida,
                    c.quarteirao,
                    c.bairro,
                    c.celular,
                    c.email,
                    c.localServico,
                    c.grauParentesco,
                    c.motivacao,
                    true,
                    ipOrigem,
                    userAgent
                ]
            );

        } catch (dbError) {
            console.error('❌ [BD] Erro ao inserir:', dbError.message);

            if (dbError.code === '23505') {
                return res.status(409).json({
                    success: false,
                    error: 'Este número de identificação já está cadastrado'
                });
            }

            return res.status(500).json({
                success: false,
                error: 'Erro ao salvar cadastro no banco de dados'
            });
        }

        // Recuperar registo guardado
        console.log('🔍 [BD] A recuperar cadastro...');

        const dados = await get(
            'SELECT * FROM cadastros WHERE id = ?',
            [id]
        );

        if (!dados) {
            console.error('❌ [BD] Registo não recuperado');

            return res.status(500).json({
                success: false,
                error: 'Registro inserido mas não foi recuperado'
            });
        }

        console.log('✅ [BD] Cadastro guardado com sucesso');

        // Backup opcional
        salvarBackupJSON(dados);

        // Preparar notificações sem esperar pelo envio
        processarNotificacoes(dados);

        const elapsed = Date.now() - startTime;

        console.log(
            '✅ [CADASTRO] Finalizado em',
            elapsed,
            'ms'
        );

        console.log('='.repeat(60) + '\n');

        // Responder ao frontend imediatamente
        return res.status(201).json({
            success: true,
            message: 'Candidatura recebida e guardada com sucesso.',
            emailPendente: true,
            data: {
                id: dados.id,
                nome: dados.nome_completo,
                email: dados.email,
                data_criacao: dados.data_criacao
            }
        });

    } catch (error) {
        const elapsed = Date.now() - startTime;

        console.error(
            '❌ [ERRO] Erro geral ao criar cadastro:',
            error.message
        );

        console.error('Tempo decorrido:', elapsed, 'ms');
        console.log('='.repeat(60) + '\n');

        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                error: 'Erro ao processar cadastro'
            });
        }
    }
};

// Listar todos os cadastros
exports.listarCadastros = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            100,
            Math.max(1, parseInt(req.query.limit, 10) || 10)
        );

        const offset = (page - 1) * limit;

        const countResult = await get(
            'SELECT COUNT(*) as count FROM cadastros'
        );

        const total = Number(countResult.count || 0);

        const resultado = await all(
            `SELECT id, nome_completo, celular, email, data_criacao
             FROM cadastros
             ORDER BY data_criacao DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        return res.json({
            success: true,
            data: resultado,
            paginacao: {
                total,
                pagina: page,
                limite: limit,
                total_paginas: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Erro ao listar cadastros:', error.message);

        return res.status(500).json({
            success: false,
            error: 'Erro ao listar cadastros'
        });
    }
};

// Obter cadastro por ID
exports.obterCadastro = async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await get(
            'SELECT * FROM cadastros WHERE id = ?',
            [id]
        );

        if (!resultado) {
            return res.status(404).json({
                success: false,
                error: 'Cadastro não encontrado'
            });
        }

        return res.json({
            success: true,
            data: resultado
        });

    } catch (error) {
        console.error('Erro ao obter cadastro:', error.message);

        return res.status(500).json({
            success: false,
            error: 'Erro ao obter cadastro'
        });
    }
};

// Atualizar cadastro
exports.atualizarCadastro = async (req, res) => {
    try {
        const { id } = req.params;
        const corpo = req.body && typeof req.body === 'object'
            ? req.body
            : {};

        const limpo = (v, max) =>
            typeof v === 'string' && v.trim() && v.trim().length <= max
                ? v.trim()
                : null;

        const celular = limpo(corpo.celular, 30);
        const email = limpo(corpo.email, 254);
        const localServico = limpo(corpo.localServico, 200);

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'email deve estar em um formato válido'
            });
        }

        const existe = await get(
            'SELECT id FROM cadastros WHERE id = ?',
            [id]
        );

        if (!existe) {
            return res.status(404).json({
                success: false,
                error: 'Cadastro não encontrado'
            });
        }

        await query(
            `UPDATE cadastros
             SET celular = COALESCE(?, celular),
                 email = COALESCE(?, email),
                 local_servico = COALESCE(?, local_servico),
                 data_atualizacao = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                celular,
                email,
                localServico,
                id
            ]
        );

        const resultado = await get(
            'SELECT * FROM cadastros WHERE id = ?',
            [id]
        );

        return res.json({
            success: true,
            message: 'Cadastro atualizado com sucesso',
            data: resultado
        });

    } catch (error) {
        console.error('Erro ao atualizar cadastro:', error.message);

        return res.status(500).json({
            success: false,
            error: 'Erro ao atualizar cadastro'
        });
    }
};

// Deletar cadastro
exports.deletarCadastro = async (req, res) => {
    try {
        const { id } = req.params;

        const existe = await get(
            'SELECT id FROM cadastros WHERE id = ?',
            [id]
        );

        if (!existe) {
            return res.status(404).json({
                success: false,
                error: 'Cadastro não encontrado'
            });
        }

        await query(
            'DELETE FROM cadastros WHERE id = ?',
            [id]
        );

        return res.json({
            success: true,
            message: 'Cadastro deletado com sucesso',
            id
        });

    } catch (error) {
        console.error('Erro ao deletar cadastro:', error.message);

        return res.status(500).json({
            success: false,
            error: 'Erro ao deletar cadastro'
        });
    }
};

// Estatísticas
exports.obterEstatisticas = async (req, res) => {
    try {
        const stats = await get(`
            SELECT
                COUNT(*) as total_cadastros,
                COUNT(DISTINCT DATE(data_criacao)) as dias_com_cadastros,
                MIN(data_criacao) as primeiro_cadastro,
                MAX(data_criacao) as ultimo_cadastro
            FROM cadastros
        `);

        return res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Erro ao obter estatísticas:', error.message);

        return res.status(500).json({
            success: false,
            error: 'Erro ao obter estatísticas'
        });
    }
};
