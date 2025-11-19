
// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentCarrinhoId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('carrinhoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const carrinhosTableBody = document.getElementById('carrinhosTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de carrinhos ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarCarrinhos();
    travarBtnAdicionarItem();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarCarrinho);
btnIncluir.addEventListener('click', incluirCarrinho);
btnAlterar.addEventListener('click', alterarCarrinho);
btnExcluir.addEventListener('click', excluirCarrinho);
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
    document.getElementById('infoPagamento').textContent = '';
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

// Função para buscar carrinho por ID
async function buscarCarrinho() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    bloquearCampos(false);
    searchId.focus();

    try {
        const response = await fetch(`${API_BASE_URL}/carrinho/${id}`);
        //console.log('Response status:', response.status);
        if (response.ok) {
            const carrinho = await response.json();
            preencherFormulario(carrinho);
            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Carrinho encontrado!', 'success');

            // Fazer a requisição dos itens separadamente e carregar na tabela
            await carregarCarrinho(carrinho);

        } else if (response.status === 404) {
            limparFormulario();
            resetarTabelaItensCarrinho(); 
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Carrinho não encontrado. Você pode incluir um novo carrinho.', 'info');
            bloquearCampos(false);
        } else {
            throw new Error('Erro ao buscar carrinho');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar carrinho', 'error');
    }
}

// Função para carregar itens
async function carregarItensDoCarrinho(carrinhoId) {
    try {
        // debugger;
        const responseItens = await fetch(`${API_BASE_URL}/carrinho_livros/${carrinhoId}`);

        if (responseItens.ok) {
            const itensDoCarrinho = await responseItens.json();
            renderizerTabelaItensCarrinho(itensDoCarrinho || []);
        } else if (responseItens.status === 404) {
            // Silencia completamente o 404 - sem console.log
            const itensTableBody = document.getElementById('itensTableBody');
            itensTableBody.innerHTML = '';
        }

        
        travarBtnAdicionarItem();
        // Ignora outros status silenciosamente
    } catch (error) {
        // Ignora erros de rede silenciosamente para itens
    }
}

function formatarDataParaInputDate(data) {
    const dataObj = new Date(data); // Converte a data para um objeto Date
    const ano = dataObj.getFullYear();
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0'); // Meses começam do zero, então +1
    const dia = String(dataObj.getDate()).padStart(2, '0'); // Garante que o dia tenha 2 dígitos
    return `${ano}-${mes}-${dia}`; // Retorna a data no formato yyyy-mm-dd
}

// Função para preencher formulário com dados da carrinho
function preencherFormulario(carrinho) {
    //  console.log(JSON.stringify(carrinho));
    //  console.log('data carrinho: ' + carrinho.data_carrinho);
    //  console.log('data carrinho formatar: ' + formatarDataParaInputDate(carrinho.data_carrinho));

    currentCarrinhoId = carrinho.id_carrinho;
    searchId.value = carrinho.id_carrinho;
    document.getElementById('data_carrinho').value = formatarDataParaInputDate(carrinho.data_carrinho);

    document.getElementById('id_pessoa').value = carrinho.id_pessoa|| 0;

}


// Função para resetar a tabela de itens do carrinho
function resetarTabelaItensCarrinho() {
    const itensTableBody = document.getElementById('itensTableBody');
    itensTableBody.innerHTML = ''; // Limpa todas as linhas da tabela
}


// Função para incluir carrinho
async function incluirCarrinho() {

    mostrarMensagem('Digite os dados!', 'success');
    currentCarrinhoId = searchId.value;
    // console.log('Incluir novo carrinho - currentCarrinhoId: ' + currentCarrinhoId);
    limparFormulario();
    resetarTabelaItensCarrinho(); 
    travarBtnAdicionarItem();
    searchId.value = currentCarrinhoId;
    bloquearCampos(true);

    mostrarBotoes(false, false, false, false, true, true); // mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('data_carrinho').focus();
    operacao = 'incluir';
    // console.log('fim nova carrinho - currentCarrinhoId: ' + currentCarrinhoId);
}

// Função para alterar carrinho
async function alterarCarrinho() {
    mostrarMensagem('Digite os dados!', 'success');
    travarBtnAdicionarItem();
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('data_carrinho').focus();
    operacao = 'alterar';
}

// Função para excluir carrinho
async function excluirCarrinho() {
    mostrarMensagem('Excluindo carrinho...', 'info');
    travarBtnAdicionarItem();
    currentCarrinhoId = searchId.value;
    //bloquear searchId
    searchId.disabled = true;
    bloquearCampos(false); // libera os demais campos
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)           
    operacao = 'excluir';
}

