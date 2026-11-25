
import { useEffect, useState } from 'react'
import './Admin.css'

const API = 'http://localhost:3001'

function Admin({ onVoltar, token }) {
  const [aba, setAba] = useState('dashboard')
  const [produtos, setProdutos] = useState([])
  const [estoque, setEstoque] = useState([])
  const [movimentacoes, setMovimentacoes] = useState([])
  const [categorias, setCategorias] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  const [novoProduto, setNovoProduto] = useState({
    nome: '',
    descricao: '',
    marca: '',
    modelo: '',
    categoria_id: '',
    sku: '',
    preco_compra: '0',
    preco_venda: '',
    estoque_minimo: '2',
    imagem_url: ''
  })

  const [movimento, setMovimento] = useState({
    produto_id: '',
    tipo: 'ENTRADA',
    quantidade: '',
    observacao: ''
  })

  // Requisição autenticada ao backend
  async function requisicao(url, opcoes = {}) {
    const resposta = await fetch(`${API}${url}`, {
      ...opcoes,
      headers: {
        'Content-Type': 'application/json',
        ...opcoes.headers,
        Authorization: `Bearer ${token}`
      }
    })

    const dados = await resposta.json().catch(() => ({}))

    // Sessão inválida ou expirada
    if (resposta.status === 401) {
      onVoltar()
      throw new Error('Sua sessão expirou. Faça login novamente.')
    }

    if (!resposta.ok) {
      throw new Error(
        dados.erro || dados.mensagem || 'Erro na operação.'
      )
    }

    return dados
  }

  function lista(dados) {
    if (Array.isArray(dados)) return dados
    if (Array.isArray(dados.value)) return dados.value
    return []
  }

  async function carregarDados() {
    try {
      setCarregando(true)
      setErro('')

      const [p, e, m, c] = await Promise.all([
        requisicao('/api/produtos'),
        requisicao('/api/estoque'),
        requisicao('/api/estoque/movimentacoes'),
        requisicao('/api/categorias')
      ])

      setProdutos(lista(p))
      setEstoque(lista(e))
      setMovimentacoes(lista(m))
      setCategorias(lista(c))

    } catch (error) {
      setErro(error.message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  async function cadastrarProduto(evento) {
    evento.preventDefault()
    setMensagem('')
    setErro('')

    try {
      const dados = {
        ...novoProduto,
        categoria_id: Number(novoProduto.categoria_id),
        preco_compra: Number(novoProduto.preco_compra),
        preco_venda: Number(novoProduto.preco_venda),
        estoque_minimo: Number(novoProduto.estoque_minimo)
      }

      await requisicao('/api/produtos', {
        method: 'POST',
        body: JSON.stringify(dados)
      })

      setMensagem(
        'Produto cadastrado com sucesso! Estoque inicial: zero.'
      )

      setNovoProduto({
        nome: '',
        descricao: '',
        marca: '',
        modelo: '',
        categoria_id: '',
        sku: '',
        preco_compra: '0',
        preco_venda: '',
        estoque_minimo: '2',
        imagem_url: ''
      })

      await carregarDados()

    } catch (error) {
      setErro(error.message)
    }
  }

  async function registrarMovimento(evento) {
    evento.preventDefault()
    setMensagem('')
    setErro('')

    try {
      await requisicao(
        `/api/estoque/${movimento.produto_id}/movimentacoes`,
        {
          method: 'POST',
          body: JSON.stringify({
            tipo: movimento.tipo,
            quantidade: Number(movimento.quantidade),
            observacao: movimento.observacao
          })
        }
      )

      setMensagem('Movimentação registrada com sucesso!')

      setMovimento({
        produto_id: '',
        tipo: 'ENTRADA',
        quantidade: '',
        observacao: ''
      })

      await carregarDados()

    } catch (error) {
      setErro(error.message)
    }
  }

  const totalUnidades = estoque.reduce(
    (total, produto) =>
      total + Number(produto.estoque_atual || 0),
    0
  )

  const estoqueBaixo = estoque.filter(
    (produto) =>
      Number(produto.estoque_atual) <=
      Number(produto.estoque_minimo)
  ).length

  const formatarPreco = (valor) =>
    Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })

  const formatarData = (data) => {
    if (!data) return '-'

    const convertida = new Date(data.replace(' ', 'T'))

    return Number.isNaN(convertida.getTime())
      ? data
      : convertida.toLocaleString('pt-BR')
  }

  const menu = [
    { id: 'dashboard', nome: 'Dashboard', icone: '▦' },
    { id: 'produtos', nome: 'Produtos', icone: '□' },
    { id: 'estoque', nome: 'Estoque', icone: '▤' },
    { id: 'movimentacoes', nome: 'Movimentações', icone: '↔' }
  ]

  return (
    <div className="admin-layout">

      <aside className="admin-sidebar">

        <a
          className="admin-logo"
          href="#"
          onClick={(e) => e.preventDefault()}
        >
          TECH<span>STORE</span>
          <small>PAINEL ADMINISTRATIVO</small>
        </a>

        <div className="admin-menu-titulo">
          MENU PRINCIPAL
        </div>

        {menu.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`admin-menu-item ${
              aba === item.id ? 'ativo' : ''
            }`}
            onClick={() => {
              setAba(item.id)
              setMensagem('')
              setErro('')
            }}
          >
            <span>{item.icone}</span>
            {item.nome}
          </button>
        ))}

        <div className="admin-sidebar-rodape">
          <button
            className="admin-voltar"
            onClick={onVoltar}
          >
            ← Sair do painel
          </button>
        </div>

      </aside>

      <main className="admin-main">

        <header className="admin-header">

          <div>
            <span className="admin-breadcrumb">
              Administração / {menu.find(
                (item) => item.id === aba
              )?.nome}
            </span>

            <h1>
              {menu.find((item) => item.id === aba)?.nome}
            </h1>

            <p>Gerencie sua loja TECH STORE.</p>
          </div>

          <button
            className="admin-atualizar"
            onClick={carregarDados}
          >
            ↻ Atualizar dados
          </button>

        </header>

        {mensagem && (
          <div className="admin-sucesso">
            {mensagem}
          </div>
        )}

        {erro && (
          <div className="admin-erro">
            {erro}
            <button onClick={carregarDados}>
              Tentar novamente
            </button>
          </div>
        )}

        {carregando ? (
          <div className="admin-mensagem">
            Carregando informações...
          </div>
        ) : (
          <>

            {/* DASHBOARD */}
            {aba === 'dashboard' && (
              <>

                <section className="admin-indicadores">

                  <article className="admin-card">
                    <div className="admin-card-topo">
                      <span>Produtos cadastrados</span>
                      <span className="admin-icone azul">□</span>
                    </div>
                    <strong>{produtos.length}</strong>
                    <small>Produtos ativos no catálogo</small>
                  </article>

                  <article className="admin-card">
                    <div className="admin-card-topo">
                      <span>Unidades em estoque</span>
                      <span className="admin-icone verde">▣</span>
                    </div>
                    <strong>{totalUnidades}</strong>
                    <small>Total de unidades disponíveis</small>
                  </article>

                  <article className="admin-card">
                    <div className="admin-card-topo">
                      <span>Estoque baixo</span>
                      <span className="admin-icone amarelo">!</span>
                    </div>
                    <strong>{estoqueBaixo}</strong>
                    <small>Produtos no mínimo ou abaixo dele</small>
                  </article>

                  <article className="admin-card">
                    <div className="admin-card-topo">
                      <span>Movimentações</span>
                      <span className="admin-icone roxo">↔</span>
                    </div>
                    <strong>{movimentacoes.length}</strong>
                    <small>Registros no histórico</small>
                  </article>

                </section>

                <section className="admin-painel">
                  <h2>Posição do estoque</h2>
                  <p>Quantidade disponível por produto</p>
                  <TabelaEstoque estoque={estoque} />
                </section>

                <section className="admin-painel">
                  <h2>Movimentações recentes</h2>
                  <p>Últimas operações registradas</p>

                  <TabelaMovimentacoes
                    movimentacoes={movimentacoes.slice(0, 5)}
                    formatarData={formatarData}
                  />
                </section>

              </>
            )}

            {/* PRODUTOS */}
            {aba === 'produtos' && (
              <>

                <section className="admin-painel">

                  <h2>Cadastrar produto</h2>
                  <p>Preencha os dados do novo produto</p>

                  <form
                    className="admin-formulario"
                    onSubmit={cadastrarProduto}
                  >

                    <label>
                      Nome *
                      <input
                        name="nome"
                        value={novoProduto.nome}
                        onChange={(e) =>
                          setNovoProduto({
                            ...novoProduto,
                            nome: e.target.value
                          })
                        }
                        required
                      />
                    </label>

                    <label>
                      SKU *
                      <input
                        name="sku"
                        value={novoProduto.sku}
                        onChange={(e) =>
                          setNovoProduto({
                            ...novoProduto,
                            sku: e.target.value
                          })
                        }
                        required
                      />
                    </label>

                    <label>
                      Marca
                      <input
                        value={novoProduto.marca}
                        onChange={(e) =>
                          setNovoProduto({
                            ...novoProduto,
                            marca: e.target.value
                          })
                        }
                      />
                    </label>

                    <label>
                      Modelo
                      <input
                        value={novoProduto.modelo}
                        onChange={(e) =>
                          setNovoProduto({
                            ...novoProduto,
                            modelo: e.target.value
                          })
                        }
                      />
                    </label>

                    <label>
                      Categoria *
                      <select
                        value={novoProduto.categoria_id}
                        onChange={(e) =>
                          setNovoProduto({
                            ...novoProduto,
                            categoria_id: e.target.value
                          })
                        }
                        required
                      >
                        <option value="">Selecione</option>

                        {categorias.map((categoria) => (
                          <option
                            key={categoria.id}
                            value={categoria.id}
                          >
                            {categoria.nome}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Preço de compra
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={novoProduto.preco_compra}
                        onChange={(e) =>
                          setNovoProduto({
                            ...novoProduto,
                            preco_compra: e.target.value
                          })
                        }
                      />
                    </label>

                    <label>
                      Preço de venda *
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={novoProduto.preco_venda}
                        onChange={(e) =>
                          setNovoProduto({
                            ...novoProduto,
                            preco_venda: e.target.value
                          })
                        }
                        required
                      />
                    </label>

                    <label>
                      Estoque mínimo
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={novoProduto.estoque_minimo}
                        onChange={(e) =>
                          setNovoProduto({
                            ...novoProduto,
                            estoque_minimo: e.target.value
                          })
                        }
                      />
                    </label>

                    <label className="admin-campo-completo">
                      Descrição
                      <textarea
                        value={novoProduto.descricao}
                        onChange={(e) =>
                          setNovoProduto({
                            ...novoProduto,
                            descricao: e.target.value
                          })
                        }
                      />
                    </label>

                    <label className="admin-campo-completo">
                      URL da imagem
                      <input
                        value={novoProduto.imagem_url}
                        onChange={(e) =>
                          setNovoProduto({
                            ...novoProduto,
                            imagem_url: e.target.value
                          })
                        }
                      />
                    </label>

                    <p className="admin-aviso admin-campo-completo">
                      O produto será cadastrado com estoque inicial zero.
                      Utilize a seção Estoque para adicionar unidades.
                    </p>

                    <button
                      className="admin-botao-principal admin-campo-completo"
                      type="submit"
                    >
                      + Cadastrar produto
                    </button>

                  </form>

                </section>

                <section className="admin-painel">

                  <h2>Produtos cadastrados</h2>
                  <p>{produtos.length} produtos no catálogo</p>

                  <div className="admin-tabela-scroll">
                    <table className="admin-tabela">

                      <thead>
                        <tr>
                          <th>Produto</th>
                          <th>SKU</th>
                          <th>Marca</th>
                          <th>Categoria</th>
                          <th>Preço</th>
                        </tr>
                      </thead>

                      <tbody>
                        {produtos.map((produto) => (
                          <tr key={produto.id}>
                            <td>
                              <strong>{produto.nome}</strong>
                            </td>
                            <td>{produto.sku}</td>
                            <td>{produto.marca}</td>
                            <td>{produto.categoria}</td>
                            <td>
                              {formatarPreco(produto.preco_venda)}
                            </td>
                          </tr>
                        ))}
                      </tbody>

                    </table>
                  </div>

                </section>

              </>
            )}

            {/* ESTOQUE */}
            {aba === 'estoque' && (
              <>

                <section className="admin-painel">

                  <h2>Registrar movimentação</h2>
                  <p>
                    Registre entradas, saídas ou ajustes de quantidade
                  </p>

                  <form
                    className="admin-formulario"
                    onSubmit={registrarMovimento}
                  >

                    <label className="admin-campo-completo">
                      Produto *

                      <select
                        value={movimento.produto_id}
                        onChange={(e) =>
                          setMovimento({
                            ...movimento,
                            produto_id: e.target.value
                          })
                        }
                        required
                      >
                        <option value="">Selecione um produto</option>

                        {estoque.map((produto) => (
                          <option
                            key={produto.id}
                            value={produto.id}
                          >
                            {produto.nome} — Estoque: {produto.estoque_atual}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Operação

                      <select
                        value={movimento.tipo}
                        onChange={(e) =>
                          setMovimento({
                            ...movimento,
                            tipo: e.target.value
                          })
                        }
                      >
                        <option value="ENTRADA">Entrada</option>
                        <option value="SAIDA">Saída</option>
                        <option value="AJUSTE">Ajuste</option>
                      </select>
                    </label>

                    <label>
                      Quantidade *

                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={movimento.quantidade}
                        onChange={(e) =>
                          setMovimento({
                            ...movimento,
                            quantidade: e.target.value
                          })
                        }
                        required
                      />

                      <small>
                        No ajuste, informe o saldo final desejado.
                      </small>
                    </label>

                    <label className="admin-campo-completo">
                      Observação

                      <textarea
                        value={movimento.observacao}
                        onChange={(e) =>
                          setMovimento({
                            ...movimento,
                            observacao: e.target.value
                          })
                        }
                      />
                    </label>

                    <button
                      className="admin-botao-principal admin-campo-completo"
                      type="submit"
                    >
                      Registrar movimentação
                    </button>

                  </form>

                </section>

                <section className="admin-painel">
                  <h2>Estoque atual</h2>
                  <p>Quantidade disponível por produto</p>
                  <TabelaEstoque estoque={estoque} />
                </section>

              </>
            )}

            {/* MOVIMENTAÇÕES */}
            {aba === 'movimentacoes' && (
              <section className="admin-painel">

                <h2>Histórico de movimentações</h2>
                <p>
                  {movimentacoes.length} operações registradas
                </p>

                <TabelaMovimentacoes
                  movimentacoes={movimentacoes}
                  formatarData={formatarData}
                />

              </section>
            )}

          </>
        )}

      </main>
    </div>
  )
}

function TabelaEstoque({ estoque }) {
  return (
    <div className="admin-tabela-scroll">

      <table className="admin-tabela">

        <thead>
          <tr>
            <th>Produto</th>
            <th>SKU</th>
            <th>Categoria</th>
            <th>Estoque atual</th>
            <th>Estoque mínimo</th>
            <th>Situação</th>
          </tr>
        </thead>

        <tbody>
          {estoque.map((produto) => {
            const baixo =
              Number(produto.estoque_atual) <=
              Number(produto.estoque_minimo)

            return (
              <tr key={produto.id}>

                <td>
                  <strong>{produto.nome}</strong>
                </td>

                <td>{produto.sku}</td>
                <td>{produto.categoria}</td>
                <td>{produto.estoque_atual}</td>
                <td>{produto.estoque_minimo}</td>

                <td>
                  <span
                    className={`admin-status ${
                      baixo ? 'baixo' : 'normal'
                    }`}
                  >
                    {baixo ? 'Estoque baixo' : 'Normal'}
                  </span>
                </td>

              </tr>
            )
          })}
        </tbody>

      </table>

    </div>
  )
}

function TabelaMovimentacoes({ movimentacoes, formatarData }) {
  if (movimentacoes.length === 0) {
    return (
      <p className="admin-vazio">
        Nenhuma movimentação registrada.
      </p>
    )
  }

  return (
    <div className="admin-tabela-scroll">

      <table className="admin-tabela">

        <thead>
          <tr>
            <th>Produto</th>
            <th>Operação</th>
            <th>Quantidade</th>
            <th>Saldo anterior</th>
            <th>Saldo posterior</th>
            <th>Observação</th>
            <th>Data</th>
          </tr>
        </thead>

        <tbody>
          {movimentacoes.map((item) => (
            <tr key={item.id}>

              <td>
                <strong>{item.produto}</strong>
              </td>

              <td>{item.tipo}</td>
              <td>{item.quantidade}</td>
              <td>{item.saldo_anterior}</td>
              <td>{item.saldo_posterior}</td>
              <td>{item.observacao || '-'}</td>
              <td>{formatarData(item.created_at)}</td>

            </tr>
          ))}
        </tbody>

      </table>

    </div>
  )
}

export default Admin


