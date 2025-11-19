
// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentLivroId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('livroForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const livrosTableBody = document.getElementById('livrosTableBody');
const messageContainer = document.getElementById('messageContainer');
const imagem_livro = document.getElementById('imagem_livro');

// Carregar lista de livros ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarLivros();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarLivro);
btnIncluir.addEventListener('click', incluirLivro);
btnAlterar.addEventListener('click', alterarLivro);
btnExcluir.addEventListener('click', excluirLivro);
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

function formatarDataParaInputDate(data) {
    const dataObj = new Date(data); // Converte a data para um objeto Date
    const ano = dataObj.getFullYear();
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0'); // Meses começam do zero, então +1
    const dia = String(dataObj.getDate()).padStart(2, '0'); // Garante que o dia tenha 2 dígitos
    return `${ano}-${mes}-${dia}`; // Retorna a data no formato yyyy-mm-dd
}

// Função para converter data para formato ISO
function converterDataParaISO(dataString) {
    if (!dataString) return null;
    return new Date(dataString).toISOString();
}



// Função para buscar livro por ID
async function buscarLivro() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    bloquearCampos(false);
    //focus no campo searchId
    searchId.focus();
    try {
        const response = await fetch(`${API_BASE_URL}/livro/${id}`);
        console.log(JSON.stringify(response));

        if (response.ok) {
            const livro = await response.json();
            preencherFormulario(livro);

            mostrarBotoes(true, false, true, true, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
            mostrarMensagem('Livro encontrado!', 'success');

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false); //mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
            mostrarMensagem('Livro não encontrado. Você pode incluir um novo livro.', 'info');
            bloquearCampos(false);//bloqueia a pk e libera os demais campos
            //enviar o foco para o campo de nome
        } else {
            throw new Error('Erro ao buscar livro');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar livro', 'error');
    }
}

// Função para preencher formulário com dados da livro
function preencherFormulario(livro) {
    console.log(JSON.stringify(livro));

    currentLivroId = livro.id_livro;
    searchId.value = livro.id_livro;
    document.getElementById('nome_livro').value = livro.nome_livro || '';
    document.getElementById('descricao_livro').value = livro.nome_livro || '';
    document.getElementById('preco').value = livro.preco || 0;
    document.getElementById('quant_estoque').value = livro.quant_estoque || 0;
    document.getElementById('data_lanc').value = formatarDataParaInputDate(livro.data_lanc) || '';
}

// Função para incluir livro
async function incluirLivro() {

    mostrarMensagem('Digite os dados!', 'success');
    currentLivroId = searchId.value;
    // console.log('Incluir novo livro - currentLivroId: ' + currentLivroId);
    limparFormulario();
    searchId.value = currentLivroId;
    bloquearCampos(true);

    mostrarBotoes(false, false, false, false, true, true); // mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('nome_livro').focus();
    operacao = 'incluir';
    // console.log('fim nova livro - currentLivroId: ' + currentLivroId);
}

// Função para alterar livro
async function alterarLivro() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('nome_livro').focus();
    operacao = 'alterar';
}

// Função para excluir livro
async function excluirLivro() {
    mostrarMensagem('Excluindo livro...', 'info');
    currentLivroId = searchId.value;
    //bloquear searchId
    searchId.disabled = true;
    bloquearCampos(false); // libera os demais campos
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)           
    operacao = 'excluir';
}

async function salvarOperacao() {
    console.log('Operação:', operacao + ' - currentLivroId: ' + currentLivroId + ' - searchId: ' + searchId.value);

    const formData = new FormData(form);
    const livro = {
        id_livro: searchId.value,
        nome_livro: formData.get('nome_livro'),
        descricao_livro: formData.get('descricao_livro'),
        quant_estoque: formData.get('quant_estoque'),
        preco: formData.get('preco'),
        data_lanc: formData.get('data_lanc'),
    };
    let response = null;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/livro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(livro)
            });
            const formImage = new FormData();
            const novo_arquivo = new File([imagem_livro.files[0]], livro.id_livro, { type: imagem_livro.files[0].type });
            formImage.append("imagem", novo_arquivo)
            console.log(formImage)


            await fetch(`${API_BASE_URL}/utils/upload-imagem`, {
                method: 'POST',
                body: formImage 
            })
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/livro/${currentLivroId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(livro)
            });
            const formImage = new FormData();
            const novo_arquivo = new File([imagem_livro.files[0]], livro.id_livro, { type: imagem_livro.files[0].type });
            formImage.append("imagem", novo_arquivo)
            console.log(formImage)


            await fetch(`${API_BASE_URL}/utils/upload-imagem`, {
                method: 'POST',
                body: formImage 
            })
        } else if (operacao === 'excluir') {
            // console.log('Excluindo livro com ID:', currentLivroId);
            response = await fetch(`${API_BASE_URL}/livro/${currentLivroId}`, {
                method: 'DELETE'
            });
            console.log('Livro excluído' + response.status);
        }
        if (response.ok && (operacao === 'incluir' || operacao === 'alterar')) {
            const novaLivro = await response.json();
            mostrarMensagem('Operação ' + operacao + ' realizada com sucesso!', 'success');
            limparFormulario();
            carregarLivros();

        } else if (operacao !== 'excluir') {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro ao incluir livro', 'error');
        } else {
            mostrarMensagem('Livro excluído com sucesso!', 'success');
            limparFormulario();
            carregarLivros();
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao incluir ou alterar a livro', 'error');
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

// Função para carregar lista de livros
async function carregarLivros() {
    try {
        const rota = `${API_BASE_URL}/livro`;
       // console.log("a rota " + rota);

       
        const response = await fetch(rota);
     //   console.log(JSON.stringify(response));


        //    debugger
        if (response.ok) {
            const livros = await response.json();
            renderizarTabelaLivros(livros);
        } else {
            throw new Error('Erro ao carregar livros');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de livros', 'error');
    }
}

// Função para renderizar tabela de livros
function renderizarTabelaLivros(livros) {
    livrosTableBody.innerHTML = '';

    livros.forEach(livro => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>
                        <button class="btn-id" onclick="selecionarLivro(${livro.id_livro})">
                            ${livro.id_livro}
                        </button>
                    </td>
                    <td>${livro.nome_livro}</td>  
                    <td>${livro.descricao_livro}</td>
                    <td><img src="../../img/${livro.imagem_livro}" alt="Capa do livro" width="50"></td>
                    <td>${livro.preco}</td>                
                    <td>${livro.quant_estoque}</td>                  
                    <td>${formatarData(livro.data_lanc)}</td>                  
                                 
                `;
        livrosTableBody.appendChild(row);
    });
}

// Função para selecionar livro da tabela
async function selecionarLivro(id) {
    searchId.value = id;
    await buscarLivro();
}
