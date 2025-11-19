// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentPersonId = null;
let operacao = null;

// --- Cadastro rápido de usuário (cliente) ---
if (document.getElementById('btnCadastrar')) {
  document.getElementById('btnCadastrar').addEventListener('click', async function() {
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha_pessoa = document.getElementById('senha').value;
    const cpf = document.getElementById('cpf').value;
    const cep = document.getElementById('cep').value;
    const endereco = document.getElementById('endereco').value;
    // Monta objeto para cadastro
    const novoUsuario = {
      nome,
      email,
      senha: senha_pessoa,
      cpf,
      cep,
      endereco
    };
    // Salva pessoa
    const resPessoa = await fetch(`${API_BASE_URL}/pessoa/criarUsuario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoUsuario)
    });
    const dataPessoa = await resPessoa.json();
    if (!resPessoa.ok) {
      document.getElementById('msgCadastroUsuario').textContent = dataPessoa.error || 'Erro ao cadastrar usuário.';
      return;
    }
    // Salva como cliente
    const id_pessoa = dataPessoa.id_pessoa || dataPessoa.insertId || dataPessoa.id;
    const resCliente = await fetch(`${API_BASE_URL}/cliente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_pessoa })
    });
    const dataCliente = await resCliente.json();
    if (!resCliente.ok) {
      document.getElementById('msgCadastroUsuario').textContent = dataCliente.error || 'Erro ao cadastrar cliente.';
      return;
    }
    document.getElementById('msgCadastroUsuario').textContent = 'Cadastro realizado com sucesso!';
    // Se houver carrinho no cookie, transfere para backend
    const match = document.cookie.match(/(?:^|; )carrinhoUsuario=([^;]*)/);
    if (match) {
      const carrinho = JSON.parse(decodeURIComponent(match[1]));
      await fetch(`${API_BASE_URL}/carrinho/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(carrinho)
      });
      document.cookie = 'carrinhoUsuario=;path=/;max-age=0';
    }
    setTimeout(() => {
      window.location.href = '../login/login.html';
    }, 1500);
  });
}
if (document.getElementById('btnLimpar')) {
  document.getElementById('btnLimpar').addEventListener('click', function() {
    if (document.getElementById('msgCadastroUsuario')) {
      document.getElementById('msgCadastroUsuario').textContent = '';
    }
  });
}