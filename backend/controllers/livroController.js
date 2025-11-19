//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudLivro = (req, res) => {
  console.log('livroController - Rota /abrirCrudLivro - abrir o crudLivro');
  res.sendFile(path.join(__dirname, '../../frontend/admin/livro/livro.html'));
}

exports.listarLivros = async (req, res) => {
  try {
    const result = await query('SELECT * FROM livro ORDER BY id_livro');
   //  console.log('Resultado do SELECT:', result.rows);//verifica se está retornando algo
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar livros:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}


exports.criarLivro = async (req, res) => {
  //  console.log('Criando livro com dados:', req.body);
  try {
    const { id_livro, nome_livro, descricao_livro, preco, quant_estoque, data_lanc} = req.body;
    const imagem_livro = `${id_livro}.jpg`;

    // Validação básica
    if (!nome_livro || !preco || !quant_estoque) {
      return res.status(400).json({
        error: 'O nome do livro, seu preço e sua quantidade no estoque são obrigatórios'
      });
    }

    const result = await query(
      'INSERT INTO livro (id_livro, nome_livro, descricao_livro, imagem_livro, preco, quant_estoque, data_lanc) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id_livro, nome_livro, descricao_livro, imagem_livro, preco, quant_estoque, data_lanc]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar livro:', error);

   

    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterLivro = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

   // console.log("estou no obter livro id="+ id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM livro WHERE id_livro = $1',
      [id]
    );

    //console.log(result)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Livro não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter livro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarLivro = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const { nome_livro, descricao_livro, preco, quant_estoque, data_lanc} = req.body;
    const imagem_livro = `${id}.jpg`;

    // Verifica se o livro existe
    const existing = await query('SELECT * FROM livro WHERE id_livro = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Livro não encontrado' });
    }

    // Monta UPDATE dinâmico apenas com campos válidos
    const updates = [];
    const values = [];
    let idx = 1;

    if (nome_livro != null && String(nome_livro).trim() !== '') {
      updates.push(`nome_livro = $${idx++}`);
      values.push(String(nome_livro).trim());
    }

    if (descricao_livro != null && String(descricao_livro).trim() !== '') {
      updates.push(`descricao_livro = $${idx++}`);
      values.push(String(descricao_livro).trim());
    }

    updates.push(`imagem_livro = $${idx++}`);
    values.push(imagem_livro);

 // preco: aceitar número válido (float), >= 0
    if (preco != null && String(preco).trim() !== '') {
      const priceStr = String(preco).replace(',', '.').trim();
      const price = Number(priceStr);
      if (!Number.isFinite(price)) {
        return res.status(400).json({ error: 'preco deve ser um número válido' });
      }
      if (price < 0) {
        return res.status(400).json({ error: 'preco não pode ser negativo' });
      }
      updates.push(`preco = $${idx++}`);
      values.push(price);
    }


    // quantidade_estoque: aceitar apenas inteiro válido
    if (quant_estoque != null && String(quant_estoque).trim() !== '') {
      const qtyStr = String(quant_estoque).replace(',', '.').trim();
      const qty = Number(qtyStr);
      if (!Number.isInteger(qty)) {
        return res.status(400).json({ error: 'quant_estoque deve ser um inteiro válido' });
      }
      updates.push(`quant_estoque = $${idx++}`);
      values.push(qty);
    }

    // data_lanc: aceitar data válida no formato YYYY-MM-DD
    if (data_lanc != null && String(data_lanc).trim() !== '') {
      const date = new Date(String(data_lanc).trim());
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: 'data_lanc deve ser uma data válida' });
      }
      updates.push(`data_lanc = $${idx++}`);
      values.push(date);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
    }

    values.push(id);
    const sql = `UPDATE livro SET ${updates.join(', ')} WHERE id_livro = $${idx} RETURNING *`;

    const updateResult = await query(sql, values);
    return res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar livro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};


exports.deletarLivro = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Verifica se a livro existe
    const existingPersonResult = await query(
      'SELECT * FROM livro WHERE id_livro = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Livro não encontrada' });
    }

    // Deleta a livro (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM livro WHERE id_livro = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar livro:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar livro com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}


