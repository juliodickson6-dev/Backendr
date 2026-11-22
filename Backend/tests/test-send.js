#!/usr/bin/env node

/**
 * Script de teste da API de cadastro
 * Use: node tests/test-send.js
 */

const API_BASE_URL = 'http://localhost:3000/api';

async function fazerRequisicao(endpoint, metodo = 'GET', dados = null) {
    try {
        const opcoes = {
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (dados) {
            opcoes.body = JSON.stringify(dados);
        }

        console.log(`\n📤 ${metodo} ${API_BASE_URL}${endpoint}`);
        if (dados) console.log('📋 Corpo:', JSON.stringify(dados, null, 2));

        const response = await fetch(`${API_BASE_URL}${endpoint}`, opcoes);
        const resultado = await response.json();

        console.log(`📥 Status: ${response.status}`);
        console.log('📥 Resposta:', JSON.stringify(resultado, null, 2));

        return {
            sucesso: response.ok,
            status: response.status,
            dados: resultado
        };
    } catch (erro) {
        console.error('❌ Erro na requisição:', erro.message);
        return {
            sucesso: false,
            status: 0,
            erro: erro.message
        };
    }
}

async function testar() {
    console.log('🧪 TESTE DE API - Cadastro AJOV\n');
    console.log('=' .repeat(60));

    // Teste 1: Verificar conexão
    console.log('\n✅ TESTE 1: Verificar conexão com o servidor');
    let resultado = await fazerRequisicao('/health');
    if (!resultado.sucesso) {
        console.error('\n❌ ERRO: O servidor não está respondendo!');
        console.error('   Inicie o backend com: npm start (na pasta backend/)');
        process.exit(1);
    }

    // Teste 2: Enviar cadastro válido
    console.log('\n\n✅ TESTE 2: Enviar cadastro válido');
    const dadosValidos = {
        nomeCompleto: 'João Silva Teste',
        nomeMae: 'Maria Silva',
        dataNascimento: '1990-05-15',
        sexo: 'masculino',
        estadoCivil: 'solteiro',
        nacionalidade: 'Moçambicana',
        naturalidade: 'Maputo',
        numeroIdentificacao: 'BI' + Math.floor(Math.random() * 1000000),
        celular: '+258 84 123 4567',
        email: 'teste@example.com',
        aceiteDeclaracao: true
    };

    resultado = await fazerRequisicao('/cadastro/criar', 'POST', dadosValidos);

    if (resultado.sucesso) {
        console.log('\n✅ Cadastro enviado com sucesso!');
        const idCadastro = resultado.dados.data?.id;

        // Teste 3: Recuperar cadastro
        if (idCadastro) {
            console.log('\n\n✅ TESTE 3: Recuperar cadastro');
            await fazerRequisicao(`/cadastro/${idCadastro}`);
        }
    } else {
        console.log('\n❌ Erro ao enviar cadastro:');
        console.log('   Detalhes:', resultado.dados?.detalhes);
    }

    // Teste 4: Listar cadastros
    console.log('\n\n✅ TESTE 4: Listar cadastros');
    await fazerRequisicao('/cadastro/listar');

    // Teste 5: Enviar cadastro COM ERRO (faltam campos)
    console.log('\n\n✅ TESTE 5: Enviar cadastro incompleto (deve falhar)');
    const dadosIncompletos = {
        nomeCompleto: 'João Silva',
        // Faltam campos obrigatórios
        celular: '+258 84 123 4567'
    };

    resultado = await fazerRequisicao('/cadastro/criar', 'POST', dadosIncompletos);
    if (!resultado.sucesso) {
        console.log('\n✅ Validação funcionando corretamente!');
        console.log('   Erros detectados:', resultado.dados?.detalhes);
    } else {
        console.log('\n❌ ERRO: Validação não está funcionando!');
    }

    console.log('\n\n' + '=' .repeat(60));
    console.log('✅ Testes concluídos!');
    console.log('\n💡 Dicas:');
    console.log('  • Verifique os logs do servidor para erros');
    console.log('  • Abra o Developer Tools (F12) no navegador para ver logs');
    console.log('  • Consulte TROUBLESHOOTING.md para mais informações');
}

// Executar testes
testar().catch(err => {
    console.error('\n💥 Erro fatal:', err.message);
    process.exit(1);
});
