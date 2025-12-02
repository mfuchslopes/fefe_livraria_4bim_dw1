const API_BASE_URL = 'http://localhost:3001';

document.addEventListener('DOMContentLoaded', carregarUsuarioCarrinhos);

// Gerenciamento de cookies
function setCarrinhoCookie(carrinho) {
  document.cookie = `carrinhoUsuario=${encodeURIComponent(JSON.stringify(carrinho))};path=/;max-age=604800`;
}

function getCarrinhoCookie() {
  const match = document.cookie.match(/(?:^|; )carrinhoUsuario=([^;]*)/);
  return match ? JSON.parse(decodeURIComponent(match[1])) : [];
}

function getCarrinhoAtualCookie() {
  const match = document.cookie.match(/(?:^|; )carrinhoAtual=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function setCarrinhoAtualCookie(idCarrinho) {
  document.cookie = `carrinhoAtual=${encodeURIComponent(idCarrinho)};path=/;max-age=604800`;
}

// Exibe mensagem de feedback
function exibirMensagem(texto, tipo = 'info') {
  const mensagem = document.getElementById('mensagem-feedback');
  mensagem.textContent = texto;
  mensagem.className = `mensagem-feedback ${tipo}`;
  mensagem.style.display = 'block';
  
  setTimeout(() => {
    mensagem.style.display = 'none';
  }, 3000);
}

// Verifica se usuário está logado
async function verificarUsuarioLogado() {
  try {
    const res = await fetch(`${API_BASE_URL}/login/verificaSeUsuarioEstaLogado`, { 
      method: 'POST',
      credentials: 'include' 
    });
    const data = await res.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

// Filtra carrinhos removendo os que já foram pagos
async function filtrarCarrinhosNaoPagos(carrinhos) {
  try {
    const carrinhosFiltrados = [];
    
    for (const carrinho of carrinhos) {
      const res = await fetch(`${API_BASE_URL}/pagamento/carrinho/${carrinho.id_carrinho}`, {
        credentials: 'include'
      });
      
      // Se retornar 404, o carrinho não foi pago
      if (res.status === 404) {
        carrinhosFiltrados.push(carrinho);
      }
    }
    
    return carrinhosFiltrados;
  } catch (error) {
    console.error('Erro ao filtrar carrinhos pagos:', error);
    return carrinhos; // Retorna todos se houver erro
  }
}

// Carrega os carrinhos do usuário (apenas os não pagos)
async function carregarUsuarioCarrinhos() {
  const container = document.getElementById('usuario-carrinhos-container');
  const logado = await verificarUsuarioLogado();
  let carrinhos = [];

  console.log('Usuário logado?', logado);

  try {
    if (logado) {
      // Busca carrinhos do backend
      const res = await fetch(`${API_BASE_URL}/carrinho/meusCarrinhos`, { 
        credentials: 'include' 
      });
      console.log('Status da resposta:', res.status);
      
      if (res.ok) {
        carrinhos = await res.json();
        console.log('Carrinhos recebidos:', carrinhos);
        
        // Filtra apenas os carrinhos não pagos
        carrinhos = await filtrarCarrinhosNaoPagos(carrinhos);
        console.log('Carrinhos não pagos:', carrinhos);
      } else {
        console.error('Erro ao buscar carrinhos:', res.status);
      }
    } else {
      // Para visitantes, mostra todos os carrinhos do cookie
      // (visitantes não têm pagamentos no banco)
      carrinhos = getCarrinhoCookie();
      console.log('Carrinhos do cookie:', carrinhos);
    }
  } catch (error) {
    console.error('Erro ao carregar carrinhos:', error);
    exibirMensagem('Erro ao carregar carrinhos', 'erro');
  }

  // Renderiza os carrinhos
  container.innerHTML = '';
  
  if (!carrinhos || !carrinhos.length) {
    container.innerHTML = `
      <div class="vazio">
        <p>Você ainda não possui carrinhos não pagos.</p>
        <p>Clique em "Novo Carrinho" para criar seu primeiro carrinho de compras.</p>
      </div>
    `;
    return;
  }

  const carrinhoAtual = getCarrinhoAtualCookie();

  carrinhos.forEach((carrinho) => {
    const div = document.createElement('div');
    div.className = 'carrinho-card';
    
    if (carrinho.id_carrinho == carrinhoAtual) {
      div.classList.add('carrinho-ativo');
    }

    const dataFormatada = carrinho.data_carrinho 
      ? new Date(carrinho.data_carrinho).toLocaleDateString('pt-BR')
      : 'Data não disponível';

    // Garante que itens seja um array
    const itensArray = Array.isArray(carrinho.itens) ? carrinho.itens : [];
    const totalItens = itensArray.length;
    const quantidadeTotal = itensArray.reduce((sum, item) => {
      const qtd = item.quantidade || item.quant_livro || 0;
      return sum + qtd;
    }, 0);

    console.log(`Carrinho #${carrinho.id_carrinho}:`, {
      itens: itensArray,
      totalItens,
      quantidadeTotal
    });

    div.innerHTML = `
      <div class="carrinho-header">
        <div class="carrinho-info">
          <h3>Carrinho #${carrinho.id_carrinho}</h3>
          <span class="carrinho-data">${dataFormatada}</span>
        </div>
        <div class="carrinho-badges">
          ${carrinho.id_carrinho == carrinhoAtual ? '<span class="badge badge-ativo">Ativo</span>' : ''}
          <span class="badge badge-itens">${totalItens} ${totalItens === 1 ? 'item' : 'itens'}</span>
        </div>
      </div>

      <div class="carrinho-resumo">
        <p><strong>Total de produtos:</strong> ${quantidadeTotal} unidade(s)</p>
      </div>

      ${totalItens > 0 ? `
        <div class="carrinho-itens">
          <h4>Itens do carrinho:</h4>
          <ul class="lista-itens">
            ${itensArray.map(item => {
              const nome = item.nome || item.nome_livro || 'Item';
              const qtd = item.quantidade || item.quant_livro || 0;
              return `
                <li class="item">
                  <span class="item-nome">${nome}</span>
                  <span class="item-quantidade">Qtd: ${qtd}</span>
                </li>
              `;
            }).join('')}
          </ul>
        </div>
      ` : '<p class="carrinho-vazio-msg">Este carrinho está vazio</p>'}

      <div class="carrinho-acoes">
        ${carrinho.id_carrinho != carrinhoAtual ? `
          <button class="btn btn-selecionar" onclick="selecionarCarrinho(${carrinho.id_carrinho})">
            Usar este carrinho
          </button>
        ` : `
          <button class="btn btn-ativo" disabled>
            Carrinho em uso
          </button>
        `}
        <button class="btn btn-excluir" onclick="excluirUsuarioCarrinho(${carrinho.id_carrinho})">
          Excluir
        </button>
      </div>
    `;
    
    container.appendChild(div);
  });
}

// Seleciona um carrinho como ativo
async function selecionarCarrinho(idCarrinho) {
  setCarrinhoAtualCookie(idCarrinho);
  exibirMensagem(`Carrinho #${idCarrinho} selecionado com sucesso!`, 'sucesso');
  await carregarUsuarioCarrinhos();
}

// Cria um novo carrinho
async function criarNovoCarrinho() {
  const logado = await verificarUsuarioLogado();

  try {
    if (logado) {
      // Usuário logado: cria no backend
      const res = await fetch(`${API_BASE_URL}/carrinho/novo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (res.ok) {
        const novoCarrinho = await res.json();
        exibirMensagem(`Novo carrinho #${novoCarrinho.id_carrinho} criado!`, 'sucesso');
        setCarrinhoAtualCookie(novoCarrinho.id_carrinho);
      } else {
        exibirMensagem('Erro ao criar carrinho', 'erro');
      }
    } else {
      // Visitante: salva no cookie
      let carrinhos = getCarrinhoCookie();
      const novoCarrinho = { 
        id_carrinho: Date.now(), 
        data_carrinho: new Date().toISOString(),
        itens: [] 
      };
      carrinhos.push(novoCarrinho);
      setCarrinhoCookie(carrinhos);
      setCarrinhoAtualCookie(novoCarrinho.id_carrinho);
      exibirMensagem(`Novo carrinho criado!`, 'sucesso');
    }

    await carregarUsuarioCarrinhos();
  } catch (error) {
    console.error('Erro ao criar carrinho:', error);
    exibirMensagem('Erro ao criar novo carrinho', 'erro');
  }
}

// Exclui um carrinho
async function excluirUsuarioCarrinho(idCarrinho) {
  if (!confirm('Tem certeza que deseja excluir este carrinho?')) {
    return;
  }

  const logado = await verificarUsuarioLogado();

  try {
    if (logado) {
      // Usuário logado: exclui no backend
      const res = await fetch(`${API_BASE_URL}/carrinho/${idCarrinho}`, { 
        method: 'DELETE', 
        credentials: 'include' 
      });

      if (res.ok || res.status === 204) {
        exibirMensagem('Carrinho excluído com sucesso!', 'sucesso');
        
        // Se era o carrinho ativo, limpa o cookie
        if (getCarrinhoAtualCookie() == idCarrinho) {
          document.cookie = 'carrinhoAtual=;path=/;max-age=0';
        }
      } else {
        exibirMensagem('Erro ao excluir carrinho', 'erro');
      }
    } else {
      // Visitante: exclui do cookie
      let carrinhos = getCarrinhoCookie();
      carrinhos = carrinhos.filter(c => c.id_carrinho != idCarrinho);
      setCarrinhoCookie(carrinhos);
      
      if (getCarrinhoAtualCookie() == idCarrinho) {
        document.cookie = 'carrinhoAtual=;path=/;max-age=0';
      }
      
      exibirMensagem('Carrinho excluído com sucesso!', 'sucesso');
    }

    await carregarUsuarioCarrinhos();
  } catch (error) {
    console.error('Erro ao excluir carrinho:', error);
    exibirMensagem('Erro ao excluir carrinho', 'erro');
  }
}