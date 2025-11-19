
// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentPersonId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('pessoaForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const pessoasTableBody = document.getElementById('pessoasTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de pessoas ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarPessoas();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarPessoa);
btnIncluir.addEventListener('click', incluirPessoa);
btnAlterar.addEventListener('click', alterarPessoa);
btnExcluir.addEventListener('click', excluirPessoa);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

document.getElementById('checkboxFuncionario').addEventListener('change', () => {
    if (document.getElementById('checkboxFuncionario').checked) {
        document.getElementById('checkboxCliente').checked = false; // desmarca cliente
    }
    atualizarCamposFuncionario();
});

document.getElementById('checkboxCliente').addEventListener('change', () => {
    if (document.getElementById('checkboxCliente').checked) {
        document.getElementById('checkboxFuncionario').checked = false; // desmarca funcionário
    }
    atualizarCamposFuncionario();
});


mostrarBotoes(true, false, false, false, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
bloquearCampos(false);//libera pk e bloqueia os demais campos

function atualizarCamposFuncionario() {
    if (document.getElementById('checkboxFuncionario').checked) {
        document.getElementById('supervisorFuncionario').disabled = false;
        document.getElementById('departamentoFuncionario').disabled = false;
    } else {
        document.getElementById('supervisorFuncionario').disabled = true;
        document.getElementById('departamentoFuncionario').disabled = true;
        document.getElementById('supervisorFuncionario').value = '';
        document.getElementById('departamentoFuncionario').value = '';
    }
}

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCampos(bloquearPrimeiro) {
    const inputs = document.querySelectorAll('input,checkbox'); // Seleciona todos os inputs e selects do DOCUMENTO
    inputs.forEach((input, index) => {
        // console.log(`Input ${index}: ${input.name}, disabled: ${input.disabled}`);
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
    document.getElementById('checkboxFuncionario').checked = false;
    document.getElementById('supervisorFuncionario').value = '';
    document.getElementById('departamentoFuncionario').value = '';

}


function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

async function funcaoEhFuncionario(pessoaId) {
    try {
        const response = await fetch(`${API_BASE_URL}/funcionario/${pessoaId}`);

        if (response.status === 404) {
            return { ehFuncionario: false };
        }

        if (response.status === 200) {
            const funcionarioData = await response.json();
            return {
                ehFuncionario: true, // CORREÇÃO: era "id_pessoa: true"
                id_dep: funcionarioData.id_dep, // CORREÇÃO: usar o nome correto do campo
                id_supervisor: funcionarioData.id_supervisor // CORREÇÃO: usar o nome correto do campo
            };
        }

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro na requisição:', errorData.error);
            return { ehFuncionario: false };
        }

    } catch (error) {
        console.error('Erro ao verificar se é funcionario:', error);
        return { ehFuncionario: false };
    }
}



// Função para buscar pessoa por ID
async function buscarPessoa() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }

    bloquearCampos(false);
    searchId.focus();
    try {
        const response = await fetch(`${API_BASE_URL}/pessoa/${id}`);

        if (response.ok) {
            const pessoa = await response.json();
            preencherFormulario(pessoa);

            mostrarBotoes(true, false, true, true, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
            mostrarMensagem('Pessoa encontrada!', 'success');

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false); //mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
            mostrarMensagem('Pessoa não encontrada. Você pode incluir uma nova pessoa.', 'info');
            bloquearCampos(false);//bloqueia a pk e libera os demais campos
            //enviar o foco para o campo de nome
        } else {
            throw new Error('Erro ao buscar pessoa');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar pessoa', 'error');
    }

    // Verifica se a pessoa é funcionario
    const oFuncionario = await funcaoEhFuncionario(id);

    if (oFuncionario.ehFuncionario) {
        // alert('É funcionario: ' + oFuncionario.ehFuncionario + ' - ' + oFuncionario.mnemonico + ' - ' + oFuncionario.funcionario);
        document.getElementById('checkboxFuncionario').checked = true;
        document.getElementById('supervisorFuncionario').value = oFuncionario.id_supervisor;
        document.getElementById('departamentoFuncionario').value = oFuncionario.id_dep;
    } else {
        // Não é funcionario
        document.getElementById('checkboxFuncionario').checked = false;
        document.getElementById('supervisorFuncionario').value = '';
        document.getElementById('departamentoFuncionario').value = '';
    }

    //Verifica se a pessoa é cliente
    try {
        const responseCliente = await fetch(`${API_BASE_URL}/cliente/${id}`);
        if (responseCliente.status === 200) {
            document.getElementById('checkboxCliente').checked = true;
        } else {
            document.getElementById('checkboxCliente').checked = false;
        }
    } catch (error) {
        console.error('Erro ao verificar se é cliente:', error);
        document.getElementById('checkboxCliente').checked = false;
    }

}

// Função para preencher formulário com dados da pessoa
function preencherFormulario(pessoa) {
    currentPersonId = pessoa.id_pessoa;
    searchId.value = pessoa.id_pessoa;
    document.getElementById('cpf').value = pessoa.cpf || '';
    document.getElementById('cep').value = pessoa.cep || '';
    document.getElementById('endereco').value = pessoa.endereco || '';
    document.getElementById('nome').value = pessoa.nome || '';
    document.getElementById('email').value = pessoa.email || '';
    document.getElementById('senha').value = pessoa.senha || '';

}


// Função para incluir pessoa
async function incluirPessoa() {

    mostrarMensagem('Digite os dados!', 'success');
    currentPersonId = searchId.value;
    // console.log('Incluir nova pessoa - currentPersonId: ' + currentPersonId);
    limparFormulario();
    searchId.value = currentPersonId;
    bloquearCampos(true);

    mostrarBotoes(false, false, false, false, true, true); // mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('nome').focus();
    operacao = 'incluir';
    // console.log('fim nova pessoa - currentPersonId: ' + currentPersonId);
}

// Função para alterar pessoa
async function alterarPessoa() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('nome').focus();
    operacao = 'alterar';
}

