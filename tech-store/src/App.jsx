
import { useState } from 'react'
import './App.css'
import Admin from './Admin'
import Login from './Login'

const produtos = [
  {
    id: 1,
    nome: 'Notebook Lenovo IdeaPad',
    categoria: 'Computadores',
    preco: 3299.90,
    imagem: '💻',
    descricao: 'Alto desempenho para trabalho e estudos'
  },
  {
    id: 2,
    nome: 'Smartphone Samsung Galaxy',
    categoria: 'Smartphones',
    preco: 2199.90,
    imagem: '📱',
    descricao: 'Tecnologia e qualidade em suas mãos'
  },
  {
    id: 3,
    nome: 'Headphone Bluetooth',
    categoria: 'Áudio',
    preco: 399.90,
    imagem: '🎧',
    descricao: 'Som imersivo e conforto'
  },
  {
    id: 4,
    nome: 'Mouse Gamer RGB',
    categoria: 'Periféricos',
    preco: 189.90,
    imagem: '🖱️',
    descricao: 'Precisão para suas partidas'
  }
]

const categorias = [
  'Todas',
  'Computadores',
  'Smartphones',
  'Áudio',
  'Periféricos'
]

function App() {
  const [carrinho, setCarrinho] = useState([])
  const [carrinhoAberto, setCarrinhoAberto] = useState(false)
  const [pesquisa, setPesquisa] = useState('')
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todas')
  const [painelAdmin, setPainelAdmin] = useState(false)

  // Controle da autenticação administrativa
  const [token, setToken] = useState(
    () => sessionStorage.getItem('techstore_admin_token') || ''
  )

  function entrarAdmin(novoToken) {
    sessionStorage.setItem('techstore_admin_token', novoToken)
    setToken(novoToken)
  }

  function sairAdmin() {
    sessionStorage.removeItem('techstore_admin_token')
    setToken('')
    setPainelAdmin(false)
  }

  // Acesso administrativo com autenticação
  if (painelAdmin) {
    if (token) {
      return (
        <Admin
          token={token}
          onVoltar={sairAdmin}
        />
      )
    }

    return (
      <Login
        onLogin={entrarAdmin}
        onVoltar={() => setPainelAdmin(false)}
      />
    )
  }

  function adicionarAoCarrinho(produto) {
    setCarrinho((atual) => {
      const existe = atual.find((item) => item.id === produto.id)

      if (existe) {
        return atual.map((item) =>
          item.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        )
      }

      return [...atual, { ...produto, quantidade: 1 }]
    })
  }

  function alterarQuantidade(id, variacao) {
    setCarrinho((atual) =>
      atual
        .map((item) =>
          item.id === id
            ? { ...item, quantidade: item.quantidade + variacao }
            : item
        )
        .filter((item) => item.quantidade > 0)
    )
  }

  function removerProduto(id) {
    setCarrinho((atual) =>
      atual.filter((item) => item.id !== id)
    )
  }

  const quantidadeTotal = carrinho.reduce(
    (total, item) => total + item.quantidade,
    0
  )

  const valorTotal = carrinho.reduce(
    (total, item) => total + item.preco * item.quantidade,
    0
  )

  // Pesquisa por nome, categoria ou descrição
  const produtosFiltrados = produtos.filter((produto) => {
    const termo = pesquisa.toLowerCase().trim()

    const correspondePesquisa =
      produto.nome.toLowerCase().includes(termo) ||
      produto.categoria.toLowerCase().includes(termo) ||
      produto.descricao.toLowerCase().includes(termo)

    const correspondeCategoria =
      categoriaSelecionada === 'Todas' ||
      produto.categoria === categoriaSelecionada

    return correspondePesquisa && correspondeCategoria
  })

  const formatarPreco = (valor) =>
    valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })

  return (
    <div className="app">

      {/* CABEÇALHO */}
      <header className="topo">
        <div className="container topo-conteudo">

          <a className="logo" href="#">
            TECH<span>STORE</span>
            <small>TECNOLOGIA AO SEU ALCANCE</small>
          </a>

          <div className="pesquisa">
            <input
              type="text"
              placeholder="O que você está procurando?"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />
            <button aria-label="Pesquisar">⌕</button>
          </div>

          <div className="acoes">

            <button
              className="conta"
              onClick={() => setPainelAdmin(true)}
            >
              ⚙ Painel administrativo
            </button>

            <button
              className="carrinho"
              onClick={() => setCarrinhoAberto(!carrinhoAberto)}
            >
              🛒 Carrinho <span>{quantidadeTotal}</span>
            </button>

          </div>

        </div>
      </header>

      {/* CARRINHO */}
      {carrinhoAberto && (
        <section className="container painel-carrinho">

          <div className="carrinho-titulo">
            <h2>Meu carrinho</h2>
            <button onClick={() => setCarrinhoAberto(false)}>
              ✕
            </button>
          </div>

          {carrinho.length === 0 ? (
            <p>Seu carrinho está vazio.</p>
          ) : (
            <>
              {carrinho.map((item) => (
                <div className="item-carrinho" key={item.id}>

                  <span className="item-emoji">
                    {item.imagem}
                  </span>

                  <div className="item-detalhes">
                    <strong>{item.nome}</strong>
                    <small>{formatarPreco(item.preco)}</small>

                    <div className="quantidade-controle">
                      <button
                        onClick={() => alterarQuantidade(item.id, -1)}
                      >
                        −
                      </button>

                      <span>{item.quantidade}</span>

                      <button
                        onClick={() => alterarQuantidade(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    className="remover-item"
                    onClick={() => removerProduto(item.id)}
                  >
                    Remover
                  </button>

                </div>
              ))}

              <div className="carrinho-total">
                <strong>
                  Total: {formatarPreco(valorTotal)}
                </strong>
              </div>
            </>
          )}

        </section>
      )}

      {/* MENU */}
      <nav className="menu">
        <div className="container menu-conteudo">
          <a href="#">Início</a>
          <a href="#produtos">Computadores</a>
          <a href="#produtos">Smartphones</a>
          <a href="#produtos">Áudio</a>
          <a href="#produtos">Periféricos</a>
          <a href="#produtos">Acessórios</a>
          <a href="#produtos">Games</a>
        </div>
      </nav>

      <main>

        {/* BANNER */}
        <section className="container banner">

          <div className="banner-texto">
            <span className="etiqueta">
              TECNOLOGIA E INOVAÇÃO
            </span>

            <h1>
              O futuro da tecnologia está aqui.
            </h1>

            <p>
              Encontre os melhores produtos para transformar seu dia a dia.
            </p>

            <a href="#produtos" className="botao-principal">
              Explorar produtos →
            </a>
          </div>

          <div className="banner-visual" aria-hidden="true">
            <div className="circulo">⌁</div>
            <span>💻</span>
            <span>🎧</span>
            <span>📱</span>
          </div>

        </section>

        {/* BENEFÍCIOS */}
        <section className="container beneficios">

          <div>
            🚚
            <span>
              <strong>Entrega segura</strong>
              <small>Receba em sua casa</small>
            </span>
          </div>

          <div>
            🔒
            <span>
              <strong>Compra protegida</strong>
              <small>Seus dados seguros</small>
            </span>
          </div>

          <div>
            💳
            <span>
              <strong>Pagamento facilitado</strong>
              <small>Praticidade para comprar</small>
            </span>
          </div>

          <div>
            ⭐
            <span>
              <strong>Qualidade garantida</strong>
              <small>Produtos selecionados</small>
            </span>
          </div>

        </section>

        {/* PRODUTOS */}
        <section className="container produtos" id="produtos">

          <div className="secao-cabecalho">
            <div>
              <span className="etiqueta">
                NOSSA SELEÇÃO
              </span>

              <h2>Produtos em destaque</h2>

              <p>
                Encontre tecnologia para todos os momentos.
              </p>
            </div>

            <a href="#produtos">
              Ver todos →
            </a>
          </div>

          {/* FILTROS */}
          <div className="filtros-categorias">
            {categorias.map((categoria) => (
              <button
                key={categoria}
                className={
                  categoriaSelecionada === categoria
                    ? 'filtro ativo'
                    : 'filtro'
                }
                onClick={() => setCategoriaSelecionada(categoria)}
              >
                {categoria}
              </button>
            ))}
          </div>

          {/* LISTAGEM */}
          <div className="produtos-grid">

            {produtosFiltrados.map((produto) => (
              <article className="produto-card" key={produto.id}>

                <div className="produto-imagem">
                  {produto.imagem}
                </div>

                <div className="produto-info">

                  <span className="produto-categoria">
                    {produto.categoria}
                  </span>

                  <h3>{produto.nome}</h3>

                  <p>{produto.descricao}</p>

                  <strong className="preco">
                    {formatarPreco(produto.preco)}
                  </strong>

                  <button
                    className="botao-comprar"
                    onClick={() => adicionarAoCarrinho(produto)}
                  >
                    Adicionar ao carrinho
                  </button>

                </div>

              </article>
            ))}

            {/* NENHUM RESULTADO */}
            {produtosFiltrados.length === 0 && (
              <p className="sem-produtos">
                Nenhum produto encontrado.
                Tente outra pesquisa ou categoria.
              </p>
            )}

          </div>

        </section>

      </main>

      {/* RODAPÉ */}
      <footer>
        <div className="container rodape">

          <a className="logo" href="#">
            TECH<span>STORE</span>
          </a>

          <p>
            © 2026 TECH STORE. Tecnologia ao seu alcance.
          </p>

        </div>
      </footer>

    </div>
  )
}

export default App
