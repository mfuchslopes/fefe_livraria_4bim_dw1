const API_BASE_URL = 'http://localhost:3001';

// Máscaras para CPF e CEP
document.getElementById('cpf').addEventListener('input', function(e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length <= 11) {
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = value;
  }
});

document.getElementById('cep').addEventListener('input', function(e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length <= 8) {
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    e.target.value = value;
  }
});

// Busca endereço por CEP
document.getElementById('cep').addEventListener('blur', async function(e) {
  const cep = e.target.value.replace(/\D/g, '');
  
  if (cep.length === 8) {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        const endereco = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
        document.getElementById('endereco').value = endereco;
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  }
});

// Validações
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Validação dos dígitos verificadores
  let soma = 0;
  let resto;
  
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
}

function mostrarErro(campo, mensagem) {
  const erroDiv = document.getElementById(`erro${campo.charAt(0).toUpperCase() + campo.slice(1)}`);
  const input = document.getElementById(campo);
  
  erroDiv.textContent = mensagem;
  erroDiv.classList.add('ativo');
  input.style.borderColor = '#ff6b6b';
}

function limparErro(campo) {
  const erroDiv = document.getElementById(`erro${campo.charAt(0).toUpperCase() + campo.slice(1)}`);
  const input = document.getElementById(campo);
  
  erroDiv.classList.remove('ativo');
  input.style.borderColor = 'rgba(191, 167, 111, 0.3)';
}

function limparTodosErros() {
  const campos = ['nome', 'email', 'cpf', 'cep', 'endereco', 'senha', 'confirmarSenha'];
  campos.forEach(campo => limparErro(campo));
}

// Função para obter carrinho do cookie
function getCarrinhoFromCookie() {
  const match = document.cookie.match(/(?:^|; )carrinhoAtual=([^;]*)/);
  if (match) {
    try {
      return JSON.parse(decodeURIComponent(match[1]));
    } catch (e) {
      return null;
    }
  }
  return null;
}

// Função para fazer login automático após cadastro
async function loginAutomatico(email, senha) {
  try {
    const response = await fetch(`${API_BASE_URL}/login/verificarSenha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, senha })
    });

    const data = await response.json();
    return data.status === 'ok';

     // Aguarda até que o cookie seja criado
    await new Promise(resolve => setTimeout(resolve, 300)); 

    return true;

  } catch (error) {
    console.error('Erro ao fazer login automático:', error);
    return false;
  }
}

async function transferirCarrinho(carrinhoLocal) {
  if (!carrinhoLocal || !carrinhoLocal.itens || carrinhoLocal.itens.length === 0) {
    return;
  }

  try {
    console.log("Transferindo carrinho do cookie para o banco...");

    // 1. Criar um carrinho no backend (associado ao usuário logado)
    const resNovoCarrinho = await fetch(`${API_BASE_URL}/carrinho/novo`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!resNovoCarrinho.ok) {
      console.error('Erro ao criar carrinho no banco');
      return;
    }

    const novoCarrinho = await resNovoCarrinho.json();
    const idCarrinho = novoCarrinho.id_carrinho;

    console.log("Carrinho criado no BD:", idCarrinho);

    // 2. Adicionar cada item ao carrinho, usando a rota certa
    for (const item of carrinhoLocal.itens) {
      console.log(`Salvando item no carrinho: livro ${item.id_livro}, qnt ${item.quantidade}`);

      await fetch(`${API_BASE_URL}/carrinho_livros/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id_carrinho: idCarrinho,
          id_livro: item.id_livro,
          quant_livro: item.quantidade
        })
      });
    }

    // 3. Remover carrinho antigo do cookie
    document.cookie = 'carrinhoAtual=; path=/; max-age=0';

    // 4. Definir o carrinhoAtual no cookie
    document.cookie = `carrinhoAtual=${idCarrinho}; path=/; max-age=604800`;

    console.log("Carrinho transferido com sucesso!");

  } catch (error) {
    console.error('Erro ao transferir carrinho:', error);
  }
}


// Submit do formulário
document.getElementById('formCadastro').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  limparTodosErros();
  
  // Coleta dados do formulário
  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const cpf = document.getElementById('cpf').value;
  const cep = document.getElementById('cep').value;
  const endereco = document.getElementById('endereco').value.trim();
  const senha = document.getElementById('senha').value;
  const confirmarSenha = document.getElementById('confirmarSenha').value;
  
  let temErro = false;
  
  // Validações
  if (nome.length < 3) {
    mostrarErro('nome', 'Nome deve ter pelo menos 3 caracteres');
    temErro = true;
  }
  
  if (!validarEmail(email)) {
    mostrarErro('email', 'E-mail inválido');
    temErro = true;
  }
  
  if (!validarCPF(cpf)) {
    mostrarErro('cpf', 'CPF inválido');
    temErro = true;
  }
  
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length !== 8) {
    mostrarErro('cep', 'CEP inválido');
    temErro = true;
  }
  
  if (endereco.length < 10) {
    mostrarErro('endereco', 'Endereço incompleto');
    temErro = true;
  }
  
  if (senha.length < 6) {
    mostrarErro('senha', 'Senha deve ter pelo menos 6 caracteres');
    temErro = true;
  }
  
  if (senha !== confirmarSenha) {
    mostrarErro('confirmarSenha', 'As senhas não coincidem');
    temErro = true;
  }
  
  if (temErro) {
    return;
  }
  
  // Desabilita botão e mostra loading
  const btnCadastrar = document.getElementById('btnCadastrar');
  const loading = document.getElementById('loading');
  
  btnCadastrar.disabled = true;
  loading.classList.add('ativo');
  
  try {
    // Obtém carrinho local antes de fazer o cadastro
    const carrinhoLocal = getCarrinhoFromCookie();
    
    // Faz o cadastro
    const response = await fetch(`${API_BASE_URL}/pessoa/criarUsuario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome,
        email,
        cpf,
        cep,
        endereco,
        senha
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      
      // Cria o cliente automaticamente
      try {
        await fetch(`${API_BASE_URL}/cliente/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_pessoa: data.id_pessoa   // usa o ID gerado no cadastro
          })
        });
      } catch (error) {
        console.error('Erro ao criar cliente automaticamente:', error);
      }

      // Cadastro bem-sucedido
      alert('Cadastro realizado com sucesso! Você será redirecionado para a página inicial.');
      
      // Faz login automático
      const loginSucesso = await loginAutomatico(email, senha);
      
      if (loginSucesso) {
        // Transfere carrinho do cookie para o banco
        await transferirCarrinho(carrinhoLocal);
        
        // Redireciona para a página principal
        window.location.href = '../cliente/menu.html';
      } else {
        // Se falhar o login automático, redireciona para página de login
        alert('Conta criada! Por favor, faça login.');
        window.location.href = '../login/login.html';
      }
    } else {
      // Erro no cadastro
      if (data.error) {
        if (data.error.includes('Email')) {
          mostrarErro('email', data.error);
        } else if (data.error.includes('CPF')) {
          mostrarErro('cpf', data.error);
        } else {
          alert(data.error);
        }
      } else {
        alert('Erro ao realizar cadastro. Tente novamente.');
      }
      
      btnCadastrar.disabled = false;
      loading.classList.remove('ativo');
    }
  } catch (error) {
    console.error('Erro ao cadastrar:', error);
    alert('Erro ao conectar com o servidor. Tente novamente.');
    
    btnCadastrar.disabled = false;
    loading.classList.remove('ativo');
  }
});