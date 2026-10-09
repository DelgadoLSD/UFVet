# UFVet — back-end

A API do UFVet, em Express, e o banco de dados PostgreSQL, acessado pelo
Prisma. Por enquanto a API cuida das contas (cadastro, convite de
veterinário, login, sessão e a própria conta: dados, foto, senha e
encerramento), dos animais (cadastro, edição, exclusão, disponibilidade e
fotos), do histórico clínico deles, que só o veterinário escreve (validação
com o tipo sanguíneo, doações e observações sobre a coleta), e da busca de
doadores, com o perfil público de cada pessoa. Exames e liberações de
contato entram nas próximas etapas.

## Pré-requisitos

- Node.js 22.18 ou mais novo;
- PostgreSQL rodando no computador (o projeto foi criado com a versão 18).

## Primeira vez

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env` e preencha seguindo as instruções de dentro
   do arquivo: a senha do usuário `postgres` nas duas URLs e as três chaves
   (duas de cifragem e uma de sessão). O `.env` guarda segredos e nunca vai
   para o git.

3. Crie o banco e as tabelas, gere o cliente do Prisma e faça a carga inicial:

   ```bash
   npm run db:migrate     # cria o banco "ufvet", se faltar, e aplica as migrações
   npm run db:generate    # gera o cliente do Prisma na pasta generated/
   npm run db:seed        # cadastra o Hospital Veterinário UFV
   npm run db:exemplos    # opcional: contas e animais de exemplo (ver abaixo)
   ```

4. Confira se está tudo certo:

   ```bash
   npm test
   ```

## Ligar a API

```bash
npm run dev
```

A API fica em `http://localhost:3000/api` e reinicia sozinha a cada arquivo
salvo. O site (pasta `frontend`) precisa dela ligada: ele repassa para ela
tudo o que começa com `/api`. Para conferir se está no ar, abra
`http://localhost:3000/api/saude`.

## Contas de exemplo

`npm run db:exemplos` cria cinco contas e os animais delas: Victor (Bela e
Nina), Beatriz (Zeus e Luna), Lucas (Thor, Frajola e Bolt), Pedro (Max,
Barão, Gizmo e Duque) e Camila Nunes (Rex, Simba, Amora e Pipoca). São as
mesmas pessoas dos dados de exemplo do site, com os mesmos códigos públicos,
e as fotos são enviadas de verdade, como pela tela. O mesmo comando grava o
histórico clínico (validações, doações e observações), com os casos que as
telas precisam mostrar: validação vencida (Zeus), nunca validado (Luna),
validado (Bela) e com pendências (Nina).

Na busca, aparecem os animais que podem doar agora: Zeus fica de fora
enquanto se recupera da doação de setembro, e Max, Luna e Nina, porque os
tutores os pausaram. Entrando com as contas, o site mostra também os pedidos
e as liberações de exemplo.

O comando só cria o que falta: rodar de novo num banco antigo acrescenta o
que é novo (as fotos, por exemplo). Uma conta de exemplo que você alterou
(com outra senha, por exemplo) não volta sozinha: encerre a conta pelo site e
rode o comando de novo.

| Conta               | Papel       | E-mail                     | Senha           |
| ------------------- | ----------- | -------------------------- | --------------- |
| Victor Hugo Martins | Veterinário | `victor@example.com`       | `ufvet-exemplo` |
| Beatriz dos Reis    | Tutora      | `beatriz@example.com`      | `ufvet-exemplo` |
| Lucas Silva Delgado | Tutor       | `lucas@example.com`        | `ufvet-exemplo` |
| Pedro Alves         | Tutor       | `pedro@example.com`        | `ufvet-exemplo` |
| Camila Nunes        | Tutora      | `camila.nunes@example.com` | `ufvet-exemplo` |

A senha é pública, por isso o comando se recusa a rodar em produção.

## Convidar um veterinário

O CRMV é público: conferir que ele existe não prova que quem se cadastra é o
dono do registro. Por isso ninguém vira veterinário sozinho no UFVet. A
direção do hospital informa nome e CRMV, e um comando gera o convite:

```bash
npm run convite -- --nome "Ana Souza" --crmv 12345 --uf MG
```

O comando mostra um código (por exemplo, `7K3P-9XQ2`) que vale uma vez só, por
7 dias, e só para aquele CRMV. A pessoa entra em "Criar conta", escolhe "Sou
veterinário" e digita o código. O CRMV e o local de atuação da conta vêm do
convite. O código não fica guardado no banco (só a impressão digital dele),
então quem perder o código precisa de um convite novo.

