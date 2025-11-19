const API_BASE_URL = 'http://localhost:3001';
let ehFuncionario = false;

// Chama verificação de usuário ao carregar
window.onload = () => {
  usuarioAutorizado();
  configurarMenuExibicao();
};

function getCarrinhoAtualCookie() {
  const match = document.cookie.match(/(?:^|; )carrinhoAtual=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function configurarMenuExibicao() {
  // Esconde todos os menus inicialmente
  document.getElementById('cadastros-menu').style.display = 'none';
  document.getElementById('meus-carrinhos-menu').style.display = 'none';
  document.getElementById('meus-pedidos-menu').style.display = 'none';
  document.getElementById('pagamento-menu').style.display = 'none';
  // document.getElementById('minha-conta-menu').style.display = 'none';
  document.getElementById('logout-menu').style.display = 'none';
  document.getElementById('login-menu').style.display = 'block';
  document.getElementById('cadastro-menu').style.display = 'block';
}

async function usuarioAutorizado() {
  
  const rota = API_BASE_URL + '/login/verificaSeUsuarioEstaLogado';
  alert('Rota: ' + rota);
  // Corrigido para POST
  const res = await fetch(rota, { method: 'POST', credentials: 'include' });




  const data = await res.json();
  alert(JSON.stringify(data));

  if (data.status === 'ok') {
    // Exibe nome do usuário
    if (document.getElementById('boasVindas')) {
      document.getElementById('boasVindas').innerText =
        `${data.nome} - ${data.departamentoFuncionario ? `Funcionário: ${data.departamentoFuncionario}` : ''}`;
    }
    // Exibe menus conforme tipo de usuário
    document.getElementById('login-menu').style.display = 'none';
    document.getElementById('logout-menu').style.display = 'block';
    document.getElementById('cadastro-menu').style.display = 'none';
    if (data.tipoUsuario === 'funcionario') {
      document.getElementById('cadastros-menu').style.display = 'block';
    }
    if (data.tipoUsuario === 'cliente' || data.tipoUsuario === 'funcionario') {
      document.getElementById('meus-carrinhos-menu').style.display = 'block';
      document.getElementById('meus-pedidos-menu').style.display = 'block';
      document.getElementById('pagamento-menu').style.display = 'block';
      //document.getElementById('minha-conta-menu').style.display = 'block';
    }
    ehFuncionario = (data.tipoUsuario === 'funcionario');
  } else {
    // Usuário não logado: só cadastro e login
    configurarMenuExibicao();
  }
}

async function logout2() {
  // Corrigido para usar API_BASE_URL
  await fetch(API_BASE_URL + '/logout', {
    method: 'POST',
    credentials: 'include'
  });
  window.location.href = API_BASE_URL + '/inicio';
}

// usuarioAutorizado();
document.addEventListener('DOMContentLoaded', () => {
  carregarGeneros();
});

function carregarGeneros() {
  fetch(`${API_BASE_URL}/genero/`)
    .then(res => res.json())
    .then(generos => {
      const container = document.getElementById('generos-container');
      container.innerHTML = '<h2 id="escolha_genero">Escolha um gênero:</h2>';
      generos.forEach(genero => {
        // Criação da seção do gênero
        const generoSection = document.createElement('section');
        generoSection.className = 'genero';
        generoSection.dataset.id = genero.id_genero;
        generoSection.innerHTML = `
          <div class="genero-top">
            <img src="../img/${genero.imagem_genero || 'default_genre.png'}" alt="${genero.nome_genero}" class="genero-img">
            <div class="genero-header">
              <h2>${genero.nome_genero}</h2>
              <p>${genero.descricao_genero || ''}</p>
            </div>
          </div>
          <div class="livros-container"></div>
        `;
        // Evento de clique para exibir os livros
        generoSection.addEventListener('click', () =>
          carregarLivrosPorGenero(genero.id_genero, generoSection)
        );
        container.appendChild(generoSection);
      });
    });
}

async function carregarLivrosPorGenero(idGenero, generoSection, options = {}) {
  const livrosContainer = generoSection.querySelector('.livros-container');
  const animationDuration = options.duration ?? 500; // ms
  const headerSelector = options.headerSelector ?? 'header';
  const header = document.querySelector(headerSelector);
  const offset = options.offset ?? (header ? header.getBoundingClientRect().height : 0);

  // === Função para abrir com animação ===
  function abrirContainer(container) {
    return new Promise(resolve => {
      container.classList.add('abrindo');
      container.style.overflow = 'hidden';
      container.style.height = '0px';
      container.style.opacity = '0';
      container.getBoundingClientRect();

      requestAnimationFrame(() => {
        container.style.transition = `height ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${animationDuration}ms ease`;
        container.style.height = container.scrollHeight + 'px';
        container.style.opacity = '1';
      });

      function onEnd(e) {
        if (e.propertyName === 'height') {
          container.removeEventListener('transitionend', onEnd);
          container.style.transition = '';
          container.style.height = '';
          container.style.overflow = '';
          container.classList.remove('abrindo');
          container.classList.add('aberto');
          resolve();
        }
      }

      container.addEventListener('transitionend', onEnd);
      setTimeout(() => {
        container.removeEventListener('transitionend', onEnd);
        container.style.transition = '';
        container.style.height = '';
        container.style.overflow = '';
        container.classList.remove('abrindo');
        container.classList.add('aberto');
        resolve();
      }, animationDuration + 100);
    });
  }

  // === Função para fechar com animação ===
  function fecharContainer(container) {
    return new Promise(resolve => {
      if (!container.classList.contains('aberto')) return resolve();

      container.classList.remove('aberto');
      container.classList.add('fechando');
      container.style.overflow = 'hidden';
      container.style.height = container.scrollHeight + 'px';
      container.style.opacity = '1';
      container.getBoundingClientRect();

      requestAnimationFrame(() => {
        container.style.transition = `height ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${animationDuration}ms ease`;
        container.style.height = '0px';
        container.style.opacity = '0';
      });

      function onEnd(e) {
        if (e.propertyName === 'height') {
          container.removeEventListener('transitionend', onEnd);
          container.innerHTML = '';
          container.style.transition = '';
          container.style.height = '';
          container.style.opacity = '';
          container.style.overflow = '';
          container.classList.remove('fechando');
          resolve();
        }
      }

      container.addEventListener('transitionend', onEnd);
      setTimeout(() => {
        container.innerHTML = '';
        container.removeEventListener('transitionend', onEnd);
        container.style.transition = '';
        container.style.height = '';
        container.style.opacity = '';
        container.style.overflow = '';
        container.classList.remove('fechando');
        resolve();
      }, animationDuration + 100);
    });
  }

  try {
    // Fecha outros abertos antes
    const outros = Array.from(document.querySelectorAll('.livros-container.aberto, .livros-container.abrindo'))
      .filter(div => div !== livrosContainer);
    await Promise.all(outros.map(div => fecharContainer(div)));

    // Se já está aberto, fecha e sai
    if (livrosContainer.classList.contains('aberto')) {
      await fecharContainer(livrosContainer);
      return;
    }

    // Busca os relacionamentos
    let relacionamentos;
    try {
      const res = await fetch(`${API_BASE_URL}/livro_genero/${idGenero}`);
      relacionamentos = await res.json();
    } catch (err) {
      console.error('Erro ao buscar livros:', err);
      livrosContainer.innerHTML = '<p class="sem-livros">Erro ao buscar livros. Tente novamente.</p>';
      await abrirContainer(livrosContainer);
      return;
    }

    // Monta os livros
    livrosContainer.innerHTML = '';
    if (!Array.isArray(relacionamentos) || relacionamentos.length === 0) {
      livrosContainer.innerHTML = '<p class="sem-livros">Nenhum livro encontrado para este gênero.</p>';
    } else {
      const livros = await Promise.all(
        relacionamentos.map(rel =>
          fetch(`${API_BASE_URL}/livro/${rel.id_livro}`).then(r => r.ok ? r.json() : null)
        )
      );

      livros.forEach(livro => {
        if (!livro) return;
        const card = document.createElement('div');
        card.className = 'livro-card';
        card.innerHTML = `
          <img src="../img/${livro.imagem_livro}" alt="${livro.nome_livro}" class="livro-img">
          <div class="livro-info">
            <h3>${livro.nome_livro}</h3>
            <p class="livro-preco">R$${livro.preco}</p>
            <p>${livro.descricao_livro || ''}</p>
            <button class="btn-carrinho" data-id="${livro.id_livro}" data-action="add">Adicionar ao Carrinho</button>
            <button class="btn-carrinho" data-id="${livro.id_livro}" data-action="remove">Remover do Carrinho</button>
          </div>
        `;
        livrosContainer.appendChild(card);
      });

      // Adiciona eventos aos botões de carrinho
      livrosContainer.querySelectorAll('.btn-carrinho').forEach(btn => {
        btn.addEventListener('click', function() {
          const idLivro = this.getAttribute('data-id');
          const action = this.getAttribute('data-action');
          const livro = livros.find(l => l && l.id_livro == idLivro);
          if (!livro) return;
          if (action === 'add') {
            adicionarItemCarrinho(livro);
          } else {
            removerItemCarrinho(livro.id_livro);
          }
        });
      });
    }

    // Abre e rola suavemente até o gênero
    await abrirContainer(livrosContainer);

    setTimeout(() => {
      const rect = generoSection.getBoundingClientRect();
      const targetY = window.scrollY + rect.top - offset;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }, animationDuration / 2);

  } catch (err) {
    console.error('Erro inesperado:', err);
    livrosContainer.innerHTML = '<p class="sem-livros">Erro inesperado.</p>';
  }
}


function handleUserAction(value) {
  if (value === 'gerenciar-conta') {
    window.location.href = 'pessoa/pessoa.html';
  } else if (value === 'sair') {
    window.location.href = 'login/login.html';
  }
}

const menuLinks = document.querySelectorAll('.menu-link');

menuLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    const submenu = link.nextElementSibling;
    if (!submenu || !submenu.classList.contains('nav__submenu')) {
      // Se não tem submenu, deixa navegar normalmente (Cadastro, Login, etc)
      return;
    }
    e.preventDefault(); // só previne se tem submenu
    // Fecha todos os outros submenus
    document.querySelectorAll('.nav__submenu').forEach(sm => {
      if (sm !== submenu) sm.classList.remove('show');
    });
    // Alterna o submenu atual
    submenu.classList.toggle('show');
  });
});

