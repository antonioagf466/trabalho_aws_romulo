# Criando novas tabelas no Tech Store

O `db.js` é o **único lugar onde as tabelas são criadas**. Mas, para o frontend usar uma tabela nova, falta uma camada no meio: o **backend**.

O React **nunca acessa o banco diretamente**. Ele só conversa com as rotas. Se a tabela for criada apenas no `db.js`, ela vai existir no banco, mas o front não vai ter como ler nem gravar nela.

```text
React (fetch) → rota do backend → getDb() → tech_store.db
```

---

## O que muda ao adicionar uma tabela

| Onde | O que fazer |
|---|---|
| `backend/src/config/db.js` | Adicionar o `CREATE TABLE IF NOT EXISTS` e, se quiserem, dados iniciais com `INSERT OR IGNORE` |
| `backend/src/routes/` | Criar um arquivo de rotas para a tabela, como `fornecedores.js`, com os `SELECT`, `INSERT`, `UPDATE` e `DELETE` |
| `backend/src/server.js` | Registrar a nova rota com `app.use(...)`, como já é feito com `produtos` e `estoque` |
| `backend/src/middleware/auth.js` | Não muda. Basta aplicar o middleware nas rotas novas que só o admin pode usar |
| Frontend | Fazer os `fetch` para as novas rotas |

### Dicas

- Para criar o arquivo de rotas, use o `produtos.js` como modelo, porque ele já segue o padrão do grupo.
- Chame `salvarBanco()` depois de todo `INSERT`, `UPDATE` ou `DELETE`. Caso contrário, os dados se perdem quando o servidor reinicia.

---

## Cuidado com o banco que já existe

O `CREATE TABLE IF NOT EXISTS` **só cria tabelas que ainda não existem**. Isso tem duas consequências:

- **Tabela nova:** é criada normalmente quando o servidor reinicia.
- **Coluna nova numa tabela que já existe**, como acrescentar um `fornecedor_id` em `produtos`: **não é aplicada**, porque a tabela já está no `tech_store.db` e o comando é ignorado.

No segundo caso, enquanto estiverem desenvolvendo, o mais simples é:

1. Parar o servidor.
2. Apagar o arquivo `backend/tech_store.db`.
3. Subir o servidor de novo com `npm run dev`.

O banco é recriado com a estrutura nova. Os dados de teste se perdem, mas os dados iniciais definidos no `db.js` voltam sozinhos.

---

## Os passos para rodar continuam os mesmos

O `npm install`, o `.env` e os dois terminais não mudam. Só é preciso rodar o `npm install` de novo se alguém adicionar uma biblioteca nova ao `package.json`.

---

## Trabalho em grupo

Cada pessoa do grupo tem o próprio `tech_store.db`, porque ele está no `.gitignore`. Quando alguém mudar o `db.js` e mandar para o GitHub, **avise os outros para apagarem o banco local**. Se não apagarem, vão continuar com a estrutura antiga.
