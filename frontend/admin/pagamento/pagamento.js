
// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentPagamentoId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('pagamentoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const pagamentosTableBody = document.getElementById('pagamentosTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de pagamentos ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarPagamentos();

    // --- NOVO: Preencher pagamento se vier do CRUD de carrinho ---
    const params = new URLSearchParams(window.location.search);
    const idCarrinho = params.get('idCarrinho');
    if (idCarrinho) {
        searchId.value = idCarrinho; // coloca o id no input
        buscarPagamento(); // busca e preenche o formulário automaticamente
    }
});

// Event Listeners
btnBuscar.addEventListener('click', buscarPagamento);
btnIncluir.addEventListener('click', incluirPagamento);
btnAlterar.addEventListener('click', alterarPagamento);
btnExcluir.addEventListener('click', excluirPagamento);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

mostrarBotoes(true, false, false, false, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
bloquearCampos(false);//libera pk e bloqueia os demais campos

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCampos(bloquearPrimeiro) {
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach((input, index) => {
        if (index === 0) {
            // Primeiro elemento - bloqueia se bloquearPrimeiro for true, libera se for false
            input.disabled = bloquearPrimeiro;
        } else {
            // Demais elementos - faz o oposto do primeiro
            input.disabled = !bloquearPrimeiro;
        }
    });
}

// Função para limpar formulário
function limparFormulario() {
    form.reset();
}


function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

// Função para formatar data para exibição
function formatarData(dataString) {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

// Função para converter data para formato ISO
function converterDataParaISO(dataString) {
    if (!dataString) return null;
    return new Date(dataString).toISOString();
}

function formatarDataParaInputDate(data) {
    const dataObj = new Date(data); // Converte a data para um objeto Date
    const ano = dataObj.getFullYear();
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0'); // Meses começam do zero, então +1
    const dia = String(dataObj.getDate()).padStart(2, '0'); // Garante que o dia tenha 2 dígitos
    return `${ano}-${mes}-${dia}`; // Retorna a data no formato yyyy-mm-dd
}


// Função para buscar pagamento por ID
async function buscarPagamento() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    bloquearCampos(false);
    //focus no campo searchId
    searchId.focus();
    try {
        const response = await fetch(`${API_BASE_URL}/pagamento/${id}`);
        console.log(JSON.stringify(response));

        if (response.ok) {
            const pagamento = await response.json();
            preencherFormulario(pagamento);

            mostrarBotoes(true, false, true, true, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
            mostrarMensagem('Pagamento encontrado!', 'success');

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false); //mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
            mostrarMensagem('Pagamento não encontrado. Você pode incluir um novo pagamento.', 'info');
            bloquearCampos(false);//bloqueia a pk e libera os demais campos
            //enviar o foco para o campo de nome
        } else {
            throw new Error('Erro ao buscar pagamento');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar pagamento', 'error');
    }
}

// Função para preencher formulário com dados da pagamento
function preencherFormulario(pagamento) {
    console.log(JSON.stringify(pagamento));


    currentPagamentoId = pagamento.id_carrinho;
    searchId.value = pagamento.id_carrinho;
    document.getElementById('data_pagamento').value = formatarDataParaInputDate(pagamento.data_pagamento) || '';

}


// Função para incluir pagamento
async function incluirPagamento() {

    mostrarMensagem('Digite os dados!', 'success');
    currentPagamentoId = searchId.value;
    // console.log('Incluir nova pagamento - currentPagamentoId: ' + currentPagamentoId);
    limparFormulario();
    searchId.value = currentPagamentoId;
    bloquearCampos(true);
    searchId.disabled = true; // bloqueia o campo pk

    mostrarBotoes(false, false, false, false, true, true); // mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('data_pagamento').focus();
    operacao = 'incluir';
    // console.log('fim nova pagamento - currentPagamentoId: ' + currentPagamentoId);
}

// Função para alterar pagamento
async function alterarPagamento() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    searchId.disabled = true; // bloquear pk
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('data_pagamento').focus();
    operacao = 'alterar';
}

// Função para excluir pagamento
async function excluirPagamento() {
    mostrarMensagem('Excluindo pagamento...', 'info');
    currentPagamentoId = searchId.value;
    //bloquear searchId
    searchId.disabled = true;
    bloquearCampos(false); // libera os demais campos
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)           
    operacao = 'excluir';
}

