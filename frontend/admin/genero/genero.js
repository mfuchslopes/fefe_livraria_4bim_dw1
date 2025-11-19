
// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentGeneroId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('generoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const generosTableBody = document.getElementById('generosTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de gêneros ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarGeneros();
    travarBtnAdicionarLivro();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarGenero);
btnIncluir.addEventListener('click', incluirGenero);
btnAlterar.addEventListener('click', alterarGenero);
btnExcluir.addEventListener('click', excluirGenero);
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
    previewImagem.src = '';
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

function slugify(nome) {
    return nome
    .toLowerCase()
    .trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/\s+/g, "-") // troca espaços por hífen
    .replace(/[^a-z0-9-]/g, ""); // remove caracteres especiais
}

// Função para buscar genero por ID
async function buscarGenero() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    bloquearCampos(false);
    //focus no campo searchId
    searchId.focus();
    try {
        const response = await fetch(`${API_BASE_URL}/genero/${id}`);
        console.log("searchId:", searchId, "value:", searchId?.value);

        if (response.ok) {
            const genero = await response.json();
            preencherFormulario(genero);

            mostrarBotoes(true, false, true, true, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
            mostrarMensagem('Gênero encontrado!', 'success');

            // Fazer a requisição dos itens separadamente e carregar na tabela
            await carregarLivrosDoGenero(genero.id_genero);

        } else if (response.status === 404) {
            limparFormulario();
            resetarTabelaLivro_genero(); 
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false); //mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
            mostrarMensagem('Gênero não encontrado. Você pode incluir um novo gênero.', 'info');
            bloquearCampos(false);//bloqueia a pk e libera os demais campos
            //enviar o foco para o campo de nome
        } else {
            throw new Error('Erro ao buscar gênero');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar gênero', 'error');
    }
}

// Função para carregar livros
async function carregarLivrosDoGenero(generoId) {
    try { 

        // debugger;
        const responseLivros = await fetch(`${API_BASE_URL}/livro_genero/${generoId}`);

        if (responseLivros.ok) {
            const livrosDoGenero = await responseLivros.json();
            renderizerTabelaLivro_genero(livrosDoGenero || []);
        } else if (responseLivros.status === 404) {
            // Silencia completamente o 404 - sem console.log
            const livrosTableBody = document.getElementById('livrosTableBody');
            livrosTableBody.innerHTML = '';
        }

        travarBtnAdicionarLivro();
        // Ignora outros status silenciosamente
    } catch (error) {
        // Ignora erros de rede silenciosamente para livros
    }
}


// --- Alterado para mostrar imagem ao preencher formulário ---
function preencherFormulario(genero) {

    console.log(JSON.stringify(genero));

    currentGeneroId = genero.id_genero;
    searchId.value = genero.id_genero;
    document.getElementById('nome_genero').value = genero.nome_genero || '';
    document.getElementById('descricao_genero').value = genero.descricao_genero || '';

    // Mostra imagem já salva
    if (genero.imagem_genero) {
        previewImagem.src = `../img/${genero.imagem_genero}`;
        previewImagem.style.display = "block";
    } else {
        previewImagem.src = '';
        previewImagem.style.display = "none";
    }
}

//salvarOperacao

// Função para resetar a tabela de livros do genero
function resetarTabelaLivro_genero() {
    const livrosTableBody = document.getElementById('livrosTableBody');
    livrosTableBody.innerHTML = ''; // Limpa todas as linhas da tabela
}


// Função para incluir genero
async function incluirGenero() {

    mostrarMensagem('Digite os dados!', 'success');
    currentGeneroId = searchId.value;
    // console.log('Incluir novo genero - currentGeneroId: ' + currentGeneroId);
    limparFormulario();
    resetarTabelaLivro_genero(); 
    travarBtnAdicionarLivro();
    searchId.value = currentGeneroId;
    bloquearCampos(true);

    mostrarBotoes(false, false, false, false, true, true); // mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('nome_genero').focus();
    operacao = 'incluir';
    // console.log('fim nova genero - currentGeneroId: ' + currentGeneroId);
}

// Função para alterar genero
async function alterarGenero() {
    mostrarMensagem('Digite os dados!', 'success');
    travarBtnAdicionarLivro();
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('nome_genero').focus();
    operacao = 'alterar';
}

// Função para excluir genero
async function excluirGenero() {
    mostrarMensagem('Excluindo genero...', 'info');
    travarBtnAdicionarLivro();
    currentGeneroId = searchId.value;
    //bloquear searchId
    searchId.disabled = true;
    bloquearCampos(false); // libera os demais campos
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)           
    operacao = 'excluir';
}

