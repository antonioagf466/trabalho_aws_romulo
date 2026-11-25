# Tech Store

Sistema de inventário com **frontend em React (Vite)** e **backend em Node.js (Express)**, usando um banco **SQLite** que roda dentro do próprio Node via `sql.js`. Não é necessário instalar nenhum servidor de banco de dados.

---

## Estrutura do projeto

```text
tech-store/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js            # Conexão e criação do banco
│   │   ├── middleware/
│   │   │   └── auth.js          # Proteção das rotas (confere o token JWT)
│   │   ├── routes/
│   │   │   ├── auth.js          # Login do admin
│   │   │   ├── estoque.js       # Rotas de movimentação de estoque
│   │   │   └── produtos.js      # Rotas de produtos
│   │   └── server.js            # Ponto de entrada do backend
│   ├── .env                     # Variáveis de ambiente (NÃO vai para o GitHub)
│   ├── tech_store.db            # Banco de dados (criado automaticamente, NÃO vai para o GitHub)
│   └── package.json
│
├── public/
├── src/                         # Frontend React
│   ├── main.jsx
│   ├── App.jsx
│   ├── Login.jsx
│   └── Admin.jsx
└── package.json
```

O frontend e o backend têm **cada um o seu `package.json`** e rodam **em terminais separados**.

---

## Pré-requisitos

- **Node.js 20.19 ou superior** (ou **22.12 ou superior**)
- **npm** (já vem com o Node)

Confira a versão:

```bash
node -v
```

> O Vite 8 não funciona com versões mais antigas do Node. Com uma versão abaixo do exigido, o `npm install` mostra avisos `EBADENGINE` e o `npm run dev` falha com o erro `Cannot find native binding`.

---

## 1. Backend

### 1.1 Instalar as dependências

```bash
cd tech-store/backend
npm install
```

### 1.2 Criar o arquivo `.env`

O backend não inicia sem estas três variáveis. Crie um arquivo chamado `.env` dentro de `tech-store/backend`, no mesmo nível do `package.json` (fora da pasta `src`).

Primeiro, gere um segredo para o JWT:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Depois preencha o `.env`:

```text
ADMIN_USER=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=COLE_AQUI_O_TEXTO_GERADO
```

| Variável | Para que serve |
|---|---|
| `ADMIN_USER` | Usuário usado para entrar no painel administrativo |
| `ADMIN_PASSWORD` | Senha do admin |
| `JWT_SECRET` | Chave usada para assinar o token de login |

> **Dica:** crie o `.env` pelo VS Code (botão direito na pasta `backend` > New File). Se for criado pelo PowerShell, o arquivo pode ser salvo em UTF-16 e o `dotenv` não consegue lê-lo.

> **Atenção:** o `env.example.txt` que existe em `inventario/backend` é do projeto antigo e **não serve** para o `tech-store`.

### 1.3 Rodar o backend

```bash
npm run dev
```

O terminal deve mostrar:

```text
> backend@1.0.0 dev
> nodemon src/server.js
injected env (3) from .env
Banco de dados Tech Store inicializado!
```

Se aparecer `injected env (0)` ou o erro `Configure ADMIN_USER, ADMIN_PASSWORD e JWT_SECRET no arquivo .env`, o `.env` não foi encontrado ou está vazio.

---

## 2. Banco de dados

### Como o banco é criado

**Não é preciso criar o banco manualmente.** O arquivo `tech_store.db` é gerado automaticamente na primeira vez que o backend sobe. Por isso ele fica no `.gitignore`: cada pessoa tem o seu banco local.

O que acontece ao iniciar o servidor (`src/config/db.js`):

```text
server.js inicia
   ↓
confere as variáveis do .env
   ↓
inicializarBanco()
   ├── se tech_store.db existe → carrega o arquivo
   └── se não existe          → cria um banco vazio na memória
   ↓
CREATE TABLE IF NOT EXISTS → cria as tabelas (só na primeira vez)
   ↓
INSERT OR IGNORE → cadastra as categorias iniciais sem duplicar
   ↓
salvarBanco() → grava tudo em backend/tech_store.db
   ↓
servidor fica disponível
```

> Se o servidor parar antes de `inicializarBanco()` (por exemplo, por falta do `.env`), o arquivo `tech_store.db` **não é criado**.

### Tabelas

