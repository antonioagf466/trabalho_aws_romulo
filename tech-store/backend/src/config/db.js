
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../../tech_store.db');

let db;

async function inicializarBanco() {
  const SQL = await initSqlJs({
    locateFile: (file) =>
      path.resolve(__dirname, '../../node_modules/sql.js/dist', file)
  });

  if (fs.existsSync(DB_PATH)) {
    const arquivo = fs.readFileSync(DB_PATH);
    db = new SQL.Database(arquivo);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON;');

  db.run(`
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT,
      marca TEXT,
      modelo TEXT,
      categoria_id INTEGER,
      sku TEXT UNIQUE,
      preco_compra REAL DEFAULT 0,
      preco_venda REAL NOT NULL DEFAULT 0,
      estoque_atual INTEGER NOT NULL DEFAULT 0,
      estoque_minimo INTEGER NOT NULL DEFAULT 0,
      imagem_url TEXT,
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    );

    CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER NOT NULL,
      tipo TEXT NOT NULL CHECK (
        tipo IN ('ENTRADA', 'SAIDA', 'AJUSTE')
      ),
      quantidade INTEGER NOT NULL,
      saldo_anterior INTEGER NOT NULL,
      saldo_posterior INTEGER NOT NULL,
      observacao TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (produto_id) REFERENCES produtos(id)
    );
  `);

  const categorias = [
    'Computadores',
    'Smartphones',
    'Áudio',
    'Periféricos'
  ];

  for (const nome of categorias) {
    db.run(
      'INSERT OR IGNORE INTO categorias (nome) VALUES (?)',
      [nome]
    );
  }

  salvarBanco();

  console.log('Banco de dados Tech Store inicializado!');
}

function getDb() {
  if (!db) {
    throw new Error('O banco de dados ainda não foi inicializado.');
  }

  return db;
}

function salvarBanco() {
  if (!db) return;

  const dados = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(dados));
}

module.exports = {
  inicializarBanco,
  getDb,
  salvarBanco
};
