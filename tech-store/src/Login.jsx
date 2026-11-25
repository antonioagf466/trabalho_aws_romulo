
import { useState } from 'react'
import './Login.css'

const API = 'http://localhost:3001'

function Login({ onLogin, onVoltar }) {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      const resposta = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usuario,
          senha
        })
      })

      const dados = await resposta.json()

      if (!resposta.ok) {
        throw new Error(dados.erro || 'Não foi possível entrar.')
      }

      onLogin(dados.token)

    } catch (erro) {
      setErro(erro.message || 'Erro ao conectar com o servidor.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="login-pagina">
      <section className="login-card">
        <div className="login-logo">
          TECH<span>STORE</span>
        </div>

        <div className="login-cabecalho">
          <h1>Painel administrativo</h1>
          <p>Entre com suas credenciais de administrador.</p>
        </div>

        <form onSubmit={entrar}>
          <label htmlFor="usuario">Usuário</label>
          <input
            id="usuario"
            type="text"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="Digite seu usuário"
            autoComplete="username"
            required
          />

          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Digite sua senha"
            autoComplete="current-password"
            required
          />

          {erro && (
            <div className="login-erro">
              {erro}
            </div>
          )}

          <button
            type="submit"
            className="login-botao"
            disabled={carregando}
          >
            {carregando ? 'Entrando...' : 'Entrar no painel'}
          </button>
        </form>

        <button
          type="button"
          className="login-voltar"
          onClick={onVoltar}
        >
          Voltar para a loja
        </button>
      </section>
    </main>
  )
}

export default Login
