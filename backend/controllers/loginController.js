const db = require('../database.js');

exports.verificaSeUsuarioEstaLogado = (req, res) => {
  console.log('loginController - Acessando rota /verificaSeUsuarioEstaLogado');
  let nome = req.cookies.usuarioLogado;
  let tipoUsuario = req.cookies.tipoUsuario;

  console.log('Cookie usuarioLogado:', nome);
  console.log('Cookie tipoUsuario:', tipoUsuario);
  if (nome) {
    res.json({ status: 'ok', nome, tipoUsuario });
  } else {
    res.json({ status: 'nao_logado' });
  }
}



// Funções do controller
exports.listarPessoas = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM pessoa ORDER BY id_pessoa');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pessoas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.verificarEmail = async (req, res) => {
  const { email } = req.body;

  const sql = 'SELECT nome FROM pessoa WHERE email = $1'; // Postgres usa $1, $2...

  console.log('rota verificarEmail:', sql, email);

  try {
    const result = await db.query(sql, [email]); // igual listarPessoas

    if (result.rows.length > 0) {
      return res.json({ status: 'existe', nome: result.rows[0].nome });
    }

    res.json({ status: 'nao_encontrado' });
  } catch (err) {
    console.error('Erro em verificarEmail:', err);
    res.status(500).json({ status: 'erro', mensagem: err.message });
  }
};


// Verificar senha
exports.verificarSenha = async (req, res) => {
  const { email, senha } = req.body;

  const sqlPessoa = `
    SELECT id_pessoa, nome 
    FROM pessoa 
    WHERE email = $1 AND senha = $2
  `;
  const sqlFuncionario = `
    SELECT id_dep 
    FROM funcionario 
    WHERE id_pessoa = $1
  `;

  console.log('Rota verificarSenha:', sqlPessoa, email, senha);

  try {
    // 1. Verifica se existe pessoa com email/senha
    const resultPessoa = await db.query(sqlPessoa, [email, senha]);

    if (resultPessoa.rows.length === 0) {
      return res.json({ status: 'senha_incorreta' });
    }

    const { id_pessoa, nome } = resultPessoa.rows[0];
    console.log('Usuário encontrado:', resultPessoa.rows[0]);

    // 2. Verifica se é funcionario
    const resultFuncionario = await db.query(sqlFuncionario, [id_pessoa]);

    const departamentoFuncionario = resultFuncionario.rows.length > 0
      ? resultFuncionario.rows[0].id_dep
      : null;

    if (departamentoFuncionario) {
      console.log('Usuário é funcionario, departamento:', departamentoFuncionario);
    } else {
      console.log('Usuário não é funcionario');
    }

    let tipoUsuario = departamentoFuncionario ? 'funcionario' : 'cliente';


    // 3. Define cookie

    res.cookie('usuarioLogado', nome, {
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 1 dia
    });
    res.cookie('tipoUsuario', tipoUsuario, {
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log("Cookie 'usuarioLogado' definido com sucesso");

    // 4. Retorna dados para o frontend (login.html)
    return res.json({
      status: 'ok',
      nome: nome,
      tipoUsuario,
      departamentoFuncionario,
    });

  } catch (err) {
    console.error('Erro ao verificar senha:', err);
    return res.status(500).json({ status: 'erro', mensagem: err.message });
  }
}


// Logout
exports.logout = (req, res) => {
  // Limpa os cookies relacionados ao login
  res.clearCookie('usuarioLogado', {
    sameSite: 'None',
    secure: true,
    httpOnly: true,
    path: '/',
  });

  res.clearCookie('tipoUsuario', {
    sameSite: 'None',
    secure: true,
    httpOnly: true,
    path: '/',
  });

  console.log("Cookies de autenticação removidos com sucesso");

  // Envia resposta simples para o frontend
  return res.json({ status: 'deslogado' });
};


exports.criarPessoa = async (req, res) => {
  //  console.log('Criando pessoa com dados:', req.body);
  try {
    const { id_pessoa, nome, email, senha, primeiro_acesso_pessoa = true, data_nascimento } = req.body;

    // Validação básica
    if (!nome || !email || !senha) {
      return res.status(400).json({
        error: 'Nome, email e senha são obrigatórios'
      });
    }

    // Validação de email básica
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Formato de email inválido'
      });
    }

    const result = await db.query(
      'INSERT INTO pessoa (id_pessoa, nome, email, senha, primeiro_acesso_pessoa, data_nascimento) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id_pessoa, nome, email, senha, primeiro_acesso_pessoa, data_nascimento]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pessoa:', error);

    // Verifica se é erro de email duplicado (constraint unique violation)
    if (error.code === '23505' && error.constraint === 'pessoa_email_key') {
      return res.status(400).json({
        error: 'Email já está em uso'
      });
    }

    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.obterPessoa = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'loginController-obterPessoa - ID deve ser um número válido' });
    }

    const result = await db.query(
      'SELECT * FROM pessoa WHERE id_pessoa = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pessoa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};


// Função adicional para buscar pessoa por email
exports.obterPessoaPorEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const result = await db.query(
      'SELECT * FROM pessoa WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pessoa por email:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Função para atualizar apenas a senha
exports.atualizarSenha = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { senha_atual, nova_senha } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    if (!senha_atual || !nova_senha) {
      return res.status(400).json({
        error: 'Senha atual e nova senha são obrigatórias'
      });
    }

    // Verifica se a pessoa existe e a senha atual está correta
    const personResult = await db.query(
      'SELECT * FROM pessoa WHERE id_pessoa = $1',
      [id]
    );

    if (personResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    const person = personResult.rows[0];

    // Verificação básica da senha atual (em produção, use hash)
    if (person.senha !== senha_atual) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }

    // Atualiza apenas a senha
    const updateResult = await db.query(
      'UPDATE pessoa SET senha = $1 WHERE id_pessoa = $2 RETURNING id_pessoa, nome, email, primeiro_acesso_pessoa, data_nascimento',
      [nova_senha, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