// Função para excluir pessoa
async function excluirPessoa() {
    mostrarMensagem('Excluindo pessoa...', 'info');
    currentPersonId = searchId.value;
    //bloquear searchId
    searchId.disabled = true;
    bloquearCampos(false); // libera os demais campos
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)           
    operacao = 'excluir';
}

async function salvarOperacao() {
    //console.log('Operação:', operacao + ' - currentPersonId: ' + currentPersonId + ' - searchId: ' + searchId.value);

    const formData = new FormData(form);
    const pessoa = {
        id_pessoa: searchId.value,
        nome: formData.get('nome'),
        email: formData.get('email'),
        senha: formData.get('senha'),
        cpf: formData.get('cpf'),
        cep: formData.get('cep'),
        endereco: formData.get('endereco'),

    };

    let funcionario = null;
    if (document.getElementById('checkboxFuncionario').checked) {
        funcionario = {
            id_pessoa: pessoa.id_pessoa,
            id_dep: document.getElementById('departamentoFuncionario').value,
            id_supervisor: document.getElementById('supervisorFuncionario').value || null
        }
    }

    // é cliente
    let ehCliente = document.getElementById('checkboxCliente').checked; //true ou false
    let ehFuncionario = document.getElementById('checkboxFuncionario').checked; //true ou false

    if (!ehFuncionario && !ehCliente) {
        mostrarMensagem('A pessoa deve ser funcionário ou cliente', 'warning');
        return;
    }

    if (ehFuncionario && ehCliente) {
        mostrarMensagem('A pessoa não pode ser funcionário e cliente ao mesmo tempo', 'warning');
        return;
    }



    let responseFuncionario = null;
    let responsePessoa = null;
    try {
        if (operacao === 'incluir') {
            // 1. Cadastrar pessoa
            responsePessoa = await fetch(`${API_BASE_URL}/pessoa`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pessoa)
            });

            if (!responsePessoa.ok) {
                const error = await responsePessoa.json();
                mostrarMensagem(error.error || 'Erro ao incluir pessoa', 'error');
                return;
            }

            // 2. Só depois, cadastrar funcionário (se marcado)
            if (ehFuncionario) {
                responseFuncionario = await fetch(`${API_BASE_URL}/funcionario`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(funcionario)
                });

                if (!responseFuncionario.ok) {
                    const error = await responseFuncionario.json();
                    mostrarMensagem(error.error || 'Erro ao incluir funcionário', 'error');
                    return;
                }
            }

            // 3. Cadastrar cliente (se marcado)
            if (ehCliente) {
                const cliente = { id_pessoa: pessoa.id_pessoa };
                const responseCliente = await fetch(`${API_BASE_URL}/cliente`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(cliente)
                });
                if (!responseCliente.ok) {
                    const error = await responseCliente.json();
                    mostrarMensagem(error.error || 'Erro ao incluir cliente', 'error');
                    return;
                }
            }
        }

            else if (operacao === 'alterar') {
            responseFuncionario = await fetch(`${API_BASE_URL}/pessoa/${currentPersonId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pessoa)
            });
            responsePessoa = responseFuncionario;

            if (ehCliente) {
                //se DEIXOU de ser cliente, excluir da tabela cliente
                const caminhoRota = `${API_BASE_URL}/cliente/${currentPersonId}`;

                let respObterCliente = await fetch(caminhoRota);
                //    console.log('Resposta ao obter cliente ao alterar pessoa: ' + respObterCliente.status);
                let cliente = null;
                if (respObterCliente.status === 404) {
                    //incluir cliente
                    cliente = {
                        id_pessoa: pessoa.id_pessoa
                    }
                };
                
                respObterCliente = await fetch(`${API_BASE_URL}/cliente`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(cliente)
                });
            } else {
                //se DEIXOU de ser cliente, excluir da tabela cliente
                const caminhoRota = `${API_BASE_URL}/cliente/${currentPersonId}`;
                let respObterCliente = await fetch(caminhoRota);
                // console.log('Resposta ao obter cliente para exclusão: ' + respObterCliente.status);
                if (respObterCliente.status === 200) {
                    //existe, pode excluir
                    respObterCliente = await fetch(caminhoRota, {
                        method: 'DELETE'
                    });
                }
            }


            if (document.getElementById('checkboxFuncionario').checked) {
                //   console.log('Vai alterar funcionario: ' + JSON.stringify(funcionario));
                const caminhoRota = `${API_BASE_URL}/funcionario/${currentPersonId}`;
                //console.log('Caminho da rota para funcionario: ' + caminhoRota);
                //obter o funcionario para ver se existe
                const respObterFuncionario = await fetch(caminhoRota);
                if (respObterFuncionario.status === 404) {
                    //não existe, incluir       
                    responseFuncionario = await fetch(`${API_BASE_URL}/funcionario`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(funcionario)
                    });
                } else {
                    //já existe, alterar
                    responseFuncionario = await fetch(caminhoRota, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(funcionario)
                    });
                }
            } else {
                //se DEIXOU de ser funcionario, excluir da tabela funcionario
                const caminhoRota = `${API_BASE_URL}/funcionario/${currentPersonId}`;
                const respObterFuncionario = await fetch(caminhoRota);
                //    console.log('Resposta ao obter funcionario para exclusão: ' + respObterFuncionario.status);
                if (respObterFuncionario.status === 200) {
                    //existe, pode excluir
                    responseFuncionario = await fetch(caminhoRota, {
                        method: 'DELETE'
                    });
                }
            }
        } else if (operacao === 'excluir') {
            //se é cliente, excluir da tabela cliente primeiro
            let responseCliente = null;
            const caminhoRotaCliente = `${API_BASE_URL}/cliente/${currentPersonId}`;
            const respObterCliente = await fetch(caminhoRotaCliente);
            //console.log('Resposta ao obter cliente para exclusão: ' + respObterCliente.status);
            if (respObterCliente.status === 200) {
                //existe, pode excluir
                responseCliente = await fetch(caminhoRotaCliente, {
                    method: 'DELETE'
                });
            }

             //se é avaliado, excluir da tabela avaliado primeiro
            let responseAvaliado = null;
            const caminhoRotaAvaliado = `${API_BASE_URL}/avaliado/${currentPersonId}`;
            const respObterAvaliado = await fetch(caminhoRotaAvaliado);
            //console.log('Resposta ao obter avaliado para exclusão: ' + respObterAvaliado.status);
            if (respObterAvaliado.status === 200) {
                //existe, pode excluir
                responseAvaliado = await fetch(caminhoRotaAvaliado, {
                    method: 'DELETE'
                });
            }


            //verificar se é funcionario, se for, excluir da tabela funcionario primeiro
            const caminhoRota = `${API_BASE_URL}/funcionario/${currentPersonId}`;
            const respObterFuncionario = await fetch(caminhoRota);
            //    console.log('Resposta ao obter funcionario para exclusão: ' + respObterFuncionario.status);
            if (respObterFuncionario.status === 200) {
                //existe, pode excluir
                responseFuncionario = await fetch(caminhoRota, {
                    method: 'DELETE'
                });
            }
            //agora exclui da tabela pessoa
            // console.log('Excluindo pessoa com ID:', currentPersonId);
            responseFuncionario = await fetch(`${API_BASE_URL}/pessoa/${currentPersonId}`, {
                method: 'DELETE'
            });
            responsePessoa = responseFuncionario;
            //  console.log('Pessoa excluída' + responseFuncionario.status);
        }

        if (responsePessoa.ok && (operacao === 'incluir' || operacao === 'alterar')) {

            mostrarMensagem('Operação ' + operacao + ' realizada com sucesso!', 'success');
            limparFormulario();
            carregarPessoas();

        } else if (operacao !== 'excluir') {
            const error = await responsePessoa.json();
            mostrarMensagem(error.error || 'Erro ao incluir pessoa', 'error');
        } else {
            mostrarMensagem('Pessoa excluída com sucesso!', 'success');
            limparFormulario();
            carregarPessoas();
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao incluir ou alterar a pessoa', 'error');
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

// Função para carregar lista de pessoas
async function carregarPessoas() {
    try {
        const response = await fetch(`${API_BASE_URL}/pessoa`);

        if (response.ok) {
            const pessoas = await response.json();
            renderizarTabelaPessoas(pessoas);
        } else {
            throw new Error('Erro ao carregar pessoas');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de pessoas', 'error');
    }
}

// Função para renderizar tabela de pessoas
function renderizarTabelaPessoas(pessoas) {
    pessoasTableBody.innerHTML = '';

    pessoas.forEach(pessoa => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>
                        <button class="btn-id" onclick="selecionarPessoa(${pessoa.id_pessoa})">
                            ${pessoa.id_pessoa}
                        </button>
                    </td>
                    <td>${pessoa.nome}</td>
                    <td>${pessoa.email}</td>
                    <td>${pessoa.cpf}</td>
                    <td>${pessoa.cep}</td> 
                    <td>${pessoa.endereco}</td>                
                `;
        pessoasTableBody.appendChild(row);
    });
}

