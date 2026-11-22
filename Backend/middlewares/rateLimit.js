// Limitador de pedidos simples, em memória (sem dependências externas).
// Protege a rota pública de cadastro contra spam e abuso do envio de emails.
function criarRateLimit({ janelaMs = 15 * 60 * 1000, maximo = 10, mensagem } = {}) {
    const registos = new Map();

    const limpeza = setInterval(() => {
        const agora = Date.now();
        for (const [chave, r] of registos) if (r.expira <= agora) registos.delete(chave);
    }, janelaMs);
    if (limpeza.unref) limpeza.unref();

    return function rateLimit(req, res, next) {
        const chave = req.ip || 'desconhecido';
        const agora = Date.now();
        let r = registos.get(chave);
        if (!r || r.expira <= agora) {
            r = { total: 0, expira: agora + janelaMs };
            registos.set(chave, r);
        }
        r.total += 1;
        if (r.total > maximo) {
            res.set('Retry-After', String(Math.ceil((r.expira - agora) / 1000)));
            return res.status(429).json({
                error: mensagem || 'Demasiados pedidos. Tente novamente dentro de alguns minutos.'
            });
        }
        next();
    };
}

module.exports = { criarRateLimit };
