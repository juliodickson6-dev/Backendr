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
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const requiredFiles = [
  'server.js', 'package.json', 'config/database.js',
  'controllers/cadastroController.js', 'routes/cadastro.js',
  'services/emailService.js'
];
let ok = true;
console.log('Verificação da estrutura AJOV Backend\n');
for (const rel of requiredFiles) {
  const exists = fs.existsSync(path.join(root, rel));
  console.log(`${exists ? 'OK' : 'FALTA'}  ${rel}`);
  if (!exists) ok = false;
}
console.log('\nVariáveis de ambiente:');
for (const key of ['DATABASE_URL', 'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']) {
  const configured = Boolean(process.env[key]);
  console.log(`${configured ? 'OK' : 'INFO'}  ${key}: ${configured ? 'definida' : 'não definida (configure conforme o ambiente)'}`);
}
for (const key of ['EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_DESTINATARIO', 'ADMIN_API_TOKEN']) {
  console.log(`${process.env[key] ? 'OK' : 'INFO'}  ${key}: ${process.env[key] ? 'definida' : 'não definida'}`);
}
console.log(`\n${ok ? 'Estrutura essencial encontrada.' : 'Há ficheiros essenciais em falta.'}`);
process.exitCode = ok ? 0 : 1;
