const API_BASE_URL = 'http://localhost:3001';

async function carregarPedidos() {
  // Verifica login antes de buscar pedidos
  const loginRes = await fetch(`${API_BASE_URL}/login/verificaSeUsuarioEstaLogado`, { credentials: 'include' });
  const loginData = await loginRes.json();
  if (loginData.status !== 'ok') {
    window.location.href = '../login/login.html';
    return;
  }
  const res = await fetch(`${API_BASE_URL}/pagamento/pedidosPagos`, { credentials: 'include' });
  const pedidos = await res.json();
  const container = document.getElementById('pedidos-container');
  container.innerHTML = '';
  if (!pedidos.length) {
    container.innerHTML = '<p>Nenhum pedido pago encontrado.</p>';
    return;
  }
  pedidos.forEach(pedido => {
    const div = document.createElement('div');
    div.className = 'pedido';
    div.innerHTML = `<strong>ID:</strong> ${pedido.id_pagamento} <br> <strong>Valor:</strong> R$${pedido.valor} <br> <strong>Data:</strong> ${pedido.data_pagamento}`;
    container.appendChild(div);
  });
}

document.addEventListener('DOMContentLoaded', carregarPedidos);