async function salvarOperacao() {
    console.log('Operação:', operacao + ' - currentPagamentoId: ' + currentPagamentoId + ' - searchId: ' + searchId.value);

    const idCarrinho = searchId.value;

    // Verifica se o carrinho está vazio
    const vazio = await verificarCarrinhoVazio(idCarrinho);
    if (vazio) return; // bloqueia a operação

    const formData = new FormData(form);
    const pagamento = {
        id_carrinho: searchId.value,
        data_pagamento: formData.get('data_pagamento')

    };
    let response = null;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/pagamento`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pagamento)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/pagamento/${currentPagamentoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pagamento)
            });
        } else if (operacao === 'excluir') {
            // console.log('Excluindo pagamento com ID:', currentPagamentoId);
            response = await fetch(`${API_BASE_URL}/pagamento/${currentPagamentoId}`, {
                method: 'DELETE'
            });
            console.log('Pagamento excluído' + response.status);
        }
        if (response.ok && (operacao === 'incluir' || operacao === 'alterar')) {
            const novaPagamento = await response.json();
            mostrarMensagem('Operação ' + operacao + ' realizada com sucesso!', 'success');
            limparFormulario();
            carregarPagamentos();

        } else if (operacao !== 'excluir') {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro ao incluir pagamento', 'error');
        } else {
            mostrarMensagem('Pagamento excluído com sucesso!', 'success');
            limparFormulario();
            carregarPagamentos();
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao incluir ou alterar a pagamento', 'error');
    }

    mostrarBotoes(true, false, false, false, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    bloquearCampos(false);//libera pk e bloqueia os demais campos
    document.getElementById('searchId').focus();
}

// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    bloquearCampos(false);//libera pk e bloqueia os demais campos
    document.getElementById('searchId').focus();
    mostrarMensagem('Operação cancelada', 'info');
}

// Função para carregar lista de pagamentos
async function carregarPagamentos() {
    try {
        const rota = `${API_BASE_URL}/pagamento`;
       // console.log("a rota " + rota);

       
        const response = await fetch(rota);
     //   console.log(JSON.stringify(response));


        //    debugger
        if (response.ok) {
            const pagamentos = await response.json();
            renderizarTabelaPagamentos(pagamentos);
        } else {
            throw new Error('Erro ao carregar pagamentos');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de pagamentos', 'error');
    }
}

// Função para renderizar tabela de pagamentos
function renderizarTabelaPagamentos(pagamentos) {
    pagamentosTableBody.innerHTML = '';

    pagamentos.forEach(pagamento => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>
                        <button class="btn-id" onclick="selecionarPagamento(${pagamento.id_carrinho})">
                            ${pagamento.id_carrinho}
                        </button>
                    </td>
                    <td>${formatarData(pagamento.data_pagamento)}</td> 
                    <td>${pagamento.valor_pag}</td>                 
                                 
                `;
        pagamentosTableBody.appendChild(row);
    });
}

// Função para selecionar pagamento da tabela
async function selecionarPagamento(id) {
    searchId.value = id;
    await buscarPagamento();
}

// Função para verificar se o carrinho está vazio
async function verificarCarrinhoVazio(idCarrinho) {
    try {
        const response = await fetch(`${API_BASE_URL}/carrinho_livros/${idCarrinho}`);
        
        if (response.status === 404) {
            // Nenhum item encontrado para este carrinho
            mostrarMensagem('Não é possível salvar o pagamento de um carrinho vazio!', 'warning');
            return true; // carrinho vazio
        }

        if (!response.ok) {
            throw new Error('Erro ao buscar itens do carrinho');
        }

        const itens = await response.json();

        if (!itens || itens.length === 0) {
            mostrarMensagem('Não é possível salvar o pagamento de um carrinho vazio!', 'warning');
            return true; // carrinho vazio
        }

        return false; // carrinho possui itens
    } catch (error) {
        console.error('Erro ao verificar carrinho:', error);
        mostrarMensagem('Erro ao verificar carrinho', 'error');
        return true; // por segurança, considera vazio em caso de erro
    }
}

