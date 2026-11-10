# Roteiros de navegador

Programas que abrem o Microsoft Edge e usam o UFVet sozinhos, como uma pessoa
faria: entram com uma conta de exemplo, clicam, preenchem formulários e
conferem se a tela mostrou o que devia. Cada roteiro imprime uma linha por
verificação (`OK` ou `FALHOU`) e, no fim, se todas passaram.

Eles completam os testes automáticos do `backend` e do `frontend`, que
conferem as regras uma a uma. Aqui o que se confere é o caminho inteiro, do
clique até o banco de dados e de volta para a tela.

## Onde rodam

Numa cópia isolada do sistema, montada por `ambiente-e2e.mjs`: um banco de
dados próprio (`ufvet_e2e`), criado do zero com as contas de exemplo, a API
na porta 3100 e o site na 5180. O banco e os servidores do desenvolvimento
(portas 3000 e 5173) não são tocados, e nenhum e-mail sai de verdade: eles
viram arquivos numa pasta temporária.

## Como rodar

Precisa do PostgreSQL local ligado (o mesmo do desenvolvimento), do Microsoft
Edge e das dependências do `backend` e do `frontend` já instaladas.

```
npm install          # uma vez só, nesta pasta
npm run preparar     # recria o banco isolado com as contas de exemplo
npm run api          # deixe rodando num terminal
npm run site         # e este em outro
npm run todos        # roda os 18 roteiros, um depois do outro
```

Para rodar um só: `node ambiente-e2e.mjs rodar node fluxos-validacao.mjs`.
As fotos de cada passo ficam em `capturas/` e o resultado de cada roteiro em
`saida-*.txt` (os dois ficam fora do repositório).

## Os roteiros

| Roteiro | O que confere |
|---|---|
| `fluxos-login` | Login e cadastro em etapas, de tutor e de veterinário |
| `fluxos-email` | Links por e-mail: confirmação do cadastro e senha nova |
| `fluxos-conta` | Minha conta: dados, e-mail, senha, sair de todos os aparelhos, encerrar a conta |
| `fluxos-termos` | Página de termos e privacidade, e a janela dos termos no cadastro |
| `fluxos-animais` | Cadastrar, editar, pausar e excluir animais |
| `fluxos-fotos` | Fotos dos animais e de perfil, inclusive arquivos recusados |
| `fluxos-exames` | Envio de exames em imagem e PDF, quem vê e quem abre |
| `fluxos-apagar-exame` | Apagar um exame e o efeito na validação (F21) |
| `fluxos-validacao` | Validação, doação e observação feitas pelo veterinário |
| `fluxos-acesso` | Pedido e liberação de contatos, renovar e encerrar |
| `fluxos-busca` | Busca de doadores e perfil de outra pessoa |
| `fluxos-atualizacao` | A resposta do veterinário chega à tela do tutor sem recarregar |
| `fluxos-erros` | Nenhum clique "não faz nada": todo erro aparece explicado |
| `fluxos-abas` | Várias abas com a mesma conta, e troca de conta numa delas |
| `fluxos-celular` | Seções que abrem e fecham no celular |
| `fluxos-celular-2` | Topo, ajuda "?" e campos de 16px no celular |
| `fluxos-janelas` | Janelas que fecham arrastadas para baixo no celular |
| `fluxos-deslize` | Deslizar o dedo entre as seções no celular |

Os roteiros que usam a biblioteca axe-core (`fluxos-termos`, `fluxos-email`
e `fluxos-celular-2`) também procuram problemas de acessibilidade, como
contraste baixo e botões sem nome.

## De onde vieram

Os roteiros foram escritos entre o começo de outubro e 22/10/2026, junto com
o site, e rodavam numa pasta temporária do computador. Em 23/10 a limpeza
automática do Windows apagou essa pasta. Em 10/11 eles foram remontados a
partir do registro da conversa em que foram escritos (cada criação e cada
alteração, na ordem) e atualizados para o que o site mudou depois:

- os termos de uso estão na versão 6;
- desde 04/11, a busca mostra todo animal disponível e põe primeiro quem
  atende a mais critérios; só o tutor tira um animal da busca;
- desde 27/10, o botão "Remover foto de perfil" também tem "foto de perfil"
  no nome, então o campo da foto é procurado pelo nome exato;
- desde 10/10, uma janela aberta fecha sozinha quando a aba passa para outra
  conta; o roteiro das abas confere isso e que nada é enviado;
- a axe-core 4.14 confere também se o nome de um link contém o texto que
  aparece nele, então a verificação de acessibilidade espera a fonte dos
  ícones carregar (antes disso, a lupa aparece como a palavra "search").

Os arquivos que os roteiros enviam ao site (fotos, um PDF e arquivos
disfarçados) ficam em `imagens-teste/`; se forem apagados,
`node gerar-arquivos-teste.mjs` gera de novo.