// Opcional: clicar fora do menu fecha todos os submenus
document.addEventListener('click', (e) => {
  if (!e.target.closest('.nav__menu-item')) {
    document.querySelectorAll('.nav__submenu').forEach(sm => sm.classList.remove('show'));
  }
});

// Carrinho lateral
function atualizarCarrinhoLateral() {
  getCarrinho().then(carrinho => {
    const itensDiv = document.getElementById('carrinho-itens');
    const totalDiv = document.getElementById('carrinho-total');
    itensDiv.innerHTML = '';
    let total = 0;
    if (carrinho.itens && carrinho.itens.length > 0) {
      carrinho.itens.forEach(item => {
        fetch(`${API_BASE_URL}/livro/${item.id_livro}`)
          .then(res => res.json())
          .then(livro => {
            const precoFinal = livro.preco * item.quantidade;
            total += precoFinal;
            const div = document.createElement('div');
            div.className = 'carrinho-item ativo';
            div.innerHTML = `<strong style="color:#bfa76f;">${item.nome}</strong> <span style="color:#e6d6b8;">x${item.quantidade}</span> <span style="color:#bfa76f;">- R$${precoFinal.toFixed(2)}</span>`;
            itensDiv.appendChild(div);
            totalDiv.innerHTML = `<span style='color:#bfa76f;'>Total: R$${total.toFixed(2)}</span>`;
          });
      });
    } else {
      itensDiv.innerHTML = '<p style="color:#e6d6b8;">Seu carrinho está vazio.</p>';
      totalDiv.innerText = '';
    }
  });
}

