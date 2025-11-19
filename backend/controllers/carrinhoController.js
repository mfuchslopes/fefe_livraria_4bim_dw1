
//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudCarrinho = (req, res) => {
  console.log('carrinhoController - Rota /abrirCrudCarrinho - abrir o crudCarrinho');
  res.sendFile(path.join(__dirname, '../../frontend/admin/carrinho/carrinho.html'));
}

exports.listarCarrinho = async (req, res) => {
  try {
    const result = await query(`
      SELECT c.id_carrinho, c.data_carrinho, c.id_pessoa, p.nome
      FROM carrinho c
      JOIN pessoa p ON c.id_pessoa = p.id_pessoa
      ORDER BY c.id_carrinho
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar carrinhos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// FUNÇÃO CORRIGIDA: Agora salva os itens também
exports.criarCarrinho = async (req, res) => {
  try {
    const { id_carrinho, data_carrinho, id_pessoa, itens } = req.body;

    // Verifica se já existe pagamento para este carrinho
    const pagamento = await query(
      'SELECT data_pagamento FROM pagamento WHERE id_carrinho = $1',
      [id_carrinho]
    ).then(r => r.rows[0]);

    if (pagamento && new Date(data_carrinho) > new Date(pagamento.data_pagamento)) {
      return res.status(400).json({
        error: 'A data de criação do carrinho não pode ser posterior à data de pagamento já registrado'
      });
    }

    const hoje = new Date(); 
    if (data_carrinho && new Date(data_carrinho) > hoje) {
      return res.status(400).json({
        error: 'A data de criação do carrinho não pode ser futura'
      });
    }

    // Insere ou atualiza o carrinho
    const carrinhoResult = await query(
      `INSERT INTO carrinho (id_carrinho, data_carrinho, id_pessoa) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (id_carrinho) 
       DO UPDATE SET data_carrinho = $2, id_pessoa = $3
       RETURNING *`,
      [id_carrinho, data_carrinho, id_pessoa]
    );

    const carrinhoId = carrinhoResult.rows[0].id_carrinho;

    // Remove itens antigos e adiciona novos
    if (itens && Array.isArray(itens)) {
      await query('DELETE FROM carrinho_livros WHERE id_carrinho = $1', [carrinhoId]);
      
      for (const item of itens) {
        await query(
          'INSERT INTO carrinho_livros (id_carrinho, id_livro, quant_livro) VALUES ($1, $2, $3)',
          [carrinhoId, item.id_livro, item.quantidade]
        );
      }
    }

    res.status(201).json(carrinhoResult.rows[0]);
  } catch (error) {
    console.error('Erro ao criar carrinho:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterCarrinho = async (req, res) => {
  // console.log('Obtendo carrinho com ID:', req.params.id);

  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM carrinho WHERE id_carrinho = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Carrinho não encontrado' });
    }

    res.json(result.rows[0]); //achou o carrinho e retorna todos os dados do carrinho
    //console.log('Carrinho encontrado:', result.rows[0]);

  } catch (error) {
    console.error('Erro ao obter carrinho:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarCarrinho = async (req, res) => {
  console.log('Atualizando carrinho com ID:', req.params.id, 'e dados:', req.body);
  try {
    const id = parseInt(req.params.id);

    const { data_carrinho, id_pessoa } = req.body;

    console.log('ID do carrinho a ser atualizado:' + id + ' Dados recebidos:' + data_carrinho + ' - ' + id_pessoa);


    // Verifica se a carrinho existe
    const existingCarrinhoResult = await query(
      'SELECT * FROM carrinho WHERE id_carrinho = $1',
      [id]
    );

    if (existingCarrinhoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Carrinho não encontrado' });
    }

    // Constrói a query de atualização dinamicamente para campos não nulos
    const currentCarrinho = existingCarrinhoResult.rows[0];

    // Verifica se já existe pagamento para este carrinho
    const pagamento = await query(
      'SELECT data_pagamento FROM pagamento WHERE id_carrinho = $1',
      [id]
    ).then(r => r.rows[0]);

    const hoje = new Date(); 
      if (data_carrinho && new Date(data_carrinho) > hoje) {
        return res.status(400).json({
          error: 'A data de criação do carrinho não pode ser futura'
        });
      }
    if (pagamento && new Date(data_carrinho) > new Date(pagamento.data_pagamento)) {
      return res.status(400).json({
        error: 'A data de criação do carrinho não pode ser posterior à data de pagamento já registrado'
      });
    }

    const updatedFields = {
      data_carrinho: data_carrinho !== undefined ? data_carrinho : currentCarrinho.data_carrinho,
      id_pessoa: id_pessoa !== undefined ? id_pessoa : currentCarrinho.id_pessoa,
    };
    // console.log('Campos da atualização:', updatedFields);

    // Atualiza a carrinho
    const updateResult = await query(
      'UPDATE carrinho SET data_carrinho = $1, id_pessoa = $2 WHERE id_carrinho = $3 RETURNING *',
      [updatedFields.data_carrinho, updatedFields.id_pessoa, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar carrinho:', error);

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarCarrinho = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Verifica se a carrinho existe
    const existingCarrinhoResult = await query(
      'SELECT * FROM carrinho WHERE id_carrinho = $1',
      [id]
    );

    if (existingCarrinhoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Carrinho não encontrado' });
    }

    // Deleta a carrinho (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM carrinho WHERE id_carrinho = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar carrinho:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar carrinho com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Cria um novo carrinho, deixando o banco gerar o id_carrinho
exports.criarNovoCarrinho = async (req, res) => {
  try {
    // Recupera o nome do usuário logado pelo cookie
    const nome = req.cookies.usuarioLogado;
    if (!nome) {
      return res.status(401).json({ error: 'Usuário não logado' });
    }
    // Busca o id_pessoa pelo nome
    const pessoaResult = await query('SELECT id_pessoa FROM pessoa WHERE nome = $1', [nome]);
    if (!pessoaResult.rows.length) {
      return res.status(400).json({ error: 'Pessoa não encontrada' });
    }
    const id_pessoa = pessoaResult.rows[0].id_pessoa;
    // Cria o carrinho com data atual e id_pessoa, id gerado pelo banco
    const result = await query(
      'INSERT INTO carrinho (data_carrinho, id_pessoa) VALUES (NOW(), $1) RETURNING *',
      [id_pessoa]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar novo carrinho:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// FUNÇÃO CORRIGIDA: Agora retorna os itens junto com o carrinho
exports.meusCarrinhos = async (req, res) => {
  try {
    const nome = req.cookies.usuarioLogado;
    if (!nome) {
      return res.json([]);
    }
    
    const pessoaResult = await query('SELECT id_pessoa FROM pessoa WHERE nome = $1', [nome]);
    if (!pessoaResult.rows.length) {
      return res.json([]);
    }
    
    const id_pessoa = pessoaResult.rows[0].id_pessoa;
    const carrinhoResult = await query(
      'SELECT * FROM carrinho WHERE id_pessoa = $1 ORDER BY id_carrinho DESC', 
      [id_pessoa]
    );
    
    // Para cada carrinho, busca os itens
    const carrinhosComItens = await Promise.all(
      carrinhoResult.rows.map(async (carrinho) => {
        const itensResult = await query(
          `SELECT cl.id_livro, l.nome_livro as nome, cl.quant_livro as quantidade
           FROM carrinho_livros cl
           JOIN livro l ON cl.id_livro = l.id_livro
           WHERE cl.id_carrinho = $1`,
          [carrinho.id_carrinho]
        );
        return {
          ...carrinho,
          itens: itensResult.rows
        };
      })
    );
    
    res.json(carrinhosComItens);
  } catch (error) {
    console.error('Erro ao buscar meus carrinhos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}