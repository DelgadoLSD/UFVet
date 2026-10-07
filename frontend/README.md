# UFVet — front-end

O site do UFVet, em React. O login, o cadastro e a página da conta já falam
com a API (pasta `backend`). O resto das telas (perfis, animais, busca,
liberações) ainda usa dados de exemplo no lugar da API: dá para navegar por
tudo, mas o que muda nessas telas não é salvo, e recarregar a página volta ao
começo.

## Como rodar

Precisa do Node.js 22 ou mais novo.

```bash
npm install        # baixa as dependências (só na primeira vez)
npm run dev        # abre o site em http://localhost:5173
```

A API precisa estar ligada ao mesmo tempo, em outro terminal (`npm run dev`
na pasta `backend`; o README de lá explica a primeira vez). O site repassa
para ela tudo o que começa com `/api` (ver `vite.config.js`). Sem a API, o
site abre, mas ninguém consegue entrar.

Outros comandos:

| Comando                | O que faz                                                 |
| ---------------------- | --------------------------------------------------------- |
| `npm run build`        | Gera a versão de produção na pasta `dist/`                |
| `npm run preview`      | Serve a versão gerada pelo build, para conferir           |
| `npm run lint`         | Procura erros comuns de código (ESLint)                   |
| `npm run format`       | Formata todos os arquivos no estilo do projeto (Prettier) |
| `npm run format:check` | Só confere se está tudo formatado, sem mudar nada         |

## Como entrar como veterinário ou tutora

Com as contas de exemplo do back-end (`npm run db:exemplos`):

| Conta                | E-mail                | Senha           |
| -------------------- | --------------------- | --------------- |
| Victor (veterinário) | `victor@example.com`  | `ufvet-exemplo` |
| Beatriz (tutora)     | `beatriz@example.com` | `ufvet-exemplo` |

Elas têm os mesmos códigos públicos das pessoas dos dados de exemplo, então o
site mostra os animais, pedidos e liberações de exemplo de cada uma. Entrando
com uma e com a outra, dá para ver o mesmo site pelos dois lados (por exemplo,
o contato que o veterinário vê e a tutora não).

Sem entrar, o site mostra o que o visitante vê: o início, a busca e os perfis,
sem os contatos. O próprio perfil e a conta pedem login.

## Estrutura

```
src/
├── main.jsx            ponto de entrada
├── App.jsx             rotas do site
├── index.css           Tailwind e estilos globais
├── pages/              uma página por rota
│   ├── InicioPage.jsx      /
│   ├── LoginPage.jsx       /login
│   ├── CadastroPage.jsx    /cadastrar
│   ├── BuscaPage.jsx       /buscar
│   ├── PerfilPage.jsx      /meu-perfil e /tutor/:codigo
│   ├── ContaPage.jsx       /conta
│   ├── inicio/             partes usadas só na página inicial
│   ├── busca/              partes usadas só na busca
│   ├── perfil/             partes usadas só no perfil
│   └── conta/              partes usadas só na conta
├── components/         peças de interface usadas em mais de uma página
├── servicos/           de onde as telas tiram os dados (hoje simulados)
├── dados/              listas fixas e dados de exemplo
│   └── exemplos/           pessoas, animais e doadores de mentira
├── regras/             regras do negócio (doação, acesso aos contatos, conta)
├── util/               funções pequenas de datas, textos e localidades
├── hooks/              hooks do React reaproveitados
└── assets/             imagens
```

Regra para escolher a pasta de um componente novo: se só uma página usa, ele
fica na pasta daquela página (`pages/perfil/`, por exemplo); se duas ou mais
usam, vai para `components/`.

## Como os dados chegam às telas

As telas não leem os dados de exemplo diretamente: elas sempre passam por
`servicos/`.

```
tela  →  servicos/  →  API               (sessão, login, cadastro e conta)
tela  →  servicos/  →  dados/exemplos/   (o resto, por enquanto)
```

| Serviço                      | O que oferece                                                  |
| ---------------------------- | -------------------------------------------------------------- |
| `servicos/api.js`            | A conversa com a API, usada pelos outros serviços              |
| `servicos/sessao.js`         | Quem está logado (`useSessao`); entrar, sair e a conta         |
| `servicos/pessoas.js`        | Hospitais, tutores e veterinários pelo código, perfil visitado |
| `servicos/animais.js`        | Animais de um tutor                                            |
| `servicos/doadores.js`       | Doadores da busca                                              |
| `servicos/acessoContatos.js` | Liberações e pedidos de acesso aos contatos, e quem pode ver   |

Na integração com a API, o trabalho fica concentrado nesses arquivos: cada
função passa a chamar a API, e as telas continuam chamando as mesmas funções
(com a diferença de que a resposta passa a demorar um pouco, e as telas vão
precisar mostrar um "carregando").

## Convenções

- **Nomes em português**, como no resto do projeto: componentes
  (`CartaoAnimal`), funções (`formatarData`), props (`onFechar` segue o padrão
  do React com `on` + verbo) e campos dos dados.
- **Os dados seguem o banco.** Os campos têm os nomes das colunas do
  `backend/prisma/schema.prisma` (`dataNascimento`, `pesoKg`, `realizadaEm`...)
  e os valores fixos usam os mesmos enums (`CAO`/`GATO`, `MACHO`/`FEMEA`,
  `TUTOR`/`VETERINARIO`). O texto que aparece na tela ("Cão", "Fêmea") sai de
  `regras/doacao.js` e `util/texto.js`.
- **Datas em ISO.** Dia sem hora é `"AAAA-MM-DD"`; um instante é o ISO completo
  (`"2026-09-05T14:20:00-03:00"`). A formatação para a tela (`05/09/2026`,
  `hoje às 14:20`) acontece só na hora de mostrar, com `util/datas.js`. A idade
  nunca é guardada: sai da data de nascimento.
- **Regras num lugar só.** Peso mínimo, idade, intervalo entre doações,
  critérios de validação e prazos de liberação ficam em `regras/`. As telas
  leem de lá, inclusive a página inicial.
- **Limites de texto iguais aos do banco**, em `regras/limites.js`.
- **Comentários explicam o porquê**, não o óbvio. Cada arquivo começa dizendo
  o que é aquela parte do site.
- **Estilo** com Tailwind, direto nas classes. As cores do site são o vermelho
  `#b7102a` (ação), o vermelho escuro `#8e001b` (destaque) e os tons de cinza
  quente; os ícones são da fonte Material Symbols.
- **Formatação** pelo Prettier (`npm run format`), com a configuração do
  arquivo `.prettierrc.json` na raiz do repositório.

## Pessoas: nome e tratamento

O banco guarda só o nome completo. O nome curto do topo e dos cartões
("Victor Martins") é calculado: primeiro nome e último sobrenome
(`nomeCurto`, em `util/texto.js`). O veterinário escolhe no cadastro como
assina (Dr. ou Dra.), e é isso que decide "Veterinário" ou "Veterinária". O
banco não guarda gênero de tutores, então eles aparecem como "Tutor(a)".

## O que falta para a integração com a API

- Trocar os dados de exemplo pelas chamadas à API, dentro de `servicos/`,
  uma funcionalidade por vez (conta, animais, busca, liberações...).
- O formulário do animal ainda só guarda a mudança até recarregar a página.
- A troca de foto (da pessoa e dos animais) espera o armazenamento de
  arquivos.
- `animaisResumo` ("Zeus (cão) e Luna (gato)") vai sair das tabelas de
  animais.
- Publicado o site, a hospedagem precisa repassar `/api` para a API, como o
  Vite faz no computador.