document.getElementById('btnAbrirCarrinho').onclick = function() {
  document.getElementById('carrinho-lateral').style.right = '0';
  document.getElementById('carrinho-lateral').style.opacity = '1';
  document.getElementById('carrinho-lateral').style.display = 'flex';
  document.getElementById('generos-container').style.marginRight = '25vw';
  document.getElementById('btnAbrirCarrinho').style.display = 'none';
  atualizarCarrinhoLateral();
};
document.getElementById('btnFecharCarrinho').onclick = function() {
  document.getElementById('carrinho-lateral').style.right = '-25vw';
  document.getElementById('carrinho-lateral').style.opacity = '0';
  setTimeout(function() {
    document.getElementById('carrinho-lateral').style.display = 'none';
  }, 400);
  document.getElementById('generos-container').style.marginRight = '0';
  document.getElementById('btnAbrirCarrinho').style.display = 'inline-block';
};

// Atualiza carrinho lateral ao adicionar/remover
async function adicionarItemCarrinho(livro) {
  let carrinho = await getCarrinho();

  // Se não existe carrinho, cria um novo no backend
  if (!carrinho.id_carrinho) {
    try {
      const res = await fetch(`${API_BASE_URL}/carrinho/novo`, {
        method: 'POST',
        credentials: 'include'
      });
      const novoCarrinho = await res.json();
      carrinho = { ...novoCarrinho, itens: [] };
    } catch (err) {
      console.error('Erro ao criar carrinho:', err);
      alert('Erro ao criar carrinho. Faça login primeiro.');
      return;
    }
  }

  // Garante que itens é um array
  if (!carrinho.itens || !Array.isArray(carrinho.itens)) {
    carrinho.itens = [];
  }

  const idx = carrinho.itens.findIndex(item => item.id_livro === livro.id_livro);
  if (idx >= 0) {
    carrinho.itens[idx].quantidade += 1;
  } else {
    carrinho.itens.push({ 
      id_livro: livro.id_livro, 
      nome: livro.nome_livro, 
      quantidade: 1 
    });
  }

  await setCarrinho(carrinho);
  atualizarCarrinhoLateral();
  alert(`Livro "${livro.nome_livro}" adicionado ao carrinho!`);
}


