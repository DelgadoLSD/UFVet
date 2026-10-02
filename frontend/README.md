# UFVet — front-end

O site do UFVet, em React. Por enquanto ele funciona sozinho, com dados de
exemplo no lugar da API: dá para navegar por todas as telas, mas nada é salvo
de verdade, e recarregar a página volta tudo ao começo.

## Como rodar

Precisa do Node.js 22 ou mais novo.

```bash
npm install        # baixa as dependências (só na primeira vez)
npm run dev        # abre o site em http://localhost:5173
```

Outros comandos:

| Comando                | O que faz                                                 |
| ---------------------- | --------------------------------------------------------- |
| `npm run build`        | Gera a versão de produção na pasta `dist/`                |
| `npm run preview`      | Serve a versão gerada pelo build, para conferir           |
| `npm run lint`         | Procura erros comuns de código (ESLint)                   |
| `npm run format`       | Formata todos os arquivos no estilo do projeto (Prettier) |
| `npm run format:check` | Só confere se está tudo formatado, sem mudar nada         |

## Como entrar como veterinário ou tutora

Ainda não há login de verdade. O site sempre abre com uma conta simulada: o
veterinário Victor Hugo. O menu da conta, no canto superior direito, troca para
a tutora Beatriz dos Reis, e assim dá para ver o mesmo site pelos dois lados
(por exemplo, o contato que o veterinário vê e a tutora não).

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
tela  →  servicos/  →  dados/exemplos/   (hoje)
tela  →  servicos/  →  API               (na integração)
```

| Serviço                      | O que oferece                                                  |
| ---------------------------- | -------------------------------------------------------------- |
| `servicos/sessao.js`         | Quem está logado (`useSessao`) e a edição da própria conta     |
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

## O que falta para a integração com a API

- Trocar os dados de exemplo pelas chamadas à API, dentro de `servicos/`.
- Login de verdade: hoje `LOGADO` (em `components/Header.jsx`) é sempre
  verdadeiro e a conta é simulada.
- Os formulários (login, cadastro, animal, conta) hoje só mostram um aviso ao
  enviar.
- Pontos que dependem de decisão, porque o banco guarda de outro jeito:
  - o nome curto do topo (`nome`): o banco só tem `nomeCompleto`;
  - `genero`, usado para "Tutor"/"Tutora" e "Dr."/"Dra.": o banco só guarda o
    tratamento (`DR`/`DRA`), e só de veterinários;
  - `animaisResumo` ("Zeus (cão) e Luna (gato)"): virá das tabelas de animais;
  - o CRMV aparece junto com a UF ("78120-MG"); no banco são duas colunas.