async function salvarOperacao() {
    console.log('Operação:', operacao, ', ID:', currentGeneroId);

    const formData = new FormData(form);
    const genero = {
        id_genero: searchId.value,
        nome_genero: formData.get('nome_genero'),
        descricao_genero: formData.get('descricao_genero'),

    };
    let response = null;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/genero`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(genero)
            });
            const formImage = new FormData();
            const slug = slugify(genero.nome_genero);

        
            const novo_arquivo = new File([imagem_genero.files[0]], slug, { type: imagem_genero.files[0].type });
            formImage.append("imagem", novo_arquivo)
            console.log(formImage)


            await fetch(`${API_BASE_URL}/utils/upload-imagem`, {
                method: 'POST',
                body: formImage 
            })


            
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/genero/${currentGeneroId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(genero)
            });
            const formImage = new FormData();
            const slug = slugify(genero.nome_genero);
            
            // Só envia o arquivo se o usuário tiver selecionado uma nova imagem
            if (inputImagem.files[0]) {
                const novo_arquivo = new File([inputImagem.files[0]], slug, { type: inputImagem.files[0].type });
                formImage.append("imagem", novo_arquivo);

                // Envia a imagem para o backend
                await fetch(`${API_BASE_URL}/utils/upload-imagem`, {
                    method: 'POST',
                    body: formImage
                });
            } else {
                console.log("Nenhuma nova imagem selecionada. Mantendo a imagem antiga.");
            }
        } else if (operacao === 'excluir') {
            // console.log('Excluindo genero com ID:', currentGeneroId);
            response = await fetch(`${API_BASE_URL}/genero/${currentGeneroId}`, {
                method: 'DELETE'
            });
            console.log('Genero excluído' + response.status);
        }
        if (response.ok && (operacao === 'incluir' || operacao === 'alterar')) {
            const novoGenero = await response.json();
            mostrarMensagem('Operação ' + operacao + ' realizada com sucesso!', 'success');
            limparFormulario();
            resetarTabelaLivro_genero(); 
            travarBtnAdicionarLivro();
            carregarGeneros();

        } else if (operacao !== 'excluir') {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro ao incluir gênero', 'error');
        } else {
            mostrarMensagem('Gênero excluído com sucesso!', 'success');
            resetarTabelaLivro_genero(); 
            limparFormulario();
            carregarGeneros();
            travarBtnAdicionarLivro();
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao incluir ou alterar o gênero', 'error');
    }

    mostrarBotoes(true, false, false, false, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    bloquearCampos(false);//libera pk e bloqueia os demais campos
    document.getElementById('searchId').focus();
}

// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    resetarTabelaLivro_genero(); 
    travarBtnAdicionarLivro(); 
    mostrarBotoes(true, false, false, false, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    bloquearCampos(false);//libera pk e bloqueia os demais campos
    document.getElementById('searchId').focus();
    mostrarMensagem('Operação cancelada', 'info');
}

// Função para carregar lista de generos
async function carregarGeneros() {
    try {
        const rota = `${API_BASE_URL}/genero`;
       // console.log("a rota " + rota);

       
        const response = await fetch(rota);
     //   console.log(JSON.stringify(response));


        //    debugger
        if (response.ok) {
            const generos = await response.json();
            renderizarTabelaGeneros(generos);
        } else {
            throw new Error('Erro ao carregar gêneros');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de gêneros', 'error');
    }
}

// --- Alterado para renderizar imagem na tabela ---
function renderizarTabelaGeneros(generos) {
    generosTableBody.innerHTML = '';

    generos.forEach(genero => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <button class="btn-id" onclick="selecionarGenero(${genero.id_genero})">
                    ${genero.id_genero}
                </button>
            </td>
            <td>${genero.nome_genero}</td>
            <td>${genero.descricao_genero}</td>
            <td>
                ${genero.imagem_genero ? `<img src="../../img/${genero.imagem_genero}" alt="${nome_genero}" style="max-width:60px;max-height:60px;">` : ''}
            </td>
            <td>${genero.slug_genero}</td>
        `;
        generosTableBody.appendChild(row);
    });
}

// Função para selecionar genero da tabela
async function selecionarGenero(id) {
    searchId.value = id;
    await buscarGenero();
}

// --- Preview da imagem escolhida ---
const inputImagem = document.getElementById('imagem_genero');
const previewImagem = document.getElementById('preview_imagem');

inputImagem.addEventListener('change', () => {
    const file = inputImagem.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            previewImagem.src = e.target.result;
            previewImagem.style.display = "block";
        };
        reader.readAsDataURL(file);
    } else {
        previewImagem.style.display = "none";
    }
});



