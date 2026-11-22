#!/usr/bin/env node

const http = require('http');

function fazerRequisicao(dados) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/cadastro/criar',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(dados))
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const resultado = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        dados: resultado
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        dados: data
                    });
                }
            });
        });

        req.on('error', reject);
        req.write(JSON.stringify(dados));
        req.end();
    });
}

async function testar() {
    console.log('\n🧪 TESTE RÁPIDO DA API\n');
    
    const id = 'TESTE' + Date.now();
    
    const dados = {
        nomeCompleto: 'Teste Automatizado',
        nomeMae: 'Mãe Teste',
        dataNascimento: '1990-01-01',
        sexo: 'masculino',
        estadoCivil: 'solteiro',
        nacionalidade: 'Moçambicana',
        naturalidade: 'Maputo',
        numeroIdentificacao: id,
        celular: '+258 84 9999999',
        email: 'test@example.com',
        aceiteDeclaracao: true
    };

    console.log('📤 Enviando cadastro...');
    try {
        const resultado = await fazerRequisicao(dados);
        
        if (resultado.status === 201) {
            console.log('✅ SUCESSO! Status:', resultado.status);
            console.log('📋 Resposta:', JSON.stringify(resultado.dados, null, 2));
        } else {
            console.log('❌ Erro! Status:', resultado.status);
            console.log('📋 Resposta:', JSON.stringify(resultado.dados, null, 2));
        }
    } catch (erro) {
        console.log('❌ Erro na requisição:', erro.message);
    }
    console.log('');
}

testar();
