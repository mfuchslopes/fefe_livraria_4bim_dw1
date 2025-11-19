//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudAutor = (req, res) => {
  console.log('autorController - Rota /abrirCrudAutor - abrir o crudAutor');
  res.sendFile(path.join(__dirname, '../../frontend/admin/autor/autor.html'));
}

exports.listarAutors = async (req, res) => {
  try {
    const result = await query('SELECT * FROM autor ORDER BY id_autor');
     console.log('Resultado do SELECT:', result.rows);//verifica se está retornando algo
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar autors:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}


exports.criarAutor = async (req, res) => {
  //  console.log('Criando autor com dados:', req.body);
  try {
    const { id_autor, nome_autor} = req.body;

    // Validação básica
    if (!nome_autor) {
      return res.status(400).json({
        error: 'O nome do autor é obrigatório'
      });
    }

    const result = await query(
      'INSERT INTO autor (id_autor, nome_autor) VALUES ($1, $2) RETURNING *',
      [id_autor, nome_autor]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar autor:', error);

   

    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterAutor = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

   // console.log("estou no obter autor id="+ id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM autor WHERE id_autor = $1',
      [id]
    );

    //console.log(result)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Autor não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter autor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarAutor = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nome_autor} = req.body;

   
    // Verifica se a autor existe
    const existingAutorResult = await query(
      'SELECT * FROM autor WHERE id_autor = $1',
      [id]
    );

    if (existingAutorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Autor não encontrada' });
    }

    // Constrói a query de atualização dinamicamente para campos não nulos
    const currentAutor = existingAutorResult.rows[0];
    const updatedFields = {
      nome_autor: nome_autor !== undefined ? nome_autor : currentAutor.nome_autor     
    };

    // Atualiza a autor
    const updateResult = await query(
      'UPDATE autor SET nome_autor = $1 WHERE id_autor = $2 RETURNING *',
      [updatedFields.nome_autor,  id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar autor:', error);

  
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarAutor = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Verifica se a autor existe
    const existingAutorResult = await query(
      'SELECT * FROM autor WHERE id_autor = $1',
      [id]
    );

    if (existingAutorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Autor não encontrada' });
    }

    // Deleta a autor (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM autor WHERE id_autor = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar autor:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar autor com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}


