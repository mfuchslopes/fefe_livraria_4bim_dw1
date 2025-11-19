
// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentDepartamentoId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('departamentoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const departamentosTableBody = document.getElementById('departamentosTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de departamentos ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarDepartamentos();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarDepartamento);
btnIncluir.addEventListener('click', incluirDepartamento);
btnAlterar.addEventListener('click', alterarDepartamento);
btnExcluir.addEventListener('click', excluirDepartamento);
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

// Função para buscar departamento por ID
async function buscarDepartamento() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    bloquearCampos(false);
    //focus no campo searchId
    searchId.focus();
    try {
        const response = await fetch(`${API_BASE_URL}/departamento/${id}`);
        console.log(JSON.stringify(response));

        if (response.ok) {
            const departamento = await response.json();
            preencherFormulario(departamento);

            mostrarBotoes(true, false, true, true, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
            mostrarMensagem('Departamento encontrado!', 'success');

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false); //mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
            mostrarMensagem('Departamento não encontrado. Você pode incluir um novo departamento.', 'info');
            bloquearCampos(false);//bloqueia a pk e libera os demais campos
            //enviar o foco para o campo de nome
        } else {
            throw new Error('Erro ao buscar departamento');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar departamento', 'error');
    }
}

// Função para preencher formulário com dados da departamento
function preencherFormulario(departamento) {
    console.log(JSON.stringify(departamento));


    currentDepartamentoId = departamento.id_dep;
    searchId.value = departamento.id_dep;
    document.getElementById('nome_dep').value = departamento.nome_dep || '';

}


// Função para incluir departamento
async function incluirDepartamento() {

    mostrarMensagem('Digite os dados!', 'success');
    currentDepartamentoId = searchId.value;
    // console.log('Incluir nova departamento - currentDepartamentoId: ' + currentDepartamentoId);
    limparFormulario();
    searchId.value = currentDepartamentoId;
    bloquearCampos(true);

    mostrarBotoes(false, false, false, false, true, true); // mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('nome_dep').focus();
    operacao = 'incluir';
    // console.log('fim nova departamento - currentDepartamentoId: ' + currentDepartamentoId);
}

// Função para alterar departamento
async function alterarDepartamento() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('nome_dep').focus();
    operacao = 'alterar';
}

// Função para excluir departamento
async function excluirDepartamento() {
    mostrarMensagem('Excluindo departamento...', 'info');
    currentDepartamentoId = searchId.value;
    //bloquear searchId
    searchId.disabled = true;
    bloquearCampos(false); // libera os demais campos
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)           
    operacao = 'excluir';
}

async function salvarOperacao() {
    console.log('Operação:', operacao + ' - currentDepartamentoId: ' + currentDepartamentoId + ' - searchId: ' + searchId.value);

    const formData = new FormData(form);
    const departamento = {
        id_dep: searchId.value,
        nome_dep: formData.get('nome_dep'),

    };
    let response = null;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/departamento`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(departamento)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/departamento/${currentDepartamentoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(departamento)
            });
        } else if (operacao === 'excluir') {
            // console.log('Excluindo departamento com ID:', currentDepartamentoId);
            response = await fetch(`${API_BASE_URL}/departamento/${currentDepartamentoId}`, {
                method: 'DELETE'
            });
            console.log('Departamento excluído' + response.status);
        }
        if (response.ok && (operacao === 'incluir' || operacao === 'alterar')) {
            const novaDepartamento = await response.json();
            mostrarMensagem('Operação ' + operacao + ' realizada com sucesso!', 'success');
            limparFormulario();
            carregarDepartamentos();

        } else if (operacao !== 'excluir') {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro ao incluir departamento', 'error');
        } else {
            mostrarMensagem('Departamento excluído com sucesso!', 'success');
            limparFormulario();
            carregarDepartamentos();
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao incluir ou alterar a departamento', 'error');
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

// Função para carregar lista de departamentos
async function carregarDepartamentos() {
    try {
        const rota = `${API_BASE_URL}/departamento`;
       // console.log("a rota " + rota);

       
        const response = await fetch(rota);
     //   console.log(JSON.stringify(response));


        //    debugger
        if (response.ok) {
            const departamentos = await response.json();
            renderizarTabelaDepartamentos(departamentos);
        } else {
            throw new Error('Erro ao carregar departamentos');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de departamentos', 'error');
    }
}

// Função para renderizar tabela de departamentos
function renderizarTabelaDepartamentos(departamentos) {
    departamentosTableBody.innerHTML = '';

    departamentos.forEach(departamento => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>
                        <button class="btn-id" onclick="selecionarDepartamento(${departamento.id_dep})">
                            ${departamento.id_dep}
                        </button>
                    </td>
                    <td>${departamento.nome_dep}</td>                  
                                 
                `;
        departamentosTableBody.appendChild(row);
    });
}

// Função para selecionar departamento da tabela
async function selecionarDepartamento(id) {
    searchId.value = id;
    await buscarDepartamento();
}