function removerItemCarrinho(idLivro) {
  getCarrinho().then(carrinho => {
    if (!carrinho.itens) return;
    const idx = carrinho.itens.findIndex(item => item.id_livro == idLivro);
    if (idx >= 0) {
      carrinho.itens.splice(idx, 1);
      setCarrinho(carrinho).then(() => {
        atualizarCarrinhoLateral();
        alert('Livro removido do carrinho!');
      });
    }
  });
}

// Funções de carrinho via cookie

async function setCarrinho(carrinho, criarNovo = false) {
  let logado = false;
  try {
    const resLogin = await fetch(API_BASE_URL + '/login/verificaSeUsuarioEstaLogado', { 
      method: 'POST', 
      credentials: 'include' 
    });
    const dataLogin = await resLogin.json();
    logado = dataLogin.status === 'ok';
  } catch {}

  if (logado) {
    if (criarNovo) {
      const res = await fetch(API_BASE_URL + '/carrinho/novo', {
        method: 'POST',
        credentials: 'include'
      });
      return await res.json();
    } else {
      // CORREÇÃO: Envia o carrinho completo com itens
      await fetch(API_BASE_URL + '/carrinho/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id_carrinho: carrinho.id_carrinho,
          data_carrinho: carrinho.data_carrinho || new Date().toISOString(),
          id_pessoa: carrinho.id_pessoa,
          itens: carrinho.itens || []
        })
      });
    }
  } else {
    // Para visitantes, mantém no cookie
    document.cookie = `carrinhoUsuario=${encodeURIComponent(JSON.stringify(carrinho))};path=/;max-age=604800`;
  }
}

async function getCarrinho() {
  let logado = false;
  let carrinho = { itens: [] };
  
  try {
    const resLogin = await fetch(API_BASE_URL + '/login/verificaSeUsuarioEstaLogado', { 
      method: 'POST', 
      credentials: 'include' 
    });
    const dataLogin = await resLogin.json();
    logado = dataLogin.status === 'ok';
  } catch (err) {
    console.error('Erro ao verificar login:', err);
  }

  if (logado) {
    try {
      const resCarrinho = await fetch(API_BASE_URL + '/carrinho/meusCarrinhos', { 
        credentials: 'include' 
      });
      if (resCarrinho.ok) {
        const carrinhos = await resCarrinho.json();
        const carrinhoAtual = getCarrinhoAtualCookie();

        if (Array.isArray(carrinhos) && carrinhos.length > 0) {
          if (carrinhoAtual) {
            const escolhido = carrinhos.find(c => c.id_carrinho == carrinhoAtual);
            carrinho = escolhido || carrinhos[0];
          } else {
            carrinho = carrinhos[0];
          }

          if (!carrinho.itens) carrinho.itens = [];
        }

      }
    } catch (err) {
      console.error('Erro ao buscar carrinho no backend:', err);
    }
  } else {
    const match = document.cookie.match(/(?:^|; )carrinhoUsuario=([^;]*)/);
    carrinho = match ? JSON.parse(decodeURIComponent(match[1])) : { itens: [] };
  }
  
  return carrinho;
}

