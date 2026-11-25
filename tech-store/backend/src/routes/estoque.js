
const express = require('express');

const {
  getDb,
  salvarBanco
} = require('../config/db');

const { verificarToken } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de estoque exigem autenticação
router.use(verificarToken);

// Consultar estoque de todos os produtos
router.get('/', (req, res) => {
  try {
    const db = getDb();

    const resultado = db.exec(`
      SELECT
        p.id,
        p.nome,
        p.sku,
        p.estoque_atual,
        p.estoque_minimo,
        p.preco_venda,
        c.nome AS categoria
      FROM produtos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      WHERE p.ativo = 1
      ORDER BY p.nome
    `);

    const produtos = resultado.length
      ? resultado[0].values.map(linha => {
          const colunas = resultado[0].columns;

          return Object.fromEntries(
            colunas.map((coluna, i) => [coluna, linha[i]])
          );
        })
      : [];

    res.json(produtos);

  } catch (erro) {
    res.status(500).json({
      erro: erro.message
    });
  }
});

// Consultar histórico de movimentações
router.get('/movimentacoes', (req, res) => {
  try {
    const db = getDb();

    const resultado = db.exec(`
      SELECT
        m.id,
        m.produto_id,
        p.nome AS produto,
        m.tipo,
        m.quantidade,
        m.saldo_anterior,
        m.saldo_posterior,
        m.observacao,
        m.created_at
      FROM movimentacoes_estoque m
      INNER JOIN produtos p ON p.id = m.produto_id
      ORDER BY m.id DESC
    `);

    const movimentacoes = resultado.length
      ? resultado[0].values.map(linha => {
          const colunas = resultado[0].columns;

          return Object.fromEntries(
            colunas.map((coluna, i) => [coluna, linha[i]])
          );
        })
      : [];

    res.json(movimentacoes);

  } catch (erro) {
    res.status(500).json({
      erro: erro.message
    });
  }
});

// Registrar movimentação de estoque
router.post('/:produtoId/movimentacoes', (req, res) => {
  try {
    const db = getDb();

    const produtoId = Number(req.params.produtoId);
    const { tipo, quantidade, observacao } = req.body;

    if (!Number.isInteger(produtoId) || produtoId <= 0) {
      return res.status(400).json({
        erro: 'ID do produto inválido.'
      });
    }

    if (!['ENTRADA', 'SAIDA', 'AJUSTE'].includes(tipo)) {
      return res.status(400).json({
        erro: 'Tipo deve ser ENTRADA, SAIDA ou AJUSTE.'
      });
    }

    if (!Number.isInteger(quantidade) || quantidade < 0) {
      return res.status(400).json({
        erro: 'Informe uma quantidade inteira válida.'
      });
    }

    const consulta = db.exec(
      'SELECT id, estoque_atual FROM produtos WHERE id = ? AND ativo = 1',
      [produtoId]
    );

    if (!consulta.length || !consulta[0].values.length) {
      return res.status(404).json({
        erro: 'Produto não encontrado.'
      });
    }

    const saldoAnterior = consulta[0].values[0][1];
    let saldoPosterior = saldoAnterior;

    if (tipo === 'ENTRADA') {
      if (quantidade === 0) {
        return res.status(400).json({
          erro: 'A entrada deve ser maior que zero.'
        });
      }

      saldoPosterior += quantidade;
    }

    if (tipo === 'SAIDA') {
      if (quantidade === 0) {
        return res.status(400).json({
          erro: 'A saída deve ser maior que zero.'
        });
      }

      if (quantidade > saldoAnterior) {
        return res.status(400).json({
          erro: 'Estoque insuficiente.'
        });
      }

      saldoPosterior -= quantidade;
    }

    if (tipo === 'AJUSTE') {
      saldoPosterior = quantidade;
    }

    const quantidadeMovimentada =
      tipo === 'AJUSTE'
        ? Math.abs(saldoPosterior - saldoAnterior)
        : quantidade;

    db.run(
      `UPDATE produtos
       SET estoque_atual = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [saldoPosterior, produtoId]
    );

    db.run(`
      INSERT INTO movimentacoes_estoque (
        produto_id,
        tipo,
        quantidade,
        saldo_anterior,
        saldo_posterior,
        observacao
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      produtoId,
      tipo,
      quantidadeMovimentada,
      saldoAnterior,
      saldoPosterior,
      observacao || null
    ]);

    salvarBanco();

    res.status(201).json({
      mensagem: 'Movimentação registrada com sucesso!',
      produtoId,
      tipo,
      saldoAnterior,
      saldoPosterior
    });

  } catch (erro) {
    res.status(500).json({
      erro: erro.message
    });
  }
});

module.exports = router;