| Tabela | Conteúdo |
|---|---|
| `categorias` | Categorias dos produtos. Já vem com: Computadores, Smartphones, Áudio e Periféricos |
| `produtos` | Produtos do estoque (nome, marca, modelo, SKU, preços, estoque atual e mínimo, imagem, ativo) |
| `movimentacoes_estoque` | Histórico de entradas, saídas e ajustes, com saldo anterior e posterior |

A tabela `produtos` começa **vazia**. Os produtos são cadastrados pelo painel administrativo.

### Como o banco funciona

- O `sql.js` mantém o banco **na memória** enquanto o servidor está rodando.
- As alterações só são gravadas no arquivo quando `salvarBanco()` é chamada.
- Por isso, **toda rota que faz `INSERT`, `UPDATE` ou `DELETE` precisa chamar `salvarBanco()` depois**. Caso contrário, os dados se perdem quando o servidor reinicia.
- As rotas acessam o banco pela função `getDb()`.

### Visualizar o banco

Instale no VS Code a extensão **SQLite Viewer** e clique no arquivo `backend/tech_store.db` para ver as tabelas e os dados.

### Resetar o banco

Pare o servidor, apague o arquivo `backend/tech_store.db` e rode `npm run dev` novamente. O banco é recriado do zero.

---

## 3. Frontend

Em **outro terminal**:

```bash
cd tech-store
npm install
npm run dev
```

O terminal deve mostrar:

```text
> tech-store@0.0.0 dev
> vite

VITE ready in ... ms
➜ Local: http://localhost:5173/
```

Abra `http://localhost:5173/` no navegador.

---

## 4. Rodando o projeto completo

São necessários **dois terminais abertos ao mesmo tempo**. No VS Code, use o botão **+** do painel de terminal para abrir o segundo.

| Terminal | Pasta | Comando | Deve aparecer |
|---|---|---|---|
| 1 | `tech-store/backend` | `npm run dev` | `backend@1.0.0 dev` e `Banco de dados Tech Store inicializado!` |
| 2 | `tech-store` | `npm run dev` | `tech-store@0.0.0 dev` e `http://localhost:5173/` |

> Confira a primeira linha depois do `npm run dev`: `backend@1.0.0` é o backend, `tech-store@0.0.0` é o frontend. Se aparecer o errado, o terminal está na pasta errada.

---

## 5. Login do administrador

O painel administrativo usa um **admin único**, definido no `.env`:

1. O usuário entra com `ADMIN_USER` e `ADMIN_PASSWORD` na tela de login.
2. A rota em `src/routes/auth.js` confere os dados e gera um **token JWT**, assinado com o `JWT_SECRET`.
3. O React envia esse token nas próximas requisições.
4. O middleware `src/middleware/auth.js` confere o token antes de liberar as rotas protegidas.

---

## 6. Arquivos que não vão para o GitHub

O `.gitignore` deve conter:

```text
node_modules/
.env
tech_store.db
```

Para facilitar a configuração de quem clonar o projeto, mantenha no repositório um `.env.example` em `tech-store/backend`, **sem valores reais**:

```text
ADMIN_USER=
ADMIN_PASSWORD=
JWT_SECRET=
```

---

## 7. Problemas comuns

| Problema | Causa | Solução |
|---|---|---|
| `Cannot find native binding` / `@rolldown/binding-win32-x64-msvc` ao rodar o frontend | Versão do Node abaixo da exigida pelo Vite 8 | Atualize o Node e reinstale as dependências (veja abaixo) |
| `Configure ADMIN_USER, ADMIN_PASSWORD e JWT_SECRET no arquivo .env` | `.env` ausente, vazio ou na pasta errada | Crie o `.env` em `tech-store/backend` |
| `tech_store.db` não aparece | O backend parou antes de criar o banco | Corrija o erro mostrado no terminal e rode de novo |
| Arquivo criado, mas não aparece no VS Code | Explorer desatualizado | Clique em **Refresh Explorer** na barra lateral |
| `rs` não é reconhecido | O `rs` só funciona com o nodemon rodando | Digite `rs` apenas no terminal do backend, com o servidor ativo |
| Nodemon não reinicia após editar o `.env` | O nodemon só observa arquivos `js`, `mjs`, `cjs` e `json` | Digite `rs` no terminal do backend |

### Reinstalar as dependências do frontend

```bash
cd tech-store
rm -rf node_modules package-lock.json
npm install
npm run dev
```

No PowerShell, use no lugar da linha `rm`:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
```