// Função para selecionar pessoa da tabela
async function selecionarPessoa(id) {
    searchId.value = id;
    await buscarPessoa();
}

async function carregarDepartamentos() {
    const resp = await fetch(`${API_BASE_URL}/departamento`);
    const departamentos = await resp.json();
    const selectDepartamentos = document.getElementById('departamentoFuncionario');

    selectDepartamentos.innerHTML = '<option value="">Selecione um departamento</option>';
    departamentos.forEach(departamento => {
      const option = document.createElement('option');
      option.value = departamento.id_dep;
      option.textContent = departamento.nome_dep;
      selectDepartamentos.appendChild(option);
    });
  }

async function carregarSupervisores() {
    const resp = await fetch(`${API_BASE_URL}/funcionario`);
    const supervisores = await resp.json();
    const selectSupervisores = document.getElementById('supervisorFuncionario');
    console.log("Supervisores recebidos:", supervisores);

    selectSupervisores.innerHTML = '<option value="">Selecione um supervisor</option>';
    supervisores.forEach(supervisor => {
      const option = document.createElement('option');
      option.value = supervisor.id_pessoa;
      option.textContent = supervisor.nome;
      selectSupervisores.appendChild(option);
    });
  }

  window.addEventListener("DOMContentLoaded", () => {
    carregarDepartamentos();
    carregarSupervisores();
    atualizarCamposFuncionario();
    });