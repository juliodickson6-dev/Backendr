const nodemailer = require('nodemailer');
const { escapeHtml: esc } = require('../utils/escapeHtml');

// Verificar se configurações de email estão presentes
const EMAIL_CONFIGURADO = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && process.env.EMAIL_DESTINATARIO);

let transporter = null;
let emailVerified = false;

// Função para criar/recriar transporter
function criarTransporter() {
    try {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER.trim(),
                pass: process.env.EMAIL_PASSWORD.trim()
            }
        });
    } catch (error) {
        console.error('❌ Erro ao criar transporter:', error.message);
        return null;
    }
}

// Inicializar transporter se email está configurado
if (EMAIL_CONFIGURADO) {
    transporter = criarTransporter();
    
    if (transporter) {
        // Verificar conexão de forma assíncrona
        transporter.verify().then(success => {
            if (success) {
                emailVerified = true;
                console.log('✅ Email configurado e validado - notificações serão enviadas');
            } else {
                emailVerified = false;
                console.warn('⚠️ Email não validado - verifique credenciais');
            }
        }).catch(error => {
            emailVerified = false;
            console.warn('⚠️ Erro ao validar email:', error.message);
        });
    } else {
        console.warn('⚠️ Não foi possível criar transporter de email');
    }
} else {
    console.warn('⚠️ Email NÃO configurado - cadastros serão salvos sem notificações');
}

