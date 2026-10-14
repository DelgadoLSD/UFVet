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

`npm run db:exemplos` cria seis contas e os animais delas: Victor (Bela e
Nina), Beatriz (Zeus e Luna), Lucas (Thor, Frajola e Bolt), Pedro (Max,
Barão, Gizmo e Duque) e Camila Nunes (Rex, Simba, Amora e Pipoca), mais o
veterinário Paulo Rezende, sem animais. As fotos são enviadas de verdade,
como pela tela. O mesmo comando grava o
histórico clínico (validações, doações e observações), com os casos que as
telas precisam mostrar: validação vencida (Zeus), nunca validado (Luna),
validado (Bela) e com pendências (Nina).

Os exames de exemplo também são enviados de verdade, em imagem: Zeus tem o
hemograma em duas versões e a carteira de vacinação; Luna, as sorologias;
Bela, os três; Nina, o hemograma e a carteira. Os outros animais começam sem
exames, para testar o envio do zero.

Na busca, aparecem os animais que podem doar agora: Zeus fica de fora
enquanto se recupera da doação de setembro, e Max, Luna e Nina, porque os
tutores os pausaram.

O comando grava também o acesso aos contatos: o Pedro está liberado pelo
Victor (faltam 6 horas), a Camila está liberada pelo Paulo (3 dias) e o Lucas
tem um pedido esperando a resposta do Victor. A Beatriz fica sem nada, para
testar o pedido do zero. Os prazos contam a partir de quando o comando roda;
rodar de novo devolve os exemplos que foram encerrados, recusados ou que
venceram.

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
| Paulo Rezende       | Veterinário | `paulo@example.com`        | `ufvet-exemplo` |

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
Para outra validade, use `--dias` (de 1 a 30). Para o site publicado, veja
"Convidar um veterinário no site publicado", abaixo.

## Publicação (Render + Neon)

Publicado, o UFVet roda num serviço só do Render, que monta o site e entrega
o site e a API no mesmo endereço (algo como `https://ufvet.onrender.com`). O
banco fica no Neon. Os dois têm plano grátis. A receita do Render está em
[`render.yaml`](../render.yaml), na raiz do repositório.

### Uma vez só

1. **Banco no Neon.** Crie a conta em [neon.com](https://neon.com) (dá para
   entrar com o GitHub) e um projeto `ufvet` na região **AWS US East 1 (N.
   Virginia)**, perto do Render. Em "Connect", desligue "Connection pooling"
   e copie o endereço, que começa com `postgresql://`: é o `DATABASE_URL` de
   produção. Sem o pooling, porque a API ajusta o fuso de cada conexão para
   UTC (ver `src/banco.js`), e o pooling não guarda esse ajuste.
2. **Chaves novas.** Gere duas, uma para `CHAVE_CIFRAGEM` e outra para
   `CHAVE_INDICE`, com o comando do `.env.example`. Nunca use as do seu
   `.env`. Guarde as duas num gerenciador de senhas: sem elas, o e-mail e o
   telefone cifrados no banco não voltam.
