# UFVet — back-end

Por enquanto, o back-end é o banco de dados: o esquema, as migrações, a
cifragem dos dados pessoais, a carga inicial e os testes automatizados. A API,
em Express, é a próxima etapa.

## Pré-requisitos

- Node.js 22.18 ou mais novo;
- PostgreSQL rodando no computador (o projeto foi criado com a versão 18).

## Primeira vez

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env` e preencha seguindo as instruções de dentro
   do arquivo: a senha do usuário `postgres` nas duas URLs e as duas chaves de
   cifragem. O `.env` guarda segredos e nunca vai para o git.

3. Crie o banco e as tabelas, gere o cliente do Prisma e faça a carga inicial:

   ```bash
   npm run db:migrate     # cria o banco "ufvet", se faltar, e aplica as migrações
   npm run db:generate    # gera o cliente do Prisma na pasta generated/
   npm run db:seed        # cadastra o Hospital Veterinário UFV
   ```

4. Confira se está tudo certo:

   ```bash
   npm test
   ```

## Comandos

| Comando                | O que faz                                                    |
| ---------------------- | ------------------------------------------------------------ |
| `npm run db:validate`  | Confere se o `schema.prisma` está correto                    |
| `npm run db:migrate`   | Cria uma migração a partir do esquema e aplica no banco      |
| `npm run db:generate`  | Gera de novo o cliente do Prisma (depois de mudar o esquema) |
| `npm run db:seed`      | Carga inicial; pode rodar de novo sem duplicar nada          |
| `npm test`             | Roda os testes automatizados uma vez                         |
| `npm run test:watch`   | Roda os testes de novo a cada arquivo salvo                  |
| `npm run format`       | Formata os arquivos no estilo do projeto (Prettier)          |
| `npm run format:check` | Só confere se está tudo formatado                            |

## Estrutura

```
backend/
├── prisma/
│   ├── schema.prisma     tabelas, colunas e relações do banco
│   ├── migrations/       o SQL que cria e altera o banco, passo a passo
│   └── seed.js           carga inicial (o que nenhuma tela cadastra)
├── prisma.config.ts      configuração do Prisma (lê a URL do banco do .env)
├── src/
│   ├── banco.js          o cliente do banco, único para todo o back-end
│   └── cifra.js          cifragem e índices de CPF, e-mail e telefone
├── testes/               testes automatizados (Vitest)
└── generated/            cliente gerado pelo Prisma (não vai para o git)
```

Por que cada tabela e cada coluna existe está em
[docs/modelagem-bd/modelo-de-dados.md](../docs/modelagem-bd/modelo-de-dados.md).

## Testes

Os testes rodam num banco separado, `ufvet_test`, indicado por
`TEST_DATABASE_URL` no `.env`. Na primeira vez, o banco é criado sozinho e
recebe as mesmas migrações do banco de desenvolvimento; antes de cada teste,
ele é esvaziado. Por segurança, os testes se recusam a rodar num banco cujo
nome não termine em `_test`, e usam chaves de cifragem próprias, nunca as do
`.env`.

## Como mudar o banco

1. Edite `prisma/schema.prisma`.
2. Crie a migração, com um nome que diga o que mudou:

   ```bash
   npm run db:migrate -- --name descreve-a-mudanca
   ```

3. Gere o cliente de novo (`npm run db:generate`) e rode os testes.
4. Atualize o dicionário de dados e o diagrama em `docs/modelagem-bd/`.

Uma migração já aplicada nunca é editada: cada mudança vira uma migração nova.

## O que a API vai precisar garantir

Algumas regras não cabem na declaração das tabelas (seção 8 do modelo de
dados) e ficam para a API:

- no máximo cinco fotos por animal;
- no máximo um pedido de liberação pendente por tutor (índice único parcial,
  criado com SQL numa migração);
- `validacao.valida_ate` é sempre `realizada_em` mais um ano;
- `tipo_sanguineo_confirmado` é obrigatório quando o critério `TIPAGEM` foi
  atendido;
- os tipos sanguíneos aceitos dependem da espécie;
- `liberacao_contato.duracao_horas` só pode ser 24, 72 ou 168.

E ainda: a senha é guardada como hash bcrypt, CPF, e-mail e telefone passam
por `src/cifra.js` antes de chegar ao banco, e todo acesso ao banco usa o
cliente de `src/banco.js`.