async function salvarOperacao() {
    console.log('Operação:', operacao + ' - currentCarrinhoId: ' + currentCarrinhoId + ' - searchId: ' + searchId.value);

    const formData = new FormData(form);
    const carrinho = {
        id_carrinho: searchId.value,
        data_carrinho: formData.get('data_carrinho'),
        id_pessoa: formData.get('id_pessoa'),
    };
    let response = null;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/carrinho`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(carrinho)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/carrinho/${currentCarrinhoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(carrinho)
            });
        } else if (operacao === 'excluir') {
            // console.log('Excluindo carrinho com ID:', currentCarrinhoId);
            response = await fetch(`${API_BASE_URL}/carrinho/${currentCarrinhoId}`, {
                method: 'DELETE'
            });
            console.log('Carrinho excluído' + response.status);
        }
        if (response.ok && (operacao === 'incluir' || operacao === 'alterar')) {
            const novaCarrinho = await response.json();
            mostrarMensagem('Operação ' + operacao + ' realizada com sucesso!', 'success');
            limparFormulario();
            resetarTabelaItensCarrinho(); 
            travarBtnAdicionarItem();
            carregarCarrinhos();

        } else if (operacao !== 'excluir') {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro ao incluir carrinho', 'error');
        } else {
            mostrarMensagem('Carrinho excluído com sucesso!', 'success');
            resetarTabelaItensCarrinho(); 
            limparFormulario();
            carregarCarrinhos();
            travarBtnAdicionarItem();
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao incluir ou alterar a carrinho', 'error');
    }

    mostrarBotoes(true, false, false, false, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    bloquearCampos(false);//libera pk e bloqueia os demais campos
    document.getElementById('searchId').focus();
}

// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    resetarTabelaItensCarrinho(); 
    travarBtnAdicionarItem();
    mostrarBotoes(true, false, false, false, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    bloquearCampos(false);//libera pk e bloqueia os demais campos
    document.getElementById('searchId').focus();
    mostrarMensagem('Operação cancelada', 'info');
}

function renderizerTabelaItensCarrinho(itens) {
    const itensTableBody = document.getElementById('itensTableBody');
    itensTableBody.innerHTML = '';

    // Check if itens is a single object and wrap it in an array
    if (typeof itens === 'object' && !Array.isArray(itens)) {
        itens = [itens]; // Wrap the object in an array        
    }

    // Iterate over the array and render rows
    itens.forEach((item, index) => {
        const row = document.createElement('tr');
        let subTotal = item.quant_livro * item.preco;
        subTotal = subTotal.toFixed(2).replace('.', ',');

        row.innerHTML = `
            <td>${item.id_carrinho}</td>                  
            <td>${item.id_livro}</td>
            <td>${item.nome_livro}</td>
            <td>
                <input type="number" class="quantidade-input" data-index="${index}" 
                       value="${item.quant_livro}" min="1">
            </td>
            <td class="preco-cell">${item.preco}</td>                               
            <td class="subtotal-cell">${subTotal}</td> 
            <td>
               <button class="btn-secondary btn-small btnAtualizarItem" onclick="btnAtualizarItem(this)">Atualizar</button>
            </td>      
            <td>
                 <button class="btn-secondary btn-small btnExcluirItem" onclick="btnExcluirItem(this)">Excluir</button>
            </td>                
        `;
        itensTableBody.appendChild(row);
    });

    // Adicionar event listeners para atualizar o subtotal
    adicionarEventListenersSubtotal();
}

function adicionarEventListenersSubtotal() {
    const quantidadeInputs = document.querySelectorAll('.quantidade-input');

    // Adicionar event listeners para os inputs de quantidade
    quantidadeInputs.forEach(input => {
        input.addEventListener('input', atualizarSubtotal);
        input.addEventListener('change', atualizarSubtotal);
    });
}

function atualizarSubtotal(event) {
    const index = event.target.getAttribute('data-index');
    const row = event.target.closest('tr');

    const quantidadeInput = row.querySelector('.quantidade-input');
    const precoCell = row.querySelector('.preco-cell');
    const subtotalCell = row.querySelector('.subtotal-cell');

    // Obter valores atuais (usando parseFloat e fallback para 0 se for inválido)
    const quantidade = parseFloat(quantidadeInput.value) || 0;
    const preco = parseFloat(precoCell.textContent.replace(',', '.')) || 0;

    // Calcular novo subtotal
    const novoSubtotal = quantidade * preco;

    // Atualizar a célula do subtotal
    subtotalCell.textContent = novoSubtotal.toFixed(2).replace('.', ',');
}


// Função para carregar lista de carrinhos
async function carregarCarrinhos() {
    try {
        const rota = `${API_BASE_URL}/carrinho`;
        // console.log("a rota " + rota);


        const response = await fetch(rota);
        //   console.log(JSON.stringify(response));


        //    debugger
        if (response.ok) {
            const carrinhos = await response.json();

            // Fetch itens do carrinho for the first carrinho
            if (carrinhos.length > 0) {
                renderizarTabelaCarrinhos(carrinhos);
            } else {
                throw new Error('Erro ao carregar itens do carrinho');
            }
        }

    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de carrinhos', 'error');
    }
}

// Função para renderizar tabela de carrinhos
function renderizarTabelaCarrinhos(carrinhos) {
    carrinhosTableBody.innerHTML = '';

    carrinhos.forEach(carrinho => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>
                        <button class="btn-id" onclick="selecionarCarrinho(${carrinho.id_carrinho})">
                            ${carrinho.id_carrinho}
                        </button>
                    </td>
                    <td>${formatarData(carrinho.data_carrinho)}</td>                  
                    <td>${carrinho.id_pessoa}</td>                      
                                 
                `;
        carrinhosTableBody.appendChild(row);
    });
}

