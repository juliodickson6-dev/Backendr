
const { escapeHtml: esc } = require('../utils/escapeHtml');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

function obterConfiguracao() {
    const apiKey = process.env.BREVO_API_KEY;
    const from = process.env.EMAIL_FROM;
    const to = process.env.EMAIL_DESTINATARIO;

    if (!apiKey || !from || !to) {
        console.warn('⚠️ [EMAIL] Brevo não configurado. Verifique BREVO_API_KEY, EMAIL_FROM e EMAIL_DESTINATARIO no Render.');
        return null;
    }

    return {
        apiKey: apiKey.trim(),
        from: from.trim(),
        to: to.trim(),
        fromName: (process.env.EMAIL_FROM_NAME || 'AJOV – Associação dos Jovens Voluntários').trim()
    };
}

async function enviarPeloBrevo({ to, subject, html, replyTo }) {
    const config = obterConfiguracao();
    if (!config) return false;

    try {
        const payload = {
            sender: { name: config.fromName, email: config.from },
            to: [{ email: to }],
            subject,
            htmlContent: html
        };

        if (replyTo) payload.replyTo = { email: replyTo };

        const response = await fetch(BREVO_API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': config.apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(15000)
        });

        const responseText = await response.text();

        if (!response.ok) {
            console.error(`❌ [BREVO] API respondeu ${response.status}: ${responseText.slice(0, 1000)}`);
            return false;
        }

        let result = {};
        try {
            result = responseText ? JSON.parse(responseText) : {};
        } catch (_) {}

        console.log('✅ [BREVO] Email aceite para envio. Message ID:', result.messageId || 'não fornecido');
        return true;

    } catch (error) {
        console.error(
            '❌ [BREVO] Falha no envio:',
            error.name === 'TimeoutError' ? 'tempo limite excedido' : error.message
        );
        return false;
    }
}

function linha(rotulo, valor) {
    return `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;color:#0d8b5e;width:200px">${rotulo}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;color:#333">${esc(valor ?? '')}</td>
    </tr>`;
}

function criarHtmlCadastro(dados) {
    const documentos = Array.isArray(dados.documentos)
        ? dados.documentos.join(', ')
        : dados.documentos;

    return `<!doctype html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px">
<div style="max-width:680px;margin:auto;background:#fff;padding:24px;border-radius:8px">

    <div style="background:#0d8b5e;color:#fff;padding:18px;text-align:center">
        <h2>Nova candidatura recebida – AJOV</h2>
    </div>

    <h3 style="color:#0d8b5e">Informações pessoais</h3>
    <table style="width:100%;border-collapse:collapse">
        ${linha('Nome completo', dados.nome_completo)}
        ${linha('Data de nascimento', dados.data_nascimento)}
        ${linha('Sexo', dados.sexo)}
        ${linha('Nome do pai', dados.nome_pai)}
        ${linha('Nome da mãe', dados.nome_mae)}
        ${linha('Estado civil', dados.estado_civil)}
        ${linha('Nacionalidade', dados.nacionalidade)}
        ${linha('Naturalidade', dados.naturalidade)}
    </table>

    <h3 style="color:#0d8b5e">Informações profissionais</h3>
    <table style="width:100%;border-collapse:collapse">
        ${linha('Formação', dados.formacao)}
        ${linha('Profissão', dados.profissao)}
        ${linha('Local de serviço', dados.local_servico)}
        ${linha('Grau de parentesco', dados.grau_parentesco)}
    </table>

    <h3 style="color:#0d8b5e">Documentação</h3>
    <table style="width:100%;border-collapse:collapse">
        ${linha('Documentos', documentos)}
        ${linha('Número de identificação', dados.numero_identificacao)}
        ${linha('Validade até', dados.validade_ate)}
    </table>

    <h3 style="color:#0d8b5e">Contacto e endereço</h3>
    <table style="width:100%;border-collapse:collapse">
        ${linha('Email', dados.email)}
        ${linha('Celular', dados.celular)}
        ${linha('Rua/Avenida', dados.rua_avenida)}
        ${linha('Quarteirão', dados.quarteirao)}
        ${linha('Bairro', dados.bairro)}
    </table>

    <h3 style="color:#0d8b5e">Registo</h3>
    <table style="width:100%;border-collapse:collapse">
        ${linha('ID do cadastro', dados.id)}
        ${linha('Data de criação', dados.data_criacao || new Date().toISOString())}
    </table>

    <p style="color:#777;font-size:12px;margin-top:24px">
        Mensagem automática do sistema de candidaturas da Associação dos Jovens Voluntários (AJOV).
    </p>
</div>
</body>
</html>`;
}

async function enviarEmailCadastro(dados) {
    const config = obterConfiguracao();
    if (!config) return false;

    const nome = String(dados.nome_completo || 'Nova candidatura')
        .replace(/[\r\n]+/g, ' ')
        .slice(0, 150);

    return enviarPeloBrevo({
        to: config.to,
        subject: `Nova candidatura recebida – ${nome}`,
        html: criarHtmlCadastro(dados),
        replyTo: dados.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)
            ? dados.email
            : undefined
    });
}

async function enviarEmailConfirmacao(email, nomeCompleto) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return false;
    }

    const nomeSeguro = esc(nomeCompleto || '');

    const html = `<!doctype html>
<html>
<body style="font-family:Arial,sans-serif;color:#333;line-height:1.6">
<div style="max-width:600px;margin:auto;padding:24px">

    <h2 style="color:#0d8b5e">Candidatura recebida – AJOV</h2>

    <p>Olá <strong>${nomeSeguro}</strong>,</p>

    <p>
        A sua candidatura foi recebida com sucesso pela
        Associação dos Jovens Voluntários (AJOV).
    </p>

    <p>
        A equipa irá analisar a inscrição e entrará em contacto
        caso sejam necessárias informações adicionais.
    </p>

    <p>
        Com os melhores cumprimentos,<br>
        <strong>Equipa AJOV</strong>
    </p>

</div>
</body>
</html>`;

    return enviarPeloBrevo({
        to: email,
        subject: 'Candidatura recebida – AJOV',
        html
    });
}

module.exports = {
    enviarEmailCadastro,
    enviarEmailConfirmacao
};
