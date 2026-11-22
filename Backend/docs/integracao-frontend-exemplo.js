/**
 * INTEGRAÇÃO FRONTEND-BACKEND
 * 
 * Adicione este código ao seu arquivo HTML no final do script
 * para integrar com o backend Node.js + Express
 */

// ========================================
// CONFIGURAÇÃO
// ========================================

const API_BASE_URL = 'http://localhost:3000/api';
const API_TIMEOUT = 30000; // 30 segundos

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

/**
 * Fazer requisição para o backend
 */
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

        const response = await fetch(`${API_BASE_URL}${endpoint}`, opcoes);
        const resultado = await response.json();

        return {
            sucesso: response.ok,
            status: response.status,
            dados: resultado
        };
    } catch (erro) {
        console.error('Erro na requisição:', erro);
        return {
            sucesso: false,
            status: 500,
            erro: erro.message
        };
    }
}

/**
 * Converter form data para JSON
 */
function formularioParaJSON(formElement) {
    const formData = new FormData(formElement);
    const json = {};

    for (let [chave, valor] of formData.entries()) {
        // Converter nomes camelCase
        let chaveFormatada = chave;
        
        // Mapeamento de campos do form HTML para API
        const mapeamento = {
            'nomeCompleto': 'nomeCompleto',
            'nomePai': 'nomePai',
            'nomeMae': 'nomeMae',
            'dataNascimento': 'dataNascimento',
            'sexo': 'sexo',
            'estadoCivil': 'estadoCivil',
            'nacionalidade': 'nacionalidade',
            'naturalidade': 'naturalidade',
            'formacao': 'formacao',
            'profissao': 'profissao',
            'numeroIdentificacao': 'numeroIdentificacao',
            'validadeAte': 'validadeAte',
            'ruaAvenida': 'ruaAvenida',
            'quarteirao': 'quarteirao',
            'bairro': 'bairro',
            'celular': 'celular',
            'email': 'email',
            'localServico': 'localServico',
            'grauParentesco': 'grauParentesco',
            'motivacao': 'motivacao',
            'aceiteDeclaracao': 'aceiteDeclaracao'
        };

        if (mapeamento[chave]) {
            chaveFormatada = mapeamento[chave];
        }

        // Tratar valores especiais
        if (chave === 'documentos') {
            if (!json.documentos) {
                json.documentos = [];
            }
            json.documentos.push(valor);
        } else if (chave === 'sexo' || chave === 'aceiteDeclaracao') {
            // Radio buttons e checkboxes
            json[chaveFormatada] = valor;
        } else {
            json[chaveFormatada] = valor || null;
        }
    }

    return json;
}

/**
 * Mostrar mensagem de erro
 */
function mostrarErro(titulo, mensagem) {
    const modal = document.getElementById('successModal');
    if (modal) {
        const modalContent = modal.querySelector('.modal-content');
        const icon = modalContent.querySelector('.modal-icon');
        const h2 = modalContent.querySelector('h2');
        const p = modalContent.querySelector('p');

        icon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
        icon.parentElement.style.background = 'linear-gradient(135deg, #e89c0a 0%, #d47a06 100%)';
        h2.textContent = titulo;
        p.textContent = mensagem;
        h2.style.color = '#e89c0a';

        modal.classList.add('show');
    }
}

/**
 * Mostrar mensagem de sucesso
 */
function mostrarSucesso(titulo, mensagem) {
    const modal = document.getElementById('successModal');
    if (modal) {
        const modalContent = modal.querySelector('.modal-content');
        const icon = modalContent.querySelector('.modal-icon');
        const h2 = modalContent.querySelector('h2');
        const p = modalContent.querySelector('p');

        icon.innerHTML = '<i class="fas fa-check"></i>';
        icon.parentElement.style.background = 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)';
        h2.textContent = titulo;
        p.textContent = mensagem;
        h2.style.color = 'var(--primary)';

        modal.classList.add('show');
    }
}

// ========================================
// INTEGRAÇÃO COM FORM
// ========================================

/**
 * Integrar submit do formulário com backend
 */
function integrarBackend() {
    const form = document.getElementById('cadastroForm');
    
    if (!form) return;

    // Remover evento anterior se existir
    form.onsubmit = null;

    // Adicionar novo evento de submit
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validar antes de enviar
        let isValid = true;
        document.querySelectorAll('[required]').forEach(field => {
            if (!validateField(field)) isValid = false;
        });

        // Validar radio buttons
        const sexo = document.querySelector('input[name="sexo"]:checked');
        if (!sexo) {
            isValid = false;
        }

        // Validar checkbox de declaração
        const aceite = document.getElementById('aceiteDeclaracao');
        if (!aceite || !aceite.checked) {
            isValid = false;
        }

        if (!isValid) {
            const firstError = document.querySelector('.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            mostrarErro('Erro na Validação', 'Por favor, preencha todos os campos obrigatórios corretamente.');
            return;
        }

        // Mostrar carregamento
        const btnSubmit = document.getElementById('btnSubmit');
        const textOriginal = btnSubmit.innerHTML;
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

        try {
            // Converter form para JSON
            const dados = formularioParaJSON(this);

            console.log('Enviando dados:', dados);

            // Fazer requisição
            const resultado = await fazerRequisicao('/cadastro/criar', 'POST', dados);

            // Restaurar botão
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = textOriginal;

            if (resultado.sucesso) {
                // Sucesso
                mostrarSucesso(
                    'Cadastro Enviado!',
                    `Obrigado ${dados.nomeCompleto}! Seu cadastro foi recebido com sucesso. Analisaremos sua inscrição em breve.`
                );

                // Limpar formulário
                this.reset();
                updateProgress();

                // Scrollar para topo
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                // Erro
                const mensagemErro = resultado.dados?.error || 'Erro ao enviar cadastro. Tente novamente.';
                mostrarErro('Erro ao Enviar', mensagemErro);
            }

        } catch (error) {
            // Restaurar botão
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = textOriginal;

            console.error('Erro:', error);
            mostrarErro('Erro de Conexão', 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
        }
    });
}

// ========================================
// INICIALIZAÇÃO
// ========================================

// Integrar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    integrarBackend();
    console.log('✅ Backend integrado. Enviando para:', API_BASE_URL);
});

// ========================================
// EXEMPLO DE USO MANUAL
// ========================================

/*
// Para testar manualmente no console:

const dadosTeste = {
    nomeCompleto: "João Silva",
    nomeMae: "Maria Silva",
    dataNascimento: "1995-05-15",
    sexo: "masculino",
    estadoCivil: "solteiro",
    nacionalidade: "Moçambicana",
    naturalidade: "Maputo",
    numeroIdentificacao: "123456789ABC",
    celular: "258840000000",
    email: "joao@email.com",
    motivacao: "Quero ajudar a comunidade",
    aceiteDeclaracao: true
};

fazerRequisicao('/cadastro/criar', 'POST', dadosTeste)
    .then(resultado => console.log('Resultado:', resultado));
*/
