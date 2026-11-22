const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const cadastroController = require('../controllers/cadastroController');
const { criarRateLimit } = require('../middlewares/rateLimit');

// Limite para a rota pública: por defeito 10 cadastros por IP a cada 15 minutos.
const limitarCriacao = criarRateLimit({
    janelaMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    maximo: Number(process.env.RATE_LIMIT_MAX || 10)
});

// Comparação em tempo constante, para não revelar o token por diferenças de tempo.
function tokensIguais(a, b) {
    const ha = crypto.createHash('sha256').update(a).digest();
    const hb = crypto.createHash('sha256').update(b).digest();
    return crypto.timingSafeEqual(ha, hb);
}

// Rotas de leitura/alteração de dados pessoais exigem token administrativo.
function exigirTokenAdmin(req, res, next) {
    const tokenConfigurado = process.env.ADMIN_API_TOKEN;
    if (!tokenConfigurado) {
        return res.status(503).json({ error: 'Acesso administrativo não configurado no servidor.' });
    }
    const recebido = (req.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    if (!recebido || !tokensIguais(recebido, tokenConfigurado)) {
        return res.status(401).json({ error: 'Autorização administrativa inválida.' });
    }
    next();
}

router.post('/criar', limitarCriacao, cadastroController.criarCadastro);
router.get('/listar', exigirTokenAdmin, cadastroController.listarCadastros);
router.get('/estatisticas', exigirTokenAdmin, cadastroController.obterEstatisticas);
router.get('/:id', exigirTokenAdmin, cadastroController.obterCadastro);
router.put('/:id', exigirTokenAdmin, cadastroController.atualizarCadastro);
router.delete('/:id', exigirTokenAdmin, cadastroController.deletarCadastro);

module.exports = router;
