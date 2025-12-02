const API_BASE_URL = 'http://localhost:3001';

let pedidosCompletos = [];
let todosGeneros = new Set();

// Formatar data no padrão brasileiro
function formatarData(dataISO) {
  const data = new Date(dataISO);
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Formatar valor em reais
function formatarValor(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

// Obter nome do mês
function obterNomeMes(numeroMes) {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return meses[numeroMes - 1];
}

// Carregar todos os pedidos pagos com seus itens
async function carregarPedidos() {
  try {
    // Verifica se o usuário está logado
    const loginRes = await fetch(`${API_BASE_URL}/login/verificaSeUsuarioEstaLogado`, { 
      method: 'POST',
      credentials: 'include' 
    });
    const loginData = await loginRes.json();
    
    if (loginData.status !== 'ok') {
      window.location.href = '../login/login.html';
      return;
    }

    // Busca os pedidos pagos do usuário logado
    const resPedidosPagos = await fetch(`${API_BASE_URL}/pagamento/pedidosPagos`, { 
      credentials: 'include' 
    });
    const pedidosPagos = await resPedidosPagos.json();

    if (!pedidosPagos || pedidosPagos.length === 0) {
      pedidosCompletos = [];
      preencherFiltros();
      aplicarFiltros();
      return;
    }

    // Para cada pedido pago, busca os itens do carrinho
    pedidosCompletos = await Promise.all(
      pedidosPagos.map(async (pedido) => {
        // Busca os itens do carrinho usando a rota /:idCarrinho
        const resItens = await fetch(
          `${API_BASE_URL}/carrinho_livros/${pedido.id_carrinho}`, 
          { credentials: 'include' }
        );
        
        let itens = [];
        try {
          itens = await resItens.json();
          
          // Se retornou erro 404, o carrinho não tem itens
          if (itens.error || itens.message) {
            itens = [];
          }
        } catch (error) {
          console.error(`Erro ao buscar itens do carrinho ${pedido.id_carrinho}:`, error);
          itens = [];
        }

        // Para cada item, busca informações completas do livro (incluindo gênero)
        const itensCompletos = await Promise.all(
          itens.map(async (item) => {
            try {
              const resLivro = await fetch(
                `${API_BASE_URL}/livro/${item.id_livro}`, 
                { credentials: 'include' }
              );
              const livro = await resLivro.json();
              
              // Buscar os gêneros do livro na tabela N:N
              let generosDoLivro = [];
              try {
                const resGeneros = await fetch(`${API_BASE_URL}/livro_genero`, {
                  credentials: 'include'
                });
                const todasAssociacoes = await resGeneros.json();

                // filtra somente as associações deste livro
                const assocLivro = todasAssociacoes.filter(g => g.id_livro === item.id_livro);

                // extrai nomes dos gêneros
                generosDoLivro = await Promise.all(
                  assocLivro.map(async g => {
                    const resGenero = await fetch(`${API_BASE_URL}/genero/${g.id_genero}`, {
                      credentials: 'include'
                    });
                    const generoObj = await resGenero.json();
                    return generoObj.nome_genero;
                  })
                );

                // adiciona todos os gêneros ao conjunto global
                generosDoLivro.forEach(g => todosGeneros.add(g));

              } catch (err) {
                console.error("Erro ao buscar gêneros do livro:", err);
                generosDoLivro = ["Não especificado"];
              }

              // retorna item COMPLETO
              return {
                id_livro: item.id_livro,
                nome_livro: item.nome_livro,
                quant_livro: item.quant_livro,
                preco: item.preco,
                generos: generosDoLivro, // <<< AGORA É LISTA
                subtotal: item.preco * item.quant_livro
              };
            } catch (error) {
              console.error(`Erro ao buscar livro ${item.id_livro}:`, error);
              return {
                id_livro: item.id_livro,
                nome_livro: item.nome_livro || 'Desconhecido',
                quant_livro: item.quant_livro,
                preco: item.preco,
                genero: 'Não especificado',
                subtotal: item.preco * item.quant_livro
              };
            }
          })
        );

        return {
          id_pagamento: pedido.id_pagamento,
          id_carrinho: pedido.id_carrinho,
          data_pagamento: pedido.data_pagamento,
          data_carrinho: pedido.data_carrinho,
          valor_total: parseFloat(pedido.valor),
          itens: itensCompletos
        };
      })
    );

    // Ordena por data de pagamento (mais recente primeiro)
    pedidosCompletos.sort((a, b) => 
      new Date(b.data_pagamento) - new Date(a.data_pagamento)
    );

    preencherFiltros();
    aplicarFiltros();

  } catch (error) {
    console.error('Erro ao carregar pedidos:', error);
    const container = document.getElementById('pedidos-container');
    container.innerHTML = `
      <div class="vazio">
        <div class="vazio-icon">⚠️</div>
        <h3>Erro ao carregar pedidos</h3>
        <p>Tente novamente mais tarde.</p>
      </div>
    `;
  }
}

// Preencher os filtros de mês e gênero
function preencherFiltros() {
  // Extrair meses únicos dos pedidos
  const meses = new Set();
  pedidosCompletos.forEach(pedido => {
    const data = new Date(pedido.data_pagamento);
    const mesAno = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
    meses.add(mesAno);
  });

  // Preencher select de meses
  const filtroMes = document.getElementById('filtroMes');
  filtroMes.innerHTML = '<option value="">Todos os meses</option>';
  
  Array.from(meses).sort().reverse().forEach(mesAno => {
    const [ano, mes] = mesAno.split('-');
    const option = document.createElement('option');
    option.value = mesAno;
    option.textContent = `${obterNomeMes(parseInt(mes))} ${ano}`;
    filtroMes.appendChild(option);
  });

  // Preencher select de gêneros
  const filtroGenero = document.getElementById('filtroGenero');
  filtroGenero.innerHTML = '<option value="">Todos os gêneros</option>';
  
  Array.from(todosGeneros).sort().forEach(genero => {
    const option = document.createElement('option');
    option.value = genero;
    option.textContent = genero;
    filtroGenero.appendChild(option);
  });

  // Adicionar eventos de mudança
  filtroMes.addEventListener('change', aplicarFiltros);
  filtroGenero.addEventListener('change', aplicarFiltros);
}

// Aplicar filtros e exibir pedidos
function aplicarFiltros() {
  const mesSelecionado = document.getElementById('filtroMes').value;
  const generoSelecionado = document.getElementById('filtroGenero').value;

  // Filtrar pedidos
  let pedidosFiltrados = pedidosCompletos.filter(pedido => {
    // Filtro de mês
    if (mesSelecionado) {
      const data = new Date(pedido.data_pagamento);
      const mesAnoPedido = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      if (mesAnoPedido !== mesSelecionado) return false;
    }

    // Filtro de gênero
    if (generoSelecionado) {
      const temGenero = pedido.itens.some(item => item.generos.includes(generoSelecionado));
      if (!temGenero) return false;
    }

    return true;
  });

  // Se filtro de gênero está ativo, filtrar também os itens dentro de cada pedido
  if (generoSelecionado) {
    pedidosFiltrados = pedidosFiltrados.map(pedido => ({
      ...pedido,
      itens: pedido.itens.filter(item => item.generos.includes(generoSelecionado)),
      valor_total: pedido.valor_total
    }));
  }

  atualizarResumo(pedidosFiltrados);
  exibirPedidos(pedidosFiltrados);
}

function atualizarResumo(pedidos) {
  const generoSelecionado = document.getElementById('filtroGenero').value;
  const mesSelecionado = document.getElementById('filtroMes').value;

  const totalPedidos = pedidos.length;
  let totalGasto = 0;

  // CASO 1: Nenhum filtro está ativo → usa total real dos pedidos
  if (!generoSelecionado && !mesSelecionado) {
    totalGasto = pedidos.reduce((sum, p) => sum + p.valor_total, 0);
  }

  // CASO 2: Apenas filtro de mês ativo → soma total real dos pedidos filtrados
  else if (!generoSelecionado && mesSelecionado) {
    totalGasto = pedidos.reduce((sum, p) => sum + p.valor_total, 0);
  }

  // CASO 3: Apenas filtro de gênero ativo → soma apenas subtotais dos itens desse gênero
  else if (generoSelecionado && !mesSelecionado) {
    totalGasto = pedidos.reduce((sumPedidos, pedido) => {
      const somaItens = pedido.itens.reduce((sumItensPedido, item) => {
        return sumItensPedido + item.subtotal;
      }, 0);
      return sumPedidos + somaItens;
    }, 0);
  }

  // CASO 4: Filtro de mês + gênero ativos → soma apenas subtotais dos itens do gênero
  else if (generoSelecionado && mesSelecionado) {
    totalGasto = pedidos.reduce((sumPedidos, pedido) => {
      const somaItens = pedido.itens.reduce((sumItensPedido, item) => {
        return sumItensPedido + item.subtotal;
      }, 0);
      return sumPedidos + somaItens;
    }, 0);
  }

  // Total de itens (respeitando filtros)
  const totalItens = pedidos.reduce((sum, p) => 
    sum + p.itens.reduce((s, i) => s + i.quant_livro, 0), 0
  );

  document.getElementById('totalPedidos').textContent = totalPedidos;
  document.getElementById('totalGasto').textContent = formatarValor(totalGasto);
  document.getElementById('totalItens').textContent = totalItens;
}


// Exibir pedidos na tela
function exibirPedidos(pedidos) {
  const container = document.getElementById('pedidos-container');

  if (pedidos.length === 0) {
    container.innerHTML = `
      <div class="vazio">
        <div class="vazio-icon">📭</div>
        <h3>Nenhum pedido encontrado</h3>
        <p>Você ainda não tem pedidos pagos ou não há resultados para os filtros aplicados.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '<div class="pedidos-lista"></div>';
  const lista = container.querySelector('.pedidos-lista');

  pedidos.forEach(pedido => {
    const pedidoDiv = document.createElement('div');
    pedidoDiv.className = 'pedido-card';
    
    const itensHTML = pedido.itens.map(item => `
      <div class="item">
        <div class="item-info">
          <div class="item-nome">${item.nome_livro}</div>
          <div class="item-detalhes">
            Gênero: ${item.generos.join(', ')} • Quantidade: ${item.quant_livro} • 
            Preço unitário: ${formatarValor(item.preco)}
          </div>
        </div>
        <div class="item-preco">${formatarValor(item.subtotal)}</div>
      </div>
    `).join('');

    pedidoDiv.innerHTML = `
      <div class="pedido-header">
        <div class="pedido-info">
          <div class="pedido-id">Pedido #${pedido.id_pagamento}</div>
          <div class="pedido-data">
            📅 Pago em: ${formatarData(pedido.data_pagamento)}
            ${pedido.data_carrinho ? `• Criado em: ${formatarData(pedido.data_carrinho)}` : ''}
          </div>
        </div>
        <div class="pedido-valor">
          <div class="pedido-valor-label">Valor Total</div>
          <div class="pedido-valor-total">${formatarValor(pedido.valor_total)}</div>
        </div>
      </div>
      <div class="itens-lista">
        ${itensHTML}
      </div>
    `;

    lista.appendChild(pedidoDiv);
  });
}

// Inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', carregarPedidos);