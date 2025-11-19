//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudGenero = (req, res) => {
  console.log('generoController - Rota /abrirCrudGenero - abrir o crudGenero');
  res.sendFile(path.join(__dirname, '../../frontend/admin/genero/genero.html'));
}

exports.listarGeneros = async (req, res) => {
  try {
    const result = await query('SELECT * FROM genero ORDER BY id_genero');
     console.log('Resultado do SELECT:', result.rows);//verifica se está retornando algo
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar generos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}


exports.criarGenero = async (req, res) => {
  //  console.log('Criando genero com dados:', req.body);
  try {
    const { id_genero, nome_genero, descricao_genero} = req.body;

      const slug_genero = slugify(nome_genero);
      const imagem_genero = `${slug_genero}.jpg`;

      function slugify(nome) {
        return nome
          .toLowerCase()
          .trim()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
          .replace(/\s+/g, "-") // troca espaços por hífen
          .replace(/[^a-z0-9-]/g, ""); // remove caracteres especiais
      }


    // Validação básica
    if (!nome_genero || !descricao_genero || !imagem_genero) {
      return res.status(400).json({
        error: 'O nome do gênero, sua descrição e sua imagem são obrigatórios'
      });
    }

    const result = await query(
      'INSERT INTO genero (id_genero, nome_genero, descricao_genero, imagem_genero, slug_genero) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id_genero, nome_genero, descricao_genero, imagem_genero, slug_genero]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar gênero:', error);

   

    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterGenero = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

   // console.log("estou no obter genero id="+ id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM genero WHERE id_genero = $1',
      [id]
    );

    //console.log(result)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gênero não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter gênero:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarGenero = async (req, res) => {
  try {

    if (!req.body) {
      return res.status(400).json({ error: 'Corpo da requisição não recebido. Verifique o envio do formulário.' });
    }
    
    const id = parseInt(req.params.id);
    const { nome_genero, descricao_genero,} = req.body;

   
    // Verifica se a genero existe
    const existingGeneroResult = await query(
      'SELECT * FROM genero WHERE id_genero = $1',
      [id]
    );
    
    const slug_genero = slugify(nome_genero);
    const imagem_genero = `${slug_genero}.jpg`;

    function slugify(nome) {
      return nome
        .toLowerCase()
        .trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
        .replace(/\s+/g, "-") // troca espaços por hífen
        .replace(/[^a-z0-9-]/g, ""); // remove caracteres especiais
    }


    if (existingGeneroResult.rows.length === 0) {
      return res.status(404).json({ error: 'Gênero não encontrado' });
    }

    // Constrói a query de atualização dinamicamente para campos não nulos
    const currentGenero = existingGeneroResult.rows[0];
    const updatedFields = {
      nome_genero: nome_genero !== undefined ? nome_genero : currentGenero.nome_genero,     
      descricao_genero: descricao_genero !== undefined ? descricao_genero : currentGenero.descricao_genero, 
      imagem_genero: imagem_genero !== undefined ? imagem_genero : currentGenero.imagem_genero, 
      slug_genero: slug_genero !== undefined ? slug_genero : currentGenero.slug_genero, 
    };

    // Atualiza a genero
    const updateResult = await query(
      'UPDATE genero SET nome_genero = $1, descricao_genero = $2, imagem_genero = $3, slug_genero = $4 WHERE id_genero = $5 RETURNING *',
      [updatedFields.nome_genero, updatedFields.descricao_genero, updatedFields.imagem_genero, updatedFields.slug_genero, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar gênero:', error);

  
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarGenero = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Verifica se a genero existe
    const existingGeneroResult = await query(
      'SELECT * FROM genero WHERE id_genero = $1',
      [id]
    );

    if (existingGeneroResult.rows.length === 0) {
      return res.status(404).json({ error: 'Gênero não encontrada' });
    }

    // Deleta a genero (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM genero WHERE id_genero = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar genero:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar gênero com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}


