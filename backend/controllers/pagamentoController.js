//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudPagamento = (req, res) => {
  console.log('pagamentoController - Rota /abrirCrudPagamento - abrir o crudPagamento');
  res.sendFile(path.join(__dirname, '../../frontend/admin/pagamento/pagamento.html'));
}

exports.listarPagamentos = async (req, res) => {
  try {
    const result = await query('SELECT * FROM pagamento ORDER BY id_carrinho');
     console.log('Resultado do SELECT:', result.rows);//verifica se está retornando algo
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}


exports.criarPagamento = async (req, res) => {
  //  console.log('Criando pagamento com dados:', req.body);
  try {
    const { id_carrinho, data_pagamento} = req.body;
    const valor_pag = await query(
      'SELECT SUM(l.preco * cl.quant_livro) AS valor_pag '+ 
      'FROM carrinho c ' + 
      'JOIN carrinho_livros cl ON c.id_carrinho = cl.id_carrinho ' + 
      'JOIN livro l ON cl.id_livro = l.id_livro ' + 
      'WHERE c.id_carrinho = $1 '+
      'GROUP BY c.id_carrinho; ',
      [id_carrinho]
    ).then(result => result.rows[0] ? result.rows[0].valor_pag : null);

    // Validação básica
    if (!data_pagamento || !valor_pag) {
      return res.status(400).json({
        error: 'A data e o valor do pagamento são obrigatórios'
      });
    }

    
    // Buscar data de criação do carrinho
    const carrinho = await query(
      'SELECT data_carrinho FROM carrinho WHERE id_carrinho = $1',
      [id_carrinho]
    ).then(r => r.rows[0]);

    if (!carrinho) {
      return res.status(404).json({ error: 'Carrinho não encontrado' });
    }

    // Verificação de data: pagamento >= data de criação do carrinho
    if (new Date(data_pagamento) < new Date(carrinho.data_carrinho)) {
      return res.status(400).json({
        error: 'A data de pagamento não pode ser anterior à data de criação do carrinho'
      });
    }

    const result = await query(
      'INSERT INTO pagamento (id_carrinho, data_pagamento, valor_pag) VALUES ($1, $2, $3) RETURNING *',
      [id_carrinho, data_pagamento, valor_pag]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);

   

    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterPagamento = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

   // console.log("estou no obter pagamento id="+ id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM pagamento WHERE id_carrinho = $1',
      [id]
    );

    //console.log(result)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarPagamento = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { data_pagamento} = req.body;

    // Buscar data de criação do carrinho para validação
    const carrinho = await query(
      'SELECT data_carrinho FROM carrinho WHERE id_carrinho = $1',
      [id]
    ).then(r => r.rows[0]);

    if (!carrinho) {
      return res.status(404).json({ error: 'Carrinho não encontrado' });
    }

    if (data_pagamento && new Date(data_pagamento) < new Date(carrinho.data_carrinho)) {
      return res.status(400).json({
        error: 'A data de pagamento não pode ser anterior à data de criação do carrinho'
      });
    }

    const valor_pag = await query(
      'SELECT SUM(l.preco * cl.quant_livro) AS valor_pag '+ 
      'FROM carrinho c ' + 
      'JOIN carrinho_livros cl ON c.id_carrinho = cl.id_carrinho ' + 
      'JOIN livro l ON cl.id_livro = l.id_livro ' + 
      'WHERE c.id_carrinho = $1 '+
      'GROUP BY c.id_carrinho; ',
      [id]
    ).then(result => result.rows[0] ? result.rows[0].valor_total : null);

   
    // Verifica se a pagamento existe
    const existingPagamentoResult = await query(
      'SELECT * FROM pagamento WHERE id_carrinho = $1',
      [id]
    );

    if (existingPagamentoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pagamento não encontrada' });
    }

    // Constrói a query de atualização dinamicamente para campos não nulos
    const currentPagamento = existingPagamentoResult.rows[0];
    const updatedFields = {
      data_pagamento: data_pagamento !== undefined ? data_pagamento : currentPagamento.data_pagamento,  
      valor_pag: valor_pag !== undefined ? valor_pag : currentPagamento.valor_pag,    
    };

    // Atualiza a pagamento
    const updateResult = await query(
      'UPDATE pagamento SET data_pagamento = $1, valor_pag = $2 WHERE id_carrinho = $3 RETURNING *',
      [updatedFields.data_pagamento, updatedFields.valor_pag,  id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error);

  
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarPagamento = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Verifica se a pagamento existe
    const existingPagamentoResult = await query(
      'SELECT * FROM pagamento WHERE id_carrinho= $1',
      [id]
    );

    if (existingPagamentoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    // Deleta a pagamento (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM pagamento WHERE id_carrinho = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pagamento:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar pagamento com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}


exports.obterPagamentoPorCarrinho = async (req, res) => {
  try {
    const { idCarrinho } = req.params;

    const result = await query(
      'SELECT * FROM pagamento WHERE id_carrinho = $1',
      [idCarrinho]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Pagamento não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar pagamento por carrinho:', error);
    res.status(500).json({ mensagem: 'Erro interno do servidor' });
  }
};