function renderizerTabelaLivro_genero(livros) {
    const livrosTableBody = document.getElementById('livrosTableBody');
    livrosTableBody.innerHTML = '';

    // Check if livros is a single object and wrap it in an array
    if (typeof livros === 'object' && !Array.isArray(livros)) {
        livros = [livros]; // Wrap the object in an array        
    }

    // Iterate over the array and render rows
    livros.forEach((livro, index) => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${livro.id_genero}</td>                  
            <td>${livro.id_livro}</td>
            <td>${livro.nome_livro}</td>
            <td> </td>      
            <td>
                 <button class="btn-secondary btn-small" onclick="btnExcluirLivro(this)">Excluir</button>
            </td>                
        `;
        livrosTableBody.appendChild(row);
    });

  
}

// Função para adicionar uma nova linha vazia para um livro na tabela de livros do genero.
function adicionarLivro() {
    const livrosTableBody = document.getElementById('livrosTableBody');

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <input type="number" class="genero-id-input" value="${searchId.value}" disabled>
        </td>                  
        <td class="livro-group">
            <input type="number" class="livro-id-input">
            <button class="btn-secondary btn-small" onclick="buscarLivroPorId(this)">Buscar</button>
        </td>
        <td>
            <span class="livro-nome-input" id="livro-nome-input" >xx</span>
        </td>
        <td>
            <button class="btn-secondary btn-small" onclick="btnAdicionarLivro(this)">Adicionar</button>
        </td> 
          <td>
            <button class="btn-secondary btn-small" onclick="btnCancelarLivro(this)">Cancelar</button>
        </td> 
               
    `;
    livrosTableBody.appendChild(row);

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
        //const response = await fetch(`${API_BASE_URL}/genero/${id}`);
        const response = await fetch(`${API_BASE_URL}/livro/${livroId}`);
        if (!response.ok) {
            throw new Error('Livro não encontrado.');
        }

        const livro = await response.json();

        // Preenche os campos da linha com os dados do livro


        const nome_livroInput = row.querySelector('td:nth-child(3) span');
        nome_livroInput.innerHTML = livro.nome_livro;


        mostrarMensagem(`Livro ${livro.nome_livro} encontrado!`, 'success');

    } catch (error) {
        console.error('Erro ao buscar livro:', error);
        mostrarMensagem(error.message, 'error');
    }
}


// Função para coletar os dados de uma nova linha e enviar ao servidor para criação.
function btnAdicionarLivro(button) {
    // Encontra a linha (<tr>) pai do botão.
    const row = button.closest('tr');
    if (!row) {
        console.error("Erro: Não foi possível encontrar a linha da tabela (<tr>).");
        return;
    }

    // Coleta os dados dos inputs da linha.
    const generoId = row.querySelector('.genero-id-input').value;
    const livroId = row.querySelector('.livro-id-input').value;

    // Converte os valores para os tipos corretos.
    const livroData = {
        id_genero: parseInt(generoId),
        id_livro: parseInt(livroId)
    };

    // Valida os dados antes do envio.
    if (isNaN(livroData.id_genero) || isNaN(livroData.id_livro)) {
        mostrarMensagem('Por favor, preencha todos os campos corretamente.', 'warning');
        return;
    }

    // Envia os dados para a API usando fetch.
    fetch(`${API_BASE_URL}/livro_genero`, {
        method: 'POST', // Método para criar um novo recurso.
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(livroData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao adicionar o livro do genero. Verifique os IDs e tente novamente.');
            }
            return response.json();
        })
        .then(data => {
            mostrarMensagem('Livro adicionado com sucesso!', 'success');
            
            // atualizar a interface para refletir o sucesso, 
              buscarGenero();
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarMensagem(error.message, 'error');
        });

        
}

// Função para cancelar a adição de um novo livro, removendo a linha da tabela.
function btnCancelarLivro(button) {
    // 1. Encontra a linha (<tr>) pai do botão que foi clicado.
    const row = button.closest('tr');

    // 2. Verifica se a linha foi encontrada e a remove.
    if (row) {
        row.remove();
        mostrarMensagem('Adição do livro cancelada.', 'info');
    } else {
        console.error("Erro: Não foi possível encontrar a linha da tabela para cancelar.");
    }
}

// function btnAtualizarLivro(button) {
//     // 1. Encontra a linha (<tr>) pai do botão que foi clicado.
//     // O 'closest' é um método muito útil para encontrar o ancestral mais próximo com o seletor especificado.
//     const row = button.closest('tr');

