
const express = require('express');

const {
  gerarToken,
  validarCredenciais
} = require('../middleware/auth');

const router = express.Router();

// Login do administrador
router.post('/login', (req, res) => {
  try {
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
      return res.status(400).json({
        erro: 'Informe o usuário e a senha.'
      });
    }

    if (!validarCredenciais(usuario, senha)) {
      return res.status(401).json({
        erro: 'Usuário ou senha incorretos.'
      });
    }

    const token = gerarToken(usuario);

    return res.json({
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario
    });

  } catch (erro) {
    return res.status(500).json({
      erro: 'Erro ao realizar login.'
    });
  }
});

module.exports = router;