Com mais de um hospital cadastrado, diga qual com `--local "Nome do local"`.
Para outra validade, use `--dias` (de 1 a 30).

## Endereços da API

| Método e endereço                       | O que faz                                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `GET /api/saude`                        | Responde se a API está no ar                                                                     |
| `POST /api/usuarios`                    | Cria a conta (tutor, ou veterinário com convite) e já entra                                      |
| `POST /api/usuarios/disponibilidade`    | Diz, durante o cadastro, se o e-mail ou o CPF já têm conta                                       |
| `GET /api/convites/:codigo`             | Confere um convite antes do fim do cadastro                                                      |
| `GET /api/sessao`                       | Diz quem está logado (`{ "usuario": null }` para o visitante)                                    |
| `POST /api/sessao`                      | Entra com e-mail e senha                                                                         |
| `DELETE /api/sessao`                    | Sai neste aparelho                                                                               |
| `DELETE /api/sessoes`                   | Sai de todos os aparelhos (exige login)                                                          |
| `PATCH /api/conta`                      | Muda os dados da própria conta (o e-mail, só com a senha)                                        |
| `PUT /api/conta/senha`                  | Troca a senha, com a atual; os outros aparelhos saem                                             |
| `DELETE /api/conta`                     | Encerra a própria conta, com a senha                                                             |
| `PUT /api/conta/foto`                   | Troca a foto de perfil (formulário com o arquivo em "foto")                                      |
| `DELETE /api/conta/foto`                | Remove a foto de perfil                                                                          |
| `GET /api/doadores`                     | A busca de doadores: filtros, ordem e páginas de 6 (pública, sem contatos)                       |
| `GET /api/doadores/locais`              | As cidades e os bairros onde há doadores, para os filtros (pública)                              |
| `GET /api/usuarios/:codigo`             | O perfil público de uma pessoa, sem e-mail, telefone ou CPF                                      |
| `GET /api/usuarios/:codigo/contato`     | O e-mail e o telefone, só para o veterinário, a própria pessoa ou o tutor com liberação em vigor |
| `GET /api/usuarios/:codigo/animais`     | Os animais de uma pessoa, com o histórico clínico (público, como a busca)                        |
| `POST /api/animais`                     | Cadastra um animal de quem está logado, com as fotos                                             |
| `PATCH /api/animais/:codigo`            | Edita dados, disponibilidade ou fotos de um animal (só o dono)                                   |
| `DELETE /api/animais/:codigo`           | Exclui um animal e as fotos dele (só o dono)                                                     |
| `POST /api/animais/:codigo/validacoes`  | Valida os critérios de doação, com o tipo sanguíneo (só veterinário)                             |
| `POST /api/animais/:codigo/doacoes`     | Registra uma doação realizada (só veterinário)                                                   |
| `POST /api/animais/:codigo/observacoes` | Registra uma observação sobre a coleta (só veterinário)                                          |
| `GET /api/estabelecimentos`             | Os hospitais e clínicas cadastrados (exige login)                                                |
| `GET /api/arquivos/:nome`               | Uma foto guardada                                                                                |

Com fotos, o cadastro e a edição de animal vão como formulário com arquivos
(multipart): os dados em JSON no campo `dados` e as fotos no campo `fotos`.
Na edição, `dados.fotos` diz a ordem final: o id de cada foto que fica e
`"nova"` no lugar de cada foto enviada. Sem fotos, os pedidos são JSON.

A busca recebe os filtros no endereço: `especie` (`CAO` ou `GATO`,
obrigatória), `tipos` (repetido, um por tipo), `cidade`, `bairro`
(só junto com a cidade), `apenasValidados=true`, `busca` (nome, raça, código
ou bairro), `ordem` (`validados`, `peso` ou `nome`) e `pagina`. Só aparecem
os animais que podem doar agora: disponíveis e fora dos 90 dias de
recuperação depois de uma coleta. Com filtro de tipo, só quem tem a tipagem
confirmada por um veterinário.

Os erros vêm sempre no mesmo formato: `{ "erro": "mensagem" }`, com
`"campos": { "email": "mensagem" }` quando o problema é num dado enviado.

## Comandos

