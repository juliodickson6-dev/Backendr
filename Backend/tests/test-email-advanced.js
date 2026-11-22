#!/usr/bin/env node
/**
 * 🔧 TESTE DETALHADO DE EMAIL
 * Execute: node backend/tests/test-email-advanced.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('\n' + '='.repeat(70));
console.log('📧 TESTE AVANÇADO DE EMAIL - DIAGÓSTICO DETALHADO');
console.log('='.repeat(70) + '\n');

// 1. Verificar ambiente
console.log('1️⃣ VERIFICAÇÃO DE VARIÁVEIS:');
console.log('   EMAIL_USER:', process.env.EMAIL_USER ? `✅ ${process.env.EMAIL_USER}` : '❌ VAZIO');
console.log('   EMAIL_PASSWORD length:', process.env.EMAIL_PASSWORD ? `✅ ${process.env.EMAIL_PASSWORD.length} caracteres` : '❌ VAZIO');
console.log('   EMAIL_DESTINATARIO:', process.env.EMAIL_DESTINATARIO ? `✅ ${process.env.EMAIL_DESTINATARIO}` : '❌ VAZIO');

// Detectar se há espaços
if (process.env.EMAIL_PASSWORD) {
    if (process.env.EMAIL_PASSWORD !== process.env.EMAIL_PASSWORD.trim()) {
        console.log('   ⚠️  AVISO: EMAIL_PASSWORD tem espaços antes ou depois!');
        console.log('      Comprimento com espaços:', process.env.EMAIL_PASSWORD.length);
        console.log('      Comprimento sem espaços:', process.env.EMAIL_PASSWORD.trim().length);
    }
    if (process.env.EMAIL_PASSWORD.includes(' ')) {
        console.log('   ⚠️  AVISO: EMAIL_PASSWORD tem espaços NO MEIO!');
        console.log('      Isso é normal para senhas de app do Gmail (devem ter espaços)');
    }
}

// 2. Criar transporter
console.log('\n2️⃣ CRIAÇÃO DE TRANSPORTER:');
let transporter;
try {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    console.log('   ✅ Transporter criado com sucesso');
} catch (error) {
    console.log('   ❌ ERRO ao criar transporter:');
    console.log('      ', error.message);
    process.exit(1);
}

// 3. Verificar credenciais
console.log('\n3️⃣ VERIFICAÇÃO DE CREDENCIAIS:');
transporter.verify((error, success) => {
    if (error) {
        console.log('   ❌ ERRO de autenticação:');
        console.log('      Mensagem:', error.message);
        console.log('      Código:', error.code);
        console.log('\n   🔧 POSSÍVEIS SOLUÇÕES:');
        console.log('      1. Verificar se EMAIL_USER está correto em .env');
        console.log('      2. Verificar se EMAIL_PASSWORD está correto');
        console.log('      3. Se usar 2FA, gere nova senha em:');
        console.log('         https://myaccount.google.com/apppasswords');
        console.log('      4. Tente desabilitar "Menos seguro" na conta Google');
        console.log('      5. Aguarde 5-10 minutos após gerar nova senha');
        process.exit(1);
    } else {
        console.log('   ✅ Credenciais validadas com sucesso!');
        console.log('      Servidor SMTP conectado: smtp.gmail.com');
        
        // 4. Enviar email de teste
        console.log('\n4️⃣ ENVIANDO EMAIL DE TESTE:');
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_DESTINATARIO || process.env.EMAIL_USER,
            subject: '🧪 TESTE DE EMAIL - AJOV Cadastro',
            html: `
            <html>
                <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px;">
                        <div style="background-color: #0d8b5e; color: white; padding: 20px; text-align: center; border-radius: 4px; margin-bottom: 20px;">
                            <h2>🧪 Email de Teste Funcionando!</h2>
                        </div>
                        <p>Este é um email de teste enviado pelo script de diagnóstico.</p>
                        <p><strong>Se você recebeu este email, o sistema está funcionando corretamente!</strong></p>
                        <hr>
                        <p><strong>Detalhes da Configuração:</strong></p>
                        <ul>
                            <li>Remetente: ${process.env.EMAIL_USER}</li>
                            <li>Destinatário: ${process.env.EMAIL_DESTINATARIO || process.env.EMAIL_USER}</li>
                            <li>Data/Hora: ${new Date().toLocaleString('pt-BR')}</li>
                            <li>Status: ✅ OK</li>
                        </ul>
                        <p style="color: #999; font-size: 12px; margin-top: 20px;">
                            Email enviado automaticamente - Não responder
                        </p>
                    </div>
                </body>
            </html>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('   ❌ ERRO ao enviar email:');
                console.log('      Mensagem:', error.message);
                console.log('      Código:', error.code);
                console.log('\n   🔧 POSSÍVEIS SOLUÇÕES:');
                console.log('      • Verifique a conexão de internet');
                console.log('      • Tente novamente em alguns segundos');
                console.log('      • Gmail pode estar bloqueando a tentativa');
                process.exit(1);
            } else {
                console.log('   ✅ EMAIL ENVIADO COM SUCESSO!');
                console.log('      ID da Mensagem:', info.messageId);
                console.log('      Resposta do servidor:', info.response);
                console.log('\n' + '='.repeat(70));
                console.log('✅ SISTEMA DE EMAIL ESTÁ FUNCIONANDO CORRETAMENTE!');
                console.log('='.repeat(70));
                console.log('\n🎉 Agora o formulário deve enviar cadastros normalmente.');
                console.log('\n💡 Próximos passos:');
                console.log('   1. Feche este script (Ctrl+C)');
                console.log('   2. Execute: npm start');
                console.log('   3. Teste o formulário em http://localhost:3000');
                console.log('\n' + '='.repeat(70) + '\n');
                process.exit(0);
            }
        });
    }
});