//     // Se a linha não for encontrada, algo está errado, então saímos da função.
//     if (!row) {
//         console.error("Erro: Não foi possível encontrar a linha da tabela (<tr>).");
//         return;
//     }

//     // 2. Pega todas as células (<td>) da linha.   
//     const cells = Array.from(row.cells);

//     // 3. Extrai os dados de cada célula da linha.
//     // Como sua tabela tem uma estrutura fixa, podemos usar os índices para pegar os dados.
//     // Lembre-se que os índices de arrays começam em 0.
//     const generoId = cells[0].textContent;
//     const livroId = cells[1].textContent;
//     const nomeLivro = cells[2].textContent;


//     // 4. Converte os valores para os tipos de dados corretos, se necessário.
//     const livroData = {
//         id_genero: parseInt(generoId),
//         id_livro: parseInt(livroId),
//         nome_livro: nomeLivro.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, " "), // Sanitiza e remove quebras de linha  
//     };

//     //  alert("Dados do livro a serem salvos:" + JSON.stringify(livroData));

//     // 5. Valida os dados antes de enviar (opcional, mas recomendado).
//     if (isNaN(livroData.id_genero) || isNaN(livroData.id_livro) ) {
//         mostrarMensagem('Por favor, preencha todos os campos corretamente.', 'warning');
//         return;
//     }

//     // remover o nome do livro do envio, pois é desnecessário
//     delete livroData.nome_livro;

//     //alert("Dados do livro a serem salvos:" + JSON.stringify(livroData));

//     // 6. Envia os dados para o backend usando fetch.
//     // Ajuste a URL e o método conforme sua API. router.put('/:id_genero/:id_livro', livro_generoController.atualizarLivro_genero);
//     // Note que estamos enviando tanto o id do genero quanto o id do livro na URL.
//     fetch(`${API_BASE_URL}/livro_genero/${livroData.id_genero}/${livroData.id_livro}`, {
//         method: 'PUT', // para atualizar
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(livroData)
//     })
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Erro ao salvar o livro do genero.');
//             }
//             return response.json();
//         })
//         .then(data => {
//             mostrarMensagem('Livro salvo com sucesso!', 'success');
//             // Aqui você pode atualizar a UI, limpar campos, etc.
//         })
//         .catch(error => {
//             console.error('Erro:', error);
//             mostrarMensagem(error.message, 'error');
//         });


// }

function btnExcluirLivro(button) {
    // 1. Encontra a linha (<tr>) pai do botão que foi clicado.
    const row = button.closest('tr');

    if (!row) {
        console.error("Erro: Não foi possível encontrar a linha da tabela (<tr>).");
        return;
    }

    // 2. Extrai os IDs do genero e do livro da linha, que compõem a chave primária.
    const generoId = row.cells[0].textContent;
    const livroId = row.cells[1].textContent;

    // 3. Valida os dados antes de enviar.
    if (isNaN(parseInt(generoId)) || isNaN(parseInt(livroId))) {
        mostrarMensagem('IDs do gênero ou livro inválidos.', 'warning');
        return;
    }

    // 4. Pergunta ao usuário para confirmar a exclusão.
    // Isso evita exclusões acidentais.
    if (!confirm(`Tem certeza que deseja excluir o livro ${livroId} do gênero ${generoId}?`)) {
        return; // Sai da função se o usuário cancelar
    }

    // 5. Envia a requisição DELETE para a API.
    // A rota DELETE espera os IDs na URL para identificar o livro.
    fetch(`${API_BASE_URL}/livro_genero/${generoId}/${livroId}`, {
        method: 'DELETE', // O método HTTP para exclusão
    })
        .then(response => {
            if (response.ok) { // A requisição foi bem-sucedida (status 204)
                // 6. Se a exclusão no backend foi bem-sucedida, remove a linha da tabela na interface.
                row.remove();
                mostrarMensagem('Livro excluído com sucesso!', 'success');
            } else if (response.status === 404) {
                // Se o livro não for encontrado, informa o usuário.
                mostrarMensagem('Erro: Livro não encontrado no servidor.', 'error');
            } else {
                // Para outros erros, lança uma exceção.
                throw new Error('Erro ao excluir o livro do genero.');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarMensagem(error.message, 'error');
        });
}


function travarBtnAdicionarLivro() {
    const btnAdicionar = document.querySelectorAll('.btnAdicionarLivro');
    const inputGeneroId = document.getElementById('searchId').value;
    if (inputGeneroId){
        btnAdicionar.forEach(btn => btn.disabled = false);
    } 
    else {
        btnAdicionar.forEach(btn => btn.disabled = true);
    }
}