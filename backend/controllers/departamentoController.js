//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudDepartamento = (req, res) => {
  console.log('departamentoController - Rota /abrirCrudDepartamento - abrir o crudDepartamento');
  res.sendFile(path.join(__dirname, '../../frontend/admin/departamento/departamento.html'));
}

exports.listarDepartamentos = async (req, res) => {
  try {
    const result = await query('SELECT * FROM departamento ORDER BY id_dep');
     console.log('Resultado do SELECT:', result.rows);//verifica se está retornando algo
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar departamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}


exports.criarDepartamento = async (req, res) => {
  //  console.log('Criando departamento com dados:', req.body);
  try {
    const { id_dep, nome_dep} = req.body;

    // Validação básica
    if (!nome_dep) {
      return res.status(400).json({
        error: 'O nome do departamento é obrigatório'
      });
    }

    const result = await query(
      'INSERT INTO departamento (id_dep, nome_dep) VALUES ($1, $2) RETURNING *',
      [id_dep, nome_dep]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar departamento:', error);

   

    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterDepartamento = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

   // console.log("estou no obter departamento id="+ id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM departamento WHERE id_dep = $1',
      [id]
    );

    //console.log(result)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter departamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarDepartamento = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nome_dep} = req.body;

   
    // Verifica se a departamento existe
    const existingDepartamentoResult = await query(
      'SELECT * FROM departamento WHERE id_dep = $1',
      [id]
    );

    if (existingDepartamentoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Departamento não encontrada' });
    }

    // Constrói a query de atualização dinamicamente para campos não nulos
    const currentDepartamento = existingDepartamentoResult.rows[0];
    const updatedFields = {
      nome_dep: nome_dep !== undefined ? nome_dep : currentDepartamento.nome_dep     
    };

    // Atualiza a departamento
    const updateResult = await query(
      'UPDATE departamento SET nome_dep = $1 WHERE id_dep = $2 RETURNING *',
      [updatedFields.nome_dep,  id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar departamento:', error);

  
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarDepartamento = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Verifica se a departamento existe
    const existingDepartamentoResult = await query(
      'SELECT * FROM departamento WHERE id_dep = $1',
      [id]
    );

    if (existingDepartamentoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Departamento não encontrada' });
    }

    // Deleta a departamento (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM departamento WHERE id_dep = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar departamento:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar departamento com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}