| Comando                | O que faz                                                    |
| ---------------------- | ------------------------------------------------------------ |
| `npm run dev`          | Liga a API e a reinicia a cada arquivo salvo                 |
| `npm start`            | Liga a API (é o que a hospedagem roda)                       |
| `npm run convite`      | Cria um convite de veterinário (ver acima)                   |
| `npm run db:validate`  | Confere se o `schema.prisma` está correto                    |
| `npm run db:migrate`   | Cria uma migração a partir do esquema e aplica no banco      |
| `npm run db:generate`  | Gera de novo o cliente do Prisma (depois de mudar o esquema) |
| `npm run db:seed`      | Carga inicial; pode rodar de novo sem duplicar nada          |
| `npm run db:exemplos`  | Cria as contas e os animais de exemplo; nunca em produção    |
| `npm test`             | Roda os testes automatizados uma vez                         |
| `npm run test:watch`   | Roda os testes de novo a cada arquivo salvo                  |
| `npm run format`       | Formata os arquivos no estilo do projeto (Prettier)          |
| `npm run format:check` | Só confere se está tudo formatado                            |

## Estrutura

A API segue o padrão MVC: o Model são os dados (as tabelas e as funções que as
consultam), o Controller são as regras de cada pedido, e a View é o site em
React, que fica na pasta `frontend`.

```
backend/
├── prisma/
│   ├── schema.prisma       tabelas, colunas e relações do banco (Model)
│   ├── migrations/         o SQL que cria e altera o banco, passo a passo
│   ├── seed.js             carga inicial (o que nenhuma tela cadastra)
│   └── exemplos.js         contas e animais de exemplo, só para desenvolver
├── prisma.config.ts        configuração do Prisma (lê a URL do banco do .env)
├── scripts/
│   └── convite.js          o comando que cria convites de veterinário
├── src/
│   ├── servidor.js         liga a API numa porta
│   ├── app.js              monta a API: os passos por que todo pedido passa
│   ├── rotas.js            o cardápio: cada endereço e quem o atende
│   ├── controladores/      as regras de cada pedido (Controller)
│   ├── modelos/            contas, convites, animais e a busca de doadores (Model)
│   ├── middlewares/        filtros antes do controlador: login, limites, envio
│   │                       de fotos
│   ├── validacao.js        as regras dos dados que chegam (Zod)
│   ├── erros.js            as respostas de erro, todas no mesmo formato
│   ├── token.js            o crachá de sessão (JWT) e o cookie dele
│   ├── senha.js            o hash das senhas (bcrypt)
│   ├── cifra.js            cifragem e índices de CPF, e-mail e telefone
│   ├── codigos.js          sorteio dos códigos públicos e de convite
│   ├── datas.js            datas sem hora (nascimento) entre a API e o banco
│   ├── imagens.js          o tratamento das fotos (conferir, reduzir, sem GPS)
│   ├── armazenamento.js    onde as fotos ficam guardadas (hoje, a pasta arquivos/)
│   ├── registro.js         o registro de eventos de segurança
│   ├── config.js           a configuração, lida do .env
│   └── banco.js            o cliente do banco, único para todo o back-end
├── arquivos/               as fotos enviadas, no computador (não vai para o git)
├── testes/                 testes automatizados (Vitest)
└── generated/              cliente gerado pelo Prisma (não vai para o git)
```

Por que cada tabela e cada coluna existe está em
[docs/modelagem-bd/modelo-de-dados.md](../docs/modelagem-bd/modelo-de-dados.md).

## Segurança

O que a API já faz:

- **Senhas** viram hash bcrypt (`src/senha.js`); a senha nunca é guardada.
- **Dados pessoais** (CPF, e-mail e telefone) são cifrados antes de chegar ao
  banco (`src/cifra.js`), com as chaves fora do código, no `.env`.
- **Sessão:** um crachá (JWT) assinado, num cookie que o JavaScript da página
  não lê e que só volta para o próprio site. Vale 8 horas; "sair de todos os
  aparelhos" e a troca de senha invalidam os crachás antigos.
- **A própria conta, e só ela:** os endereços de `/api/conta` agem sobre a
  conta do crachá, sem receber id de ninguém. CPF, CRMV, papel e código não
  mudam por eles, mesmo que o pedido traga. Trocar o e-mail ou a senha e
  encerrar a conta pedem a senha atual, e o e-mail novo só é conferido
  depois dela, para o endereço não revelar quem tem conta.
- **Animais, só pelo dono:** editar e excluir exigem ser o dono, e o animal
  de outra pessoa recebe a mesma resposta de um que não existe. O tipo
  sanguíneo nunca vem do tutor: só uma validação assinada o preenche.
- **Histórico clínico, só pelo veterinário:** validar, registrar doação e
  escrever observação exigem conta de veterinário. A assinatura (nome e CRMV)
  sai da conta de quem está logado, nunca do pedido, e fica copiada no
  registro. Nada disso é alterado nem apagado depois: revisar uma validação
  cria outra, e a anterior fica no histórico. Com a tipagem conferida, o tipo
  do exame é obrigatório e precisa ser da espécie; a coleta não pode ter data
  futura nem anterior ao nascimento. Quando o tutor muda o peso ou o
  nascimento, o critério de peso e idade da validação em vigor perde o efeito,
  sem mexer no que foi assinado.
