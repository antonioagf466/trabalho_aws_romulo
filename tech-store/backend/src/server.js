
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const {
  inicializarBanco,
  getDb
} = require('./config/db');

const produtosRoutes = require('./routes/produtos');
const estoqueRoutes = require('./routes/estoque');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Rota principal
app.get('/', (req, res) => {
  res.json({
    mensagem: 'API Tech Store funcionando!',
    status: 'online'
  });
});

// Verificar servidor e banco
app.get('/api/status', (req, res) => {
  try {
    const db = getDb();

    const resultado = db.exec(
      'SELECT COUNT(*) AS total FROM categorias'
    );

    const totalCategorias = resultado.length
      ? resultado[0].values[0][0]
      : 0;

    res.json({
      servidor: 'online',
      banco: 'conectado',
      totalCategorias
    });

  } catch (erro) {
    res.status(500).json({
      erro: erro.message
    });
  }
});

// Autenticação do administrador
app.use('/api/auth', authRoutes);

// Estoque: todas as rotas exigem autenticação
app.use('/api/estoque', estoqueRoutes);

// Produtos: consultas públicas e cadastro protegido
app.use('/api/produtos', produtosRoutes);

// Compatibilidade com rotas antigas
app.use('/api', produtosRoutes);

// Inicializar servidor
async function iniciarServidor() {
  try {
    if (!process.env.ADMIN_USER ||
        !process.env.ADMIN_PASSWORD ||
        !process.env.JWT_SECRET) {
      throw new Error(
        'Configure ADMIN_USER, ADMIN_PASSWORD e JWT_SECRET no arquivo .env.'
      );
    }

    await inicializarBanco();

    app.listen(PORT, () => {
      console.log('-----------------------------------');
      console.log('TECH STORE - BACKEND');
      console.log('-----------------------------------');
      console.log(`API rodando em http://localhost:${PORT}`);
      console.log('Banco de dados conectado.');
      console.log('Autenticação administrativa configurada.');
      console.log('-----------------------------------');
    });

  } catch (erro) {
    console.error('Erro ao iniciar servidor:', erro.message);
    process.exit(1);
  }
}

iniciarServidor();