// Função com retry automático
async function enviarComRetry(mailOptions, tentativa = 1, maxTentativas = 3) {
    try {
        // Se email não está configurado, pular
        if (!EMAIL_CONFIGURADO) {
            console.warn('⚠️ Email não configurado, pulando envio de notificação');
            return false;
        }

        if (!transporter) {
            console.error('❌ Transporter de email não inicializado');
            // Tentar recriar
            transporter = criarTransporter();
            if (!transporter) {
                return false;
            }
        }

        // Enviar email
        const resultado = await transporter.sendMail(mailOptions);
        console.log(`✅ Email enviado com sucesso - ID: ${resultado.messageId}`);
        return true;

    } catch (error) {
        console.error(`❌ [Tentativa ${tentativa}/${maxTentativas}] Erro ao enviar email:`, error.message);

        // Se ainda há tentativas, aguarde e tente novamente
        if (tentativa < maxTentativas) {
            const delay = 2000 * tentativa; // 2s, 4s, 6s...
            console.log(`⏳ Aguardando ${delay/1000}s antes de tentar novamente...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return enviarComRetry(mailOptions, tentativa + 1, maxTentativas);
        } else {
            console.error('❌ Máximo de tentativas atingido. Email não enviado.');
            return false;
        }
    }
}

// Função para enviar email de notificação
async function enviarEmailCadastro(dados) {
    try {
        // Formatar os dados para o email
        const htmlContent = `
        <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .header { background-color: #0d8b5e; color: white; padding: 20px; text-align: center; border-radius: 4px; margin-bottom: 20px; }
                    .section { margin-bottom: 20px; }
                    .section-title { background-color: #f0fdf7; color: #0d8b5e; padding: 10px; font-weight: bold; border-left: 4px solid #0d8b5e; }
                    .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #eee; }
                    .label { font-weight: bold; width: 200px; color: #0d8b5e; }
                    .value { flex: 1; color: #333; }
                    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🎉 Novo Cadastro Recebido!</h2>
                    </div>

                    <div class="section">
                        <div class="section-title">Informações Pessoais</div>
                        <div class="info-row">
                            <div class="label">Nome Completo:</div>
                            <div class="value">${esc(dados.nome_completo)}</div>
                        </div>
                        <div class="info-row">
                            <div class="label">Data de Nascimento:</div>
                            <div class="value">${esc(dados.data_nascimento)}</div>
                        </div>
                        <div class="info-row">
                            <div class="label">Sexo:</div>
                            <div class="value">${esc(dados.sexo)}</div>
                        </div>
                        <div class="info-row">
                            <div class="label">Pai:</div>
                            <div class="value">${esc(dados.nome_pai)}</div>
                        </div>
                        <div class="info-row">
                            <div class="label">Mãe:</div>
                            <div class="value">${esc(dados.nome_mae)}</div>
                        </div>
                        <div class="info-row">
                            <div class="label">Estado Civil:</div>
                            <div class="value">${esc(dados.estado_civil)}</div>
                        </div>
                        <div class="info-row">
                            <div class="label">Nacionalidade:</div>
                            <div class="value">${esc(dados.nacionalidade)}</div>
                        </div>
                        <div class="info-row">
                            <div class="label">Naturalidade:</div>
                            <div class="value">${esc(dados.naturalidade)}</div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">Informações Profissionais</div>
                        <div class="info-row">
                            <div class="label">Formação:</div>
                            <div class="value">${esc(dados.formacao)}</div>
                        </div>
                        <div class="info-row">
                            <div class="label">Profissão:</div>
                            <div class="value">${esc(dados.profissao)}</div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">Documentação</div>
                        <div class="info-row">
                            <div class="label">Número de Identificação:</div>
                            <div class="value">${esc(dados.numero_identificacao)}</div>
                        </div>
                        <div class="info-row">
                            <div class="label">Validade Até:</div>
                            <div class="value">${esc(dados.validade_ate)}</div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">Endereço</div>
                        <div class="info-row">
                            <div class="label">Rua/Avenida:</div>
                            <div class="value">${esc(dados.rua_avenida)}</div>
                        </div>
                        <div class="info-row">
                            <div class="label">Quarteirao:</div>
                            <div class="value">${esc(dados.quarteirao)}</div>
                        </div>
                        <div class="info-row">
                            <div class="label">Bairro:</div>
                            <div class="value">${esc(dados.bairro)}</div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">Contato</div>
                        <div class="info-row">
                            <div class="label">Celular:</div>
                            <div class="value">${esc(dados.celular)}</div>
                        </div>
                        <div class="info-row">
                            <div class="label">Email:</div>
                            <div class="value">${esc(dados.email)}</div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">Informações Adicionais</div>
                        <div class="info-row">
                            <div class="label">Local de Serviço:</div>
                            <div class="value">${esc(dados.local_servico)}</div>
                        </div>
                        <div class="info-row">
                            <div class="label">Grau de Parentesco:</div>
                            <div class="value">${esc(dados.grau_parentesco)}</div>
                        </div>
                        <div class="info-row">
                            <div class="label">Motivação:</div>
                            <div class="value">${esc(dados.motivacao)}</div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">Metadata</div>
                        <div class="info-row">
                            <div class="label">ID do Cadastro:</div>
                            <div class="value">${esc(dados.id)}</div>
                        </div>
                        <div class="info-row">
                            <div class="label">Data/Hora:</div>
                            <div class="value">${esc(dados.data_criacao || new Date())}</div>
                        </div>
                        <div class="info-row">
                            <div class="label">IP de Origem:</div>
                            <div class="value">${esc(dados.ip_origem)}</div>
                        </div>
                    </div>

                    <div class="footer">
                        <p>Este é um email automatizado da Associação dos Jovens Voluntários (AJOV)</p>
                        <p>Não responda este email. Para mais informações, acesse o painel de administração.</p>
                    </div>
                </div>
            </body>
        </html>
        `;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_DESTINATARIO,
            subject: `Novo Cadastro Recebido - ${String(dados.nome_completo || '').replace(/[\r\n]+/g, ' ')}`,
            html: htmlContent,
            replyTo: dados.email || process.env.EMAIL_USER
        };

        return await enviarComRetry(mailOptions);
    } catch (error) {
        console.error('❌ Erro ao processar email de cadastro:', error.message);
        return false;
    }
}

// Função para enviar email de confirmação para o usuário
async function enviarEmailConfirmacao(email, nomeCompleto) {
    try {
        // Se email não está configurado, pular
        if (!EMAIL_CONFIGURADO) {
            console.warn('⚠️ Email não configurado, pulando envio de confirmação');
            return false;
        }

        const htmlContent = `
        <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .header { background-color: #0d8b5e; color: white; padding: 20px; text-align: center; border-radius: 4px; margin-bottom: 20px; }
                    .message { color: #333; line-height: 1.6; }
                    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>Obrigado por se registrar!</h2>
                    </div>

                    <div class="message">
                        <p>Olá <strong>${esc(nomeCompleto)}</strong>,</p>
                        <p>Seu cadastro foi recebido com sucesso! 🎉</p>
                        <p>Agradecemos seu interesse em participar da Associação dos Jovens Voluntários (AJOV).</p>
                        <p>Em breve você receberá um contato com informações sobre as próximas etapas.</p>
                        <p>Qualquer dúvida, entre em contato conosco.</p>
                        <br>
                        <p>Atenciosamente,<br><strong>Equipe AJOV</strong></p>
                    </div>

                    <div class="footer">
                        <p>Este é um email automatizado. Não responda este email.</p>
                    </div>
                </div>
            </body>
        </html>
        `;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Cadastro Realizado com Sucesso - AJOV',
            html: htmlContent
        };

        return await enviarComRetry(mailOptions);
    } catch (error) {
        console.error('❌ Erro ao processar email de confirmação:', error.message);
        return false;
    }
}

module.exports = {
    enviarEmailCadastro,
    enviarEmailConfirmacao
};
