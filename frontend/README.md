# UFVet — front-end

O site do UFVet, em React. O login, o cadastro, a página da conta (com a
foto de perfil), os perfis (a pessoa, os animais, as fotos e o histórico
clínico: validação, doações e observações) e a busca de doadores já falam
com a API (pasta `backend`). O resto (os exames e os pedidos e liberações de
contato) ainda usa dados de exemplo no lugar da API: dá para navegar por
tudo, mas o que muda nessas partes não é salvo, e recarregar a página volta
ao começo.

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
| `npm test`             | Roda os testes automatizados uma vez                      |
| `npm run test:watch`   | Roda os testes de novo a cada arquivo salvo               |
| `npm run format`       | Formata todos os arquivos no estilo do projeto (Prettier) |
| `npm run format:check` | Só confere se está tudo formatado, sem mudar nada         |

## Como entrar como veterinário ou tutora

Com as contas de exemplo do back-end (`npm run db:exemplos`):

| Conta                 | E-mail                     | Senha           |
| --------------------- | -------------------------- | --------------- |
| Victor (veterinário)  | `victor@example.com`       | `ufvet-exemplo` |
| Beatriz (tutora)      | `beatriz@example.com`      | `ufvet-exemplo` |
| Lucas (tutor)         | `lucas@example.com`        | `ufvet-exemplo` |
| Pedro (tutor)         | `pedro@example.com`        | `ufvet-exemplo` |
| Camila Nunes (tutora) | `camila.nunes@example.com` | `ufvet-exemplo` |

Elas têm os mesmos códigos públicos das pessoas dos dados de exemplo, então o
site mostra os pedidos e as liberações de exemplo de cada uma. Os retratos,
os animais, as fotos, o histórico clínico e os doadores da busca vêm do
banco (o mesmo comando os cria); os exames ainda saem dos dados de exemplo.
Entrando com o Victor e com a Beatriz, dá para ver o mesmo site pelos dois
lados: no perfil do Lucas, por exemplo, o veterinário vê o contato, e a
tutora só pode pedir a liberação.

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
├── servicos/           de onde as telas tiram os dados (a API)
├── dados/              listas fixas e dados de exemplo
│   └── exemplos/           os exames de exemplo dos animais
├── regras/             regras do negócio (doação, acesso aos contatos, conta,
│                       fotos)
├── util/               funções pequenas de datas, textos e localidades
├── hooks/              hooks do React reaproveitados
└── assets/             imagens
```

Fora de `src/`, a pasta `testes/` guarda os testes automatizados (Vitest).

Regra para escolher a pasta de um componente novo: se só uma página usa, ele
fica na pasta daquela página (`pages/perfil/`, por exemplo); se duas ou mais
usam, vai para `components/`.

## Como os dados chegam às telas

As telas não leem os dados de exemplo diretamente: elas sempre passam por
`servicos/`.

```
tela  →  servicos/  →  API               (sessão, conta, perfis, animais, histórico, busca
                                          e acesso aos contatos)
tela  →  servicos/  →  dados/exemplos/   (os exames, por enquanto)
```

| Serviço                      | O que oferece                                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `servicos/api.js`            | A conversa com a API, usada pelos outros serviços                                                                           |
| `servicos/sessao.js`         | Quem está logado (`useSessao`); entrar, sair e a conta                                                                      |
| `servicos/pessoas.js`        | O perfil de outra pessoa e o contato dela, os veterinários de cada hospital e a conferência do tutor antes de liberar (API) |
| `servicos/animais.js`        | Animais dos perfis, com o histórico clínico, e o que o veterinário registra (API)                                           |
| `servicos/doadores.js`       | A busca de doadores e os lugares dos filtros (API)                                                                          |
| `servicos/acessoContatos.js` | Quem pode ver os contatos; os pedidos e as liberações de acesso (API)                                                       |

O que muda por ação de outra pessoa (o veterinário que libera ou recusa um
pedido, um pedido novo que chega ao painel dele) aparece sem recarregar a
página: o site pergunta de novo à API quando a pessoa volta para a aba e,
com a aba à vista, de tempos em tempos (`hooks/useAtualizacaoPeriodica.js`).
Com a aba escondida, não pergunta nada.

O navegador guarda um login por site, o mesmo para todas as abas. Quem
entra, sai ou cria a conta numa aba avisa as outras (`servicos/sessao.js`),
que passam para a conta nova com um aviso; voltar para uma aba também
confere a conta. Cada pedido diz à API a conta que a aba mostra, e a API
recusa a ação se já for outra. Os modais abertos de uma página fecham quando
a conta muda (`hooks/useModalDaConta.js`).

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
- **Avisos depois de uma ação:** o que deu certo se confirma com
  `confirmar("Alterações salvas")` (`hooks/confirmacoes.js`), que mostra a faixa
  preta embaixo da tela; o que deu errado aparece no próprio formulário, com
  `AvisoErro` ou embaixo do campo.
- **Estilo** com Tailwind, direto nas classes. As cores do site são o vermelho
  `#b7102a` (ação), o vermelho escuro `#8e001b` (destaque) e os tons de cinza
  quente; os ícones são da fonte Material Symbols.
- **Formatação** pelo Prettier (`npm run format`), com a configuração do
  arquivo `.prettierrc.json` na raiz do repositório.

## Testes

`npm test` confere as regras que rodam no navegador antes de qualquer dado
chegar à API: as máscaras de CPF e telefone, a conferência dos dígitos do CPF
e do telefone, as mensagens dos campos de cadastro e conta, o destino depois
de entrar (que só aceita páginas do próprio site), a idade e o prazo de
recuperação dos animais, a situação da validação (vencida, com pendências e o
critério de peso e idade que perde o efeito quando o peso ou o nascimento
muda), o formulário do animal (o que ele confere e o que manda para a API), o
registro de doação (o que falta antes de enviar), as fotos (formatos aceitos,
tamanho e a ordem que vai para a API), a consulta da busca (o que vai para a
API), o perfil de outra pessoa (que chega sem contato), qual animal o perfil
abre no carrossel (o do endereço, vindo da busca, ou o primeiro), quem vê o
contato dos tutores e por quê (com a liberação que vence com a página
aberta) e a conferência do tutor antes de liberar. Também confere como
os erros da API chegam aos formulários: o de um campo vai para embaixo dele,
e o geral (sem conexão, limite de tentativas) para cima do botão. Os testes
não abrem o navegador nem precisam da API ligada.

Essas regras são cópias das que a API confere (`backend/src/validacao.js`), e
os exemplos dos testes são os mesmos dos testes de lá. Mudou uma regra num
lado, mude no outro e rode os testes dos dois.

## Pessoas: nome e tratamento

O banco guarda só o nome completo. O nome curto do topo e dos cartões
("Victor Martins") é calculado: primeiro nome e último sobrenome
(`nomeCurto`, em `util/texto.js`). O veterinário escolhe no cadastro como
assina (Dr. ou Dra.), e é isso que decide "Veterinário" ou "Veterinária". O
banco não guarda gênero de tutores, então eles aparecem como "Tutor(a)".

## O que falta para a integração com a API

- Os exames dos animais ainda ficam só no navegador, até recarregar a
  página.
- Publicado o site, a hospedagem precisa repassar `/api` para a API, como o
  Vite faz no computador.