- **Busca e perfis públicos, sem contato:** a busca e o perfil de outra
  pessoa abrem sem conta (NF16.4), mas só com o que a tela mostra: nada de
  e-mail, telefone, CPF ou ids internos. O contato tem endereço próprio, com
  login, e só abre para o veterinário, para a própria pessoa ou para o tutor
  com uma liberação que não venceu nem foi encerrada; a resposta não fica
  guardada em cache.
- **Fotos:** cada arquivo é aberto para conferir que é mesmo uma imagem JPG,
  PNG ou WebP, com até 10 MB e até 5 por animal (formatos como SVG, que podem
  levar instruções além do desenho, são recusados). A foto é reduzida e
  gravada de novo, sem os dados do arquivo original, inclusive a localização
  GPS que o celular guarda (`src/imagens.js`). O nome do arquivo é sorteado,
  nunca vem de quem enviou, e a pasta só entrega as fotos, sem listar nada.
  Excluir o animal ou encerrar a conta apaga os arquivos junto.
- **Login:** e-mail errado e senha errada recebem a mesma resposta, no mesmo
  tempo, para ninguém descobrir quem tem conta.
- **Limite de tentativas:** 20 logins errados a cada 15 minutos, 30 cadastros
  por hora, 60 conferências de e-mail e CPF a cada 15 minutos, 60 buscas e 60
  perfis abertos por minuto e 300 pedidos por minuto, por endereço de rede; e, por conta, 10 senhas atuais erradas a
  cada 15 minutos, 30 animais cadastrados e 60 envios de fotos por hora, e 60
  registros clínicos por hora (validações, doações e observações).
- **Validação:** todo dado que chega é conferido e normalizado
  (`src/validacao.js`). O banco é acessado só pelo Prisma, que nunca mistura o
  dado digitado com o comando (sem risco de SQL injection).
- **Cabeçalhos de segurança** do navegador (Helmet), sem CORS aberto e com
  teto de tamanho nos pedidos.
- **Registro** dos eventos de segurança (`src/registro.js`), sem dados
  pessoais.
- **Veterinário só com convite** da instituição.

O que entra quando a API for publicada: HTTPS (a hospedagem dá), backup
automático do banco (com cópia das chaves guardada à parte), um usuário de
banco que só mexe nas tabelas do UFVet, o aviso de dependências do GitHub
(Dependabot), um monitor que avisa se a API cair e o plano de recuperação.

## Testes

Os testes rodam num banco separado, `ufvet_test`, indicado por
`TEST_DATABASE_URL` no `.env`. Na primeira vez, o banco é criado sozinho e
recebe as mesmas migrações do banco de desenvolvimento; antes de cada teste,
ele é esvaziado. Por segurança, os testes se recusam a rodar num banco cujo
nome não termine em `_test`, e usam chaves próprias, nunca as do `.env`.

Os testes da API (`cadastro-api`, `sessao-api`, `conta-api`, `animais-api`,
`fotos-api`, `historico-api`, `busca-api` e `perfis-api`) chamam os endereços
como o site chamaria, sem ligar a API numa porta. As fotos dos testes vão para uma pasta temporária,
nunca para `arquivos/`.

## Como mudar o banco

1. Edite `prisma/schema.prisma`.
2. Crie a migração, com um nome que diga o que mudou:

   ```bash
   npm run db:migrate -- --name descreve-a-mudanca
   ```

3. Gere o cliente de novo (`npm run db:generate`) e rode os testes.
4. Atualize o dicionário de dados e o diagrama em `docs/modelagem-bd/`.

Uma migração já aplicada nunca é editada: cada mudança vira uma migração nova.

## Regras que ficam com a API

Algumas regras não cabem na declaração das tabelas (seção 8 do modelo de
dados) e são conferidas pela API. Já conferida: no máximo cinco fotos por
animal. Nas próximas etapas:

- no máximo um pedido de liberação pendente por tutor (índice único parcial,
  criado com SQL numa migração);
- `validacao.valida_ate` é sempre `realizada_em` mais um ano;
- `tipo_sanguineo_confirmado` é obrigatório quando o critério `TIPAGEM` foi
  atendido;
- os tipos sanguíneos aceitos dependem da espécie;
- `liberacao_contato.duracao_horas` só pode ser 24, 72 ou 168.