// Função para selecionar carrinho da tabela
async function selecionarCarrinho(id) {
    searchId.value = id;
    await buscarCarrinho();
}


// Função para adicionar uma nova linha vazia para um item na tabela de itens do carrinho.
function adicionarItem() {
    const itensTableBody = document.getElementById('itensTableBody');

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <input type="number" class="carrinho-id-input" value="${searchId.value}" disabled>
        </td>                  
        <td class="livro-group">
            <input type="number" class="livro-id-input">
            <button class="btn-secondary btn-small" onclick="buscarLivroPorId(this)">Buscar</button>
        </td>
        <td>
            <span class="livro-nome-input" id="livro-nome-input" >xx</span>
        </td>
        <td>
            <input type="number" class="quantidade-input" value="1" min="1">
        </td>
        <td>
            <span class="preco-cell" id="preco-cell" >0,00</span>
        </td>                               
        <td class="subtotal-cell">0,00</td>  
        <td>
            <button class="btn-secondary btn-small" onclick="btnAdicionarItem(this)">Adicionar</button>
        </td> 
          <td>
            <button class="btn-secondary btn-small" onclick="btnCancelarItem(this)">Cancelar</button>
        </td> 
               
    `;
    itensTableBody.appendChild(row);

    adicionarEventListenersSubtotal();
}


// Função para buscar o livro por ID no banco de dados. vai preencher o nome e o preço unitário
async function buscarLivroPorId(button) {
    const row = button.closest('tr');
    const livroIdInput = row.querySelector('.livro-id-input');
    const livroId = livroIdInput.value;

    if (!livroId) {
        mostrarMensagem('Por favor, insira um ID de livro.', 'warning');
        return;
    }

    try {
        //const response = await fetch(`${API_BASE_URL}/carrinho/${id}`);
        const response = await fetch(`${API_BASE_URL}/livro/${livroId}`);
        if (!response.ok) {
            throw new Error('Livro não encontrado.');
        }

        const livro = await response.json();

        // Preenche os campos da linha com os dados do livro


        const precoInput = row.querySelector('.preco-cell');
        precoInput.innerHTML = livro.preco;

        const nome_livroInput = row.querySelector('td:nth-child(3) span');
        nome_livroInput.innerHTML = livro.nome_livro;

        // Atualiza o subtotal da linha
        atualizarSubtotal({ target: precoInput });

        mostrarMensagem(`Livro ${livro.nome_livro} encontrado!`, 'success');

    } catch (error) {
        console.error('Erro ao buscar livro:', error);
        mostrarMensagem(error.message, 'error');
    }
}


// Função para coletar os dados de uma nova linha e enviar ao servidor para criação.
function btnAdicionarItem(button) {
    // Encontra a linha (<tr>) pai do botão.
    const row = button.closest('tr');
    if (!row) {
        console.error("Erro: Não foi possível encontrar a linha da tabela (<tr>).");
        return;
    }

    // Coleta os dados dos inputs da linha.
    const carrinhoId = row.querySelector('.carrinho-id-input').value;
    const livroId = row.querySelector('.livro-id-input').value;
    const quantidade = row.querySelector('.quantidade-input').value;

    // Converte os valores para os tipos corretos.
    const itemData = {
        id_carrinho: parseInt(carrinhoId),
        id_livro: parseInt(livroId),
        quant_livro: parseInt(quantidade)
    };

    // Valida os dados antes do envio.
    if (isNaN(itemData.id_carrinho) || isNaN(itemData.id_livro) || isNaN(itemData.quant_livro)) {
        mostrarMensagem('Por favor, preencha todos os campos corretamente.', 'warning');
        return;
    }

    // Envia os dados para a API usando fetch.
    fetch(`${API_BASE_URL}/carrinho_livros`, {
        method: 'POST', // Método para criar um novo recurso.
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao adicionar o item do carrinho. Verifique os IDs e tente novamente.');
            }
            return response.json();
        })
        .then(data => {
            mostrarMensagem('Item adicionado com sucesso!', 'success');
            
            // atualizar a interface para refletir o sucesso, 
              buscarCarrinho();
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarMensagem(error.message, 'error');
        });
        
}

// Função para cancelar a adição de um novo item, removendo a linha da tabela.
function btnCancelarItem(button) {
    // 1. Encontra a linha (<tr>) pai do botão que foi clicado.
    const row = button.closest('tr');

    // 2. Verifica se a linha foi encontrada e a remove.
    if (row) {
        row.remove();
        mostrarMensagem('Adição do item cancelada.', 'info');
    } else {
        console.error("Erro: Não foi possível encontrar a linha da tabela para cancelar.");
    }
}

function btnAtualizarItem(button) {
    // 1. Encontra a linha (<tr>) pai do botão que foi clicado.
    // O 'closest' é um método muito útil para encontrar o ancestral mais próximo com o seletor especificado.
    const row = button.closest('tr');

    // Se a linha não for encontrada, algo está errado, então saímos da função.
    if (!row) {
        console.error("Erro: Não foi possível encontrar a linha da tabela (<tr>).");
        return;
    }

    // 2. Pega todas as células (<td>) da linha.   
    const cells = Array.from(row.cells);

    // 3. Extrai os dados de cada célula da linha.
    // Como sua tabela tem uma estrutura fixa, podemos usar os índices para pegar os dados.
    // Lembre-se que os índices de arrays começam em 0.
    const carrinhoId = cells[0].textContent;
    const livroId = cells[1].textContent;
    const nomeLivro = cells[2].textContent;
    const quantidade = cells[3].querySelector('input').value;
    const precoUnitario = cells[4].textContent;


    // 4. Converte os valores para os tipos de dados corretos, se necessário.
    const itemData = {
        id_carrinho: parseInt(carrinhoId),
        id_livro: parseInt(livroId),
        nome_livro: nomeLivro.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, " "), // Sanitiza e remove quebras de linha  
        quant_livro: parseInt(quantidade),
        preco: parseFloat(precoUnitario.replace(',', '.'))
    };

    //  alert("Dados do item a serem salvos:" + JSON.stringify(itemData));

    // 5. Valida os dados antes de enviar (opcional, mas recomendado).
    if (isNaN(itemData.id_carrinho) || isNaN(itemData.id_livro) || isNaN(itemData.quant_livro)) {
        mostrarMensagem('Por favor, preencha todos os campos corretamente.', 'warning');
        return;
    }

    // remover o nome do livro do envio, pois é desnecessário
    delete itemData.nome_livro;
    delete itemData.preco;

    //alert("Dados do item a serem salvos:" + JSON.stringify(itemData));

    // 6. Envia os dados para o backend usando fetch.
    // Ajuste a URL e o método conforme sua API. router.put('/:id_carrinho/:id_livro', carrinho_livrosController.atualizarCarrinho_livros);
    // Note que estamos enviando tanto o id do carrinho quanto o id do livro na URL.
    fetch(`${API_BASE_URL}/carrinho_livros/${itemData.id_carrinho}/${itemData.id_livro}`, {
        method: 'PUT', // para atualizar
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao salvar o item do carrinho.');
            }
            return response.json();
        })
        .then(data => {
            mostrarMensagem('Item salvo com sucesso!', 'success');
            // Aqui você pode atualizar a UI, limpar campos, etc.
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarMensagem(error.message, 'error');
        });


}

function btnExcluirItem(button) {
    // 1. Encontra a linha (<tr>) pai do botão que foi clicado.
    const row = button.closest('tr');

    if (!row) {
        console.error("Erro: Não foi possível encontrar a linha da tabela (<tr>).");
        return;
    }

    // 2. Extrai os IDs do carrinho e do livro da linha, que compõem a chave primária.
    const carrinhoId = row.cells[0].textContent;
    const livroId = row.cells[1].textContent;

    // 3. Valida os dados antes de enviar.
    if (isNaN(parseInt(carrinhoId)) || isNaN(parseInt(livroId))) {
        mostrarMensagem('IDs do carrinho ou livro inválidos.', 'warning');
        return;
    }

    // 4. Pergunta ao usuário para confirmar a exclusão.
    // Isso evita exclusões acidentais.
    if (!confirm(`Tem certeza que deseja excluir o item do livro ${livroId} do carrinho ${carrinhoId}?`)) {
        return; // Sai da função se o usuário cancelar
    }

    // 5. Envia a requisição DELETE para a API.
    // A rota DELETE espera os IDs na URL para identificar o item.
    fetch(`${API_BASE_URL}/carrinho_livros/${carrinhoId}/${livroId}`, {
        method: 'DELETE', // O método HTTP para exclusão
    })
        .then(response => {
            if (response.ok) { // A requisição foi bem-sucedida (status 204)
                // 6. Se a exclusão no backend foi bem-sucedida, remove a linha da tabela na interface.
                row.remove();
                mostrarMensagem('Item excluído com sucesso!', 'success');
            } else if (response.status === 404) {
                // Se o item não for encontrado, informa o usuário.
                mostrarMensagem('Erro: Item não encontrado no servidor.', 'error');
            } else {
                // Para outros erros, lança uma exceção.
                throw new Error('Erro ao excluir o item do carrinho.');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarMensagem(error.message, 'error');
        });
}

function travarBtnAdicionarItem() {
    const btnAdicionar = document.querySelectorAll('#btnAdicionarItem');
    const inputCarrinhoId = document.getElementById('searchId').value;
    if (inputCarrinhoId){
        btnAdicionar.forEach(btn => btn.disabled = false);
    } 
    else {
        btnAdicionar.forEach(btn => btn.disabled = true);
    }
}


async function carregarCarrinho(carrinho) {

    preencherFormulario(carrinho);

    
    // Carrega os itens
    await carregarItensDoCarrinho(carrinho.id_carrinho);

    // Verifica se existe pagamento para o carrinho
    const pagamento = await buscarPagamentoPorCarrinho(carrinho.id_carrinho);
    if (pagamento) {
        bloquearEdicaoCarrinho();
        exibirPagamentoNoCarrinho(pagamento);
    }
}

async function buscarPagamentoPorCarrinho(idCarrinho) {
    // Supondo que o backend tem um endpoint para buscar pagamento por carrinho
    const resposta = await fetch(`${API_BASE_URL}/pagamento/carrinho/${idCarrinho}`);
    if (resposta.ok) {
        return await resposta.json();
    }
    return null;
}

function bloquearEdicaoCarrinho() {
    // Desabilita inputs e botões de edição/adicionar/remover itens
    document.querySelectorAll('#btnAdicionarItem, .btnExcluirItem, .btnAtualizarItem').forEach(btn => {
        btn.style.display = 'none';
    });
    document.querySelectorAll('.quantidade-input').forEach(input => {
        input.disabled = true;
    });
    // Se quiser, pode exibir um aviso
    mostrarMensagem('Este carrinho já foi pago e não pode ter seus itens editados.', 'warning');
}

function exibirPagamentoNoCarrinho(pagamento) {
    const divPagamento = document.getElementById('infoPagamento');
    divPagamento.innerHTML = `
        <h3>Pagamento realizado</h3>
        <table>
            <tr>
            <td>${formatarData(pagamento.data_pagamento)}</td>
            <td>R$ ${pagamento.valor_pag}</td>
            </tr>
        </table>
        `;
    divPagamento.style.display = 'block';
}

const divPagamento = document.getElementById('infoPagamento');

divPagamento.addEventListener('click', () => {
    // Verifica se a div está visível e preenchida
    if (divPagamento.style.display === 'block' && divPagamento.innerHTML.trim() !== '') {
        // Pega o ID do carrinho que está no input searchId
        const idCarrinho = document.getElementById('searchId').value;

        if (idCarrinho) {
            // Redireciona para a página do CRUD de pagamento, enviando o idCarrinho como query param
            window.location.href = `../pagamento/pagamento.html?idCarrinho=${idCarrinho}`;
        } else {
            mostrarMensagem('ID do carrinho não encontrado para abrir o pagamento.', 'warning');
        }
    }
});