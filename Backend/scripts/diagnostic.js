#!/usr/bin/env node
// Carrega .env sem depender de módulos instalados (valores não são impressos).
const envFile = require('path').join(__dirname, '..', '.env');
if (require('fs').existsSync(envFile)) {
  for (const line of require('fs').readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !Object.prototype.hasOwnProperty.call(process.env, match[1])) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }
}
const path = require('path');
const fs = require('fs');
const root = path.join(__dirname, '..');
console.log('Diagnóstico AJOV Cadastro');
console.log('Node:', process.version);
console.log('Backend .env:', fs.existsSync(path.join(root, '.env')) ? 'encontrado' : 'não encontrado — copie .env.example para .env');
for (const moduleName of ['express', 'cors', 'dotenv', 'nodemailer', 'pg']) {
  try { require.resolve(moduleName, { paths: [root] }); console.log(`${moduleName}: instalado`); }
  catch { console.log(`${moduleName}: FALTA — execute npm install`); }
}
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'configurada' : 'não configurada (pode usar DB_* local)');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'configurado' : 'não configurado');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'configurada' : 'não configurada');
console.log('EMAIL_DESTINATARIO:', process.env.EMAIL_DESTINATARIO ? 'configurado' : 'não configurado');
console.log('ADMIN_API_TOKEN:', process.env.ADMIN_API_TOKEN ? 'configurado' : 'não configurado');
