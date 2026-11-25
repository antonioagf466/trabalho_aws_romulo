
const express = require('express');
const router = express.Router();

const { getDb, salvarBanco } = require('../config/db');

function consultar(sql, parametros = []) {
  const db = getDb();
  const stmt = db.prepare(sql);

  try {
    stmt.bind(parametros);

    const resultados = [];

    while (stmt.step()) {
      resultados.push(stmt.getAsObject());
    }

    return resultados;
  } finally {
    stmt.free();
  }
}

// Listar categorias
router.get('/categorias', (req, res) => {
  try {
    const categorias = consultar(
      'SELECT * FROM categorias ORDER BY nome'
    );

    res.json(categorias);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// Listar produtos
router.get('/', (req, res) => {
  try {
    const produtos = consultar(`
      SELECT
        p.*,
        c.nome AS categoria
      FROM produtos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      WHERE p.ativo = 1
      ORDER BY p.id DESC
    `);

    res.json(produtos);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// Consultar um produto
router.get('/:id', (req, res) => {
  try {
    const produtos = consultar(`
      SELECT
        p.*,
        c.nome AS categoria
      FROM produtos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      WHERE p.id = ? AND p.ativo = 1
    `, [Number(req.params.id)]);

    if (produtos.length === 0) {
      return res.status(404).json({
        erro: 'Produto não encontrado.'
      });
    }

    res.json(produtos[0]);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// Cadastrar produto
router.post('/', (req, res) => {
  try {
    const db = getDb();

    const {
      nome,
      descricao,
      marca,
      modelo,
      categoria_id,
      sku,
      preco_compra,
      preco_venda,
      estoque_minimo,
      imagem_url
    } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({
        erro: 'O nome do produto é obrigatório.'
      });
    }

    const precoVenda = Number(preco_venda);
    const precoCompra = Number(preco_compra ?? 0);
    const estoqueMinimo = Number(estoque_minimo ?? 0);

    if (!Number.isFinite(precoVenda) || precoVenda < 0) {
      return res.status(400).json({
        erro: 'Informe um preço de venda válido.'
      });
    }

    if (!Number.isFinite(precoCompra) || precoCompra < 0) {
      return res.status(400).json({
        erro: 'Informe um preço de compra válido.'
      });
    }

    if (!Number.isInteger(estoqueMinimo) || estoqueMinimo < 0) {
      return res.status(400).json({
        erro: 'O estoque mínimo deve ser um número inteiro não negativo.'
      });
    }

    db.run(`
      INSERT INTO produtos (
        nome,
        descricao,
        marca,
        modelo,
        categoria_id,
        sku,
        preco_compra,
        preco_venda,
        estoque_atual,
        estoque_minimo,
        imagem_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `, [
      nome.trim(),
      descricao || null,
      marca || null,
      modelo || null,
      categoria_id ? Number(categoria_id) : null,
      sku?.trim() || null,
      precoCompra,
      precoVenda,
      estoqueMinimo,
      imagem_url || null
    ]);

    const resultado = consultar(
      'SELECT last_insert_rowid() AS id'
    );

    salvarBanco();

    res.status(201).json({
      mensagem: 'Produto cadastrado com sucesso!',
      id: resultado[0].id
    });
  } catch (erro) {
    if (erro.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        erro: 'Já existe um produto cadastrado com esse SKU.'
      });
    }

    res.status(500).json({ erro: erro.message });
  }
});

module.exports = router;