3. **Serviço no Render.** Crie a conta em [render.com](https://render.com)
   (entrando com o GitHub), vá em **New → Blueprint**, escolha o repositório
   do UFVet e confirme. O Render lê o `render.yaml` e pede cinco valores:
   `DATABASE_URL`, `CHAVE_CIFRAGEM`, `CHAVE_INDICE`, `EMAIL_SCRIPT_URL` e
   `EMAIL_SCRIPT_SEGREDO` (os dois últimos vêm da seção "E-mails", abaixo).
   O `JWT_SEGREDO` ele mesmo sorteia.
4. **Espere a montagem**, alguns minutos na primeira vez: ela monta o site,
   prepara a API, aplica as migrações no banco do Neon e cadastra o hospital.
   O endereço do site aparece no topo da página do serviço.

Depois disso, cada `git push` na branch principal publica de novo sozinho.

### E-mails (a conta do Gmail do projeto)

Sem confirmar o e-mail, ninguém entra no site, e o "Esqueceu a senha?" manda
um link por e-mail. Quem leva os e-mails é um pequeno programa do Google, o
Apps Script, numa conta Gmail só do projeto: o Render grátis bloqueia o envio
direto de e-mail, e um e-mail que sai do próprio Gmail cai menos no spam do
que o de um serviço sem domínio próprio. O limite é de 100 e-mails por dia.

1. **A conta.** Crie um Gmail só do projeto (o nome precisa ter de 6 a 30
   caracteres). Guarde a senha num gerenciador de senhas.
2. **A senha do script.** Gere uma com o comando do `.env.example`. Ela vai
   em dois lugares: no script (passo 4) e na variável `EMAIL_SCRIPT_SEGREDO`.
3. **O script.** Entrando com essa conta, abra
   [script.google.com](https://script.google.com), crie um **Novo projeto**
   (dê o nome "Carteiro do UFVet") e troque todo o conteúdo do arquivo
   `Código.gs` pelo de [`scripts/carteiro.gs`](scripts/carteiro.gs). Salve.
4. **A senha no script.** Em **Configurações do projeto** (a engrenagem), no
   fim da página, **Adicionar propriedade do script**: nome `SEGREDO`, valor
   a senha do passo 2. Salve.
5. **Publicar.** **Implantar → Nova implantação**, tipo **App da Web**.
   Executar como: **eu**; quem pode acessar: **qualquer pessoa**. Na
   autorização, o Google avisa que o app não foi verificado (é o seu próprio
   script): **Avançado → Acessar Carteiro do UFVet → Permitir**.
6. **O endereço.** Copie o **URL do app da Web** (termina em `/exec`): é o
   `EMAIL_SCRIPT_URL`.
7. **No Render**, em Environment, ponha `EMAIL_SCRIPT_URL` e
   `EMAIL_SCRIPT_SEGREDO`. Sem os dois, a API publicada se recusa a ligar, em
   vez de criar contas que ninguém consegue confirmar.

No computador, sem essas variáveis no `.env`, nenhum e-mail sai: cada um
vira um arquivo em `backend/emails-locais/`, para abrir no navegador e clicar
no link. Com elas no `.env`, os e-mails saem de verdade, pelo script.

Ao mudar o script, publique uma versão nova sem trocar o endereço:
**Implantar → Gerenciar implantações → editar (lápis) → Versão: nova**.

**Conferir se está funcionando.** Cada vez que liga, a API publicada manda ao
script a senha num pedido sem destinatário (nenhum e-mail sai) e anota o
resultado nos Logs do Render: `carteiro_pronto`, ou `carteiro_com_problema`
com o `motivo`, que diz o que conferir. Um e-mail que não saiu aparece como
`email_nao_enviado`, também com o motivo. Nenhum dos dois traz o endereço de
ninguém. Os motivos mais comuns são a senha diferente entre o Render e a
propriedade `SEGREDO` do script, e o endereço do script colado errado. Aspas
e espaços nas pontas dos valores não atrapalham: a API os ignora.

### O que saber do plano grátis

- **O site dorme.** Depois de 15 minutos sem visitas, o Render desliga o
  serviço, e a próxima visita espera cerca de 1 minuto. Em dias de teste com
  pessoas, um serviço grátis de monitoramento (UptimeRobot, cron-job.org) que
  abra `/api/saude` a cada 10 minutos mantém o site acordado; as 750 horas
  grátis do mês dão para isso.
- **5 GB de tráfego por mês.** Passou disso, o Render suspende o serviço até
  o mês seguinte.
- **Fotos e exames ficam no banco do Neon**, e não no disco do serviço, que
  o Render apaga a cada reinício (inclusive quando ele dorme). O Neon grátis
  tem 0,5 GB: com fotos de uns 80 KB, cabem alguns milhares de arquivos. Se
  faltar espaço, os arquivos podem ir para um serviço de arquivos na nuvem
  (como o Cloudflare R2), mudando só `src/armazenamento.js`.
- **Começa vazio**, só com o hospital. As contas de exemplo nunca vão para
  produção: a senha delas é pública, e o veterinário de exemplo veria os
  contatos de pessoas reais.

### Convidar um veterinário no site publicado

O convite é gravado no banco do Neon, com a chave de produção. Crie nesta
pasta um arquivo `.env.producao` (o git o ignora, como o `.env`; não o mande
para ninguém) com:

```
DATABASE_URL="o endereço do Neon"
CHAVE_INDICE="a mesma chave colada no Render"
```

E rode:

```bash
npm run convite:producao -- --nome "Ana Souza" --crmv 12345 --uf MG
```

## Endereços da API

| Método e endereço                            | O que faz                                                                                                      |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `GET /api/saude`                             | Responde se a API está no ar                                                                                   |
| `POST /api/usuarios`                          | Cria a conta (tutor, ou veterinário com convite), pendente até o e-mail ser confirmado                         |
| `POST /api/usuarios/disponibilidade`         | Diz, durante o cadastro, se o e-mail já tem conta                                                              |
| `GET /api/convites/:codigo`                  | Confere um convite antes do fim do cadastro                                                                    |
| `POST /api/email/confirmacao`                 | Confirma o e-mail com o código do link (no cadastro ou na troca de e-mail)                                     |
| `POST /api/email/correcao`                    | Corrige o e-mail de um cadastro pendente, no navegador em que ele foi feito                                    |
| `POST /api/email/reenvio`                     | Manda de novo o link de confirmação (diz se não saiu; não revela quem tem conta)                               |
| `POST /api/senha/esqueci`                     | Manda o link de senha nova (responde igual tendo ou não conta)                                                 |
| `POST /api/senha/nova`                        | Cria a senha nova com o código do link; todos os aparelhos saem                                                |
| `GET /api/sessao`                            | Diz quem está logado (`{ "usuario": null }` para o visitante)                                                  |
| `POST /api/sessao`                            | Entra com e-mail e senha (só com o e-mail confirmado)                                                          |
| `DELETE /api/sessao`                         | Sai neste aparelho                                                                                             |
| `DELETE /api/sessoes`                        | Sai de todos os aparelhos (exige login)                                                                        |
| `PATCH /api/conta`                            | Muda os dados da própria conta (o e-mail, só com a senha e depois de confirmado)                               |
| `PUT /api/conta/senha`                       | Troca a senha, com a atual; os outros aparelhos saem                                                           |
| `DELETE /api/conta`                          | Encerra a própria conta, com a senha                                                                           |
| `PUT /api/conta/foto`                        | Troca a foto de perfil (formulário com o arquivo em "foto")                                                    |
| `DELETE /api/conta/foto`                     | Remove a foto de perfil                                                                                        |
| `GET /api/doadores`                          | A busca de doadores: filtros, ordem e páginas de 6 (pública, sem contatos)                                     |
| `GET /api/doadores/locais`                   | As cidades e os bairros onde há doadores, para os filtros (pública)                                            |
| `GET /api/usuarios/:codigo`                  | O perfil público de uma pessoa, sem e-mail nem telefone                                                        |
| `GET /api/usuarios/:codigo/contato`          | O e-mail e o telefone, só para o veterinário, a própria pessoa ou o tutor com liberação em vigor               |
| `GET /api/usuarios/:codigo/animais`          | Os animais de uma pessoa, com os exames e o histórico clínico (público, como a busca)                          |
| `POST /api/animais`                          | Cadastra um animal de quem está logado, com as fotos                                                           |
| `PATCH /api/animais/:codigo`                 | Edita dados, disponibilidade ou fotos de um animal (só o dono)                                                 |
| `DELETE /api/animais/:codigo`                | Exclui um animal, com as fotos e os exames dele (só o dono)                                                    |
| `POST /api/animais/:codigo/documentos/:tipo` | Envia um exame (`HEMOGRAMA`, `SOROLOGIA` ou `VACINACAO`); cada envio é uma versão nova (só o dono)             |
| `GET /api/documentos/versoes/:id`            | O arquivo de uma versão de exame (só o dono do animal e veterinários)                                          |
| `DELETE /api/documentos/versoes/:id`         | Apaga uma versão de exame (só o dono); se a validação em vigor a conferiu, o critério dela perde o efeito      |
| `POST /api/animais/:codigo/validacoes`       | Valida os critérios de doação, com o tipo sanguíneo (só veterinário)                                           |
| `POST /api/animais/:codigo/doacoes`          | Registra uma doação realizada (só veterinário)                                                                 |
| `POST /api/animais/:codigo/observacoes`      | Registra uma observação sobre a coleta (só veterinário)                                                        |
| `GET /api/estabelecimentos`                  | Os hospitais e clínicas cadastrados (exige login)                                                              |
| `GET /api/estabelecimentos/:id/veterinarios` | Os veterinários de um hospital, para o tutor escolher a quem pedir (exige login)                               |
| `GET /api/acesso`                            | A situação de quem está logado: a liberação ativa e o pedido que espera resposta                               |
| `POST /api/pedidos`                          | O tutor pede liberação a um veterinário, pelo código, com o caso                                               |
| `GET /api/pedidos`                           | Os pedidos que esperam resposta do veterinário logado                                                          |
| `POST /api/pedidos/:id/recusa`               | O veterinário recusa um pedido endereçado a ele                                                                |
| `GET /api/liberacoes`                        | As liberações ativas que o veterinário logado concedeu                                                         |
| `POST /api/liberacoes`                       | O veterinário libera um tutor (pelo código ou por um pedido) por 24 horas, 3 ou 7 dias                         |
| `POST /api/liberacoes/:id/renovacao`         | Dá à liberação um prazo novo, contado de agora: 24 horas, 3 ou 7 dias, sem nunca encurtar (só quem a concedeu) |
| `DELETE /api/liberacoes/:id`                 | Encerra uma liberação antes do prazo (só quem a concedeu)                                                      |
| `GET /api/usuarios/:codigo/acesso`           | Antes de liberar, quem é o tutor do código e se ele já tem acesso (só veterinário)                             |
| `GET /api/arquivos/:nome`                    | Uma foto guardada                                                                                              |

Com fotos, o cadastro e a edição de animal vão como formulário com arquivos
(multipart): os dados em JSON no campo `dados` e as fotos no campo `fotos`.
Na edição, `dados.fotos` diz a ordem final: o id de cada foto que fica e
`"nova"` no lugar de cada foto enviada. Sem fotos, os pedidos são JSON.

O exame também vai como formulário com arquivo, no campo `arquivo`: uma
imagem (JPG, PNG ou WebP) ou um PDF, com até 10 MB. Nos animais, cada um dos
três documentos vem com as versões enviadas, da primeira à última; o
`arquivoUrl` de cada versão só vem para quem pode abrir o arquivo (para os
outros, é `null`). O `criterioAfetado` de cada versão diz que critério da
validação em vigor perde o efeito se ela for apagada (`SOROLOGIAS`,
`VACINACAO` ou `null`), para o site avisar antes.

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
| `npm run convite:producao` | O mesmo, no banco do site publicado (ver "Publicação")   |
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
│   ├── convite.js          o comando que cria convites de veterinário
│   └── carteiro.gs         o script do Google que manda os e-mails
├── src/
│   ├── servidor.js         liga a API numa porta
│   ├── app.js              monta a API: os passos por que todo pedido passa
│   ├── rotas.js            o cardápio: cada endereço e quem o atende
│   ├── controladores/      as regras de cada pedido (Controller)
│   ├── modelos/            contas, convites, animais, a busca de doadores e o
│   │                       acesso aos contatos (Model)
│   ├── middlewares/        filtros antes do controlador: login, limites, envio
│   │                       de fotos e exames
│   ├── validacao.js        as regras dos dados que chegam (Zod)
│   ├── erros.js            as respostas de erro, todas no mesmo formato
│   ├── token.js            o crachá de sessão (JWT) e o cookie dele
│   ├── senha.js            o hash das senhas (bcrypt)
│   ├── cifra.js            cifragem do e-mail e do telefone, e os índices
│   ├── emails.js           o texto dos e-mails e o link de cada um
│   ├── carteiro.js         quem leva os e-mails (o script, ou uma pasta)
│   ├── codigos.js          sorteio dos códigos públicos e de convite
│   ├── datas.js            datas sem hora (nascimento) entre a API e o banco
│   ├── imagens.js          o tratamento das imagens (conferir, reduzir, sem GPS)
│   ├── armazenamento.js    onde as fotos e os exames ficam guardados (no banco,
│   │                       na tabela arquivo)
│   ├── registro.js         o registro de eventos de segurança
│   ├── config.js           a configuração, lida do .env
│   └── banco.js            o cliente do banco, único para todo o back-end
├── testes/                 testes automatizados (Vitest)
└── generated/              cliente gerado pelo Prisma (não vai para o git)
```

Por que cada tabela e cada coluna existe está em
[docs/modelagem-bd/modelo-de-dados.md](../docs/modelagem-bd/modelo-de-dados.md).

## Segurança

O que a API já faz:

- **Senhas** viram hash bcrypt (`src/senha.js`); a senha nunca é guardada.
- **Dados pessoais** (e-mail e telefone) são cifrados antes de chegar ao
  banco (`src/cifra.js`), com as chaves fora do código, no `.env`. O cadastro
  não pede CPF: nenhuma parte do serviço usa esse dado.
- **Sessão:** um crachá (JWT) assinado, num cookie que o JavaScript da página
  não lê e que só volta para o próprio site. Vale 8 horas; "sair de todos os
  aparelhos" e a troca de senha invalidam os crachás antigos.
- **A conta que a aba mostra:** o navegador guarda um login por site, o
  mesmo para todas as abas. O site manda em cada pedido o código da conta
  que a aba está mostrando (cabeçalho `X-Conta`), e as rotas com login
  recusam a ação (409, `CONTA_TROCADA`) quando o cookie já é de outra conta,
  porque alguém saiu e entrou com outra em outra aba. Nada é feito em nome de
  uma pessoa diferente da que aparece na tela.
- **A própria conta, e só ela:** os endereços de `/api/conta` agem sobre a
  conta do crachá, sem receber id de ninguém. CRMV, papel e código não mudam
  por eles, mesmo que o pedido traga. Trocar o e-mail ou a senha e
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
  sem mexer no que foi assinado; quando apaga uma sorologia ou uma carteira de
  vacinação que a validação conferiu, o mesmo vale para o critério dela.
- **Busca e perfis públicos, sem contato:** a busca e o perfil de outra
  pessoa abrem sem conta (NF16.4), mas só com o que a tela mostra: nada de
  e-mail, telefone ou ids internos. O contato tem endereço próprio, com
  login, e só abre para o veterinário, para a própria pessoa ou para o tutor
  com uma liberação que não venceu nem foi encerrada; a resposta não fica
  guardada em cache.
- **Fotos:** cada arquivo é aberto para conferir que é mesmo uma imagem JPG,
  PNG ou WebP, com até 10 MB e até 5 por animal (formatos como SVG, que podem
  levar instruções além do desenho, são recusados). A foto é reduzida e
  gravada de novo, sem os dados do arquivo original, inclusive a localização
  GPS que o celular guarda (`src/imagens.js`). O nome do arquivo é sorteado,
  nunca vem de quem enviou, e o endereço das fotos só entrega fotos, sem
  listar nada.
  Excluir o animal ou encerrar a conta apaga os arquivos junto.
- **Exames, só para o dono e para veterinários:** um laudo costuma trazer,
  no cabeçalho do laboratório, o nome, o telefone e o endereço do tutor. Por
  isso o exame fica guardado como exame, que nenhum endereço entrega direto
  (nem o das fotos, mesmo em WebP), e sai por uma rota com login, que
  confere a cada pedido se quem pede é o dono do animal ou veterinário; a
  resposta não fica guardada no navegador (`no-store`), e a política de
  segurança não deixa o arquivo rodar nada. Todos veem que exames existem e
  quando foram enviados, mas o endereço do arquivo só vai para quem pode
  abri-lo. Só o dono envia, e cada
  envio vira uma versão nova, sem apagar as anteriores. Só o dono apaga uma
  versão; se ela já estava no site quando a validação em vigor foi assinada,
  o critério que ela comprova perde o efeito, na mesma transação. A imagem
  passa pelo mesmo tratamento das fotos (sem GPS); o PDF é conferido pela
  assinatura do formato, e não pelo nome do arquivo.
- **Login:** e-mail errado e senha errada recebem a mesma resposta, no mesmo
  tempo, para ninguém descobrir quem tem conta.
- **E-mail confirmado:** a conta só entra depois de abrir o link mandado para
  o e-mail, e a troca de e-mail só vale depois de confirmada no e-mail novo.
  Um cadastro que nunca confirmou não aparece para ninguém e não segura o
  e-mail nem o convite; sai em 7 dias. Os links (confirmar e senha nova) têm
  código sorteado de 32 bytes, guardado só como impressão digital, valem 24
  horas e 1 hora, uma vez só, e o mais novo tira a validade dos anteriores.
  O endereço dos links vem da configuração (`ENDERECO_DO_SITE`), nunca do
  pedido. Quem digitou o e-mail errado corrige na própria tela, sem refazer
  o cadastro: só no navegador em que o cadastro foi feito (um cookie que vale
  24 horas e só para isso, sem abrir sessão), e o link do e-mail errado
  deixa de valer. "Esqueceu a senha?" responde igual, e na mesma hora, tendo ou não
  conta. "Mandar o link de novo" responde igual para o e-mail sem conta e
  para a conta confirmada; para o cadastro pendente, espera o e-mail sair e
  diz se ele não saiu.
- **Limite de tentativas:** 20 logins errados a cada 15 minutos, 30 cadastros
  por hora, 60 conferências de e-mail a cada 15 minutos, 20 pedidos de
  e-mail por hora, 30 links que não valem a cada 15 minutos, 60 buscas e 60
  perfis abertos por minuto e 300 pedidos por minuto, por endereço de rede;
  5 e-mails por hora para um mesmo endereço; e, por conta, 10 senhas atuais erradas a
  cada 15 minutos, 30 animais cadastrados, 60 envios de fotos e 30 de exames
  por hora, e 60 registros clínicos por hora (validações, doações e
  observações).
- **Validação:** todo dado que chega é conferido e normalizado
  (`src/validacao.js`). O banco é acessado só pelo Prisma, que nunca mistura o
  dado digitado com o comando (sem risco de SQL injection).
- **Cabeçalhos de segurança** do navegador (Helmet), sem CORS aberto e com
  teto de tamanho nos pedidos.
- **Registro** dos eventos de segurança (`src/registro.js`), sem dados
  pessoais.
- **Veterinário só com convite** da instituição.

Publicada, a API tem HTTPS (o Render dá) e cookie só por HTTPS. Ainda
faltam: backup automático do banco (com cópia das chaves guardada à parte),
um usuário de banco que só mexe nas tabelas do UFVet, o aviso de
dependências do GitHub (Dependabot), um monitor que avisa se a API cair e o
plano de recuperação.

## Testes

Os testes rodam num banco separado, `ufvet_test`, indicado por
`TEST_DATABASE_URL` no `.env`. Na primeira vez, o banco é criado sozinho e
recebe as mesmas migrações do banco de desenvolvimento; antes de cada teste,
ele é esvaziado. Por segurança, os testes se recusam a rodar num banco cujo
nome não termine em `_test`, e usam chaves próprias, nunca as do `.env`.

Os testes da API (`cadastro-api`, `sessao-api`, `conta-api`, `animais-api`,
`fotos-api`, `documentos-api`, `historico-api`, `busca-api`, `perfis-api` e
`acesso-api`) chamam os endereços como o site chamaria, sem ligar a API numa
porta. As fotos e os exames dos testes ficam no banco de testes, esvaziado
antes de cada teste.

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
dados) e são conferidas pela API:

- no máximo cinco fotos por animal;
- `validacao.valida_ate` é sempre `realizada_em` mais um ano;
- `tipo_sanguineo_confirmado` é obrigatório quando o critério `TIPAGEM` foi
  atendido;
- os tipos sanguíneos aceitos dependem da espécie;
- `liberacao_contato.duracao_horas` só pode ser 24, 72 ou 168;
- no máximo um pedido de liberação pendente por tutor, e no máximo uma
  liberação ativa por tutor, de qualquer veterinário. A API confere e grava
  sob uma trava do Postgres por tutor (`pg_advisory_xact_lock`): dois pedidos
  ao mesmo tempo, ou dois veterinários liberando a mesma pessoa juntos, são
  atendidos um depois do outro, e o segundo recebe a recusa. Um índice
  único parcial no banco não serviria para a liberação, porque "ativa"
  depende da hora (`expira_em > agora`).
