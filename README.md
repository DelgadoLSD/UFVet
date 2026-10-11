# UFVet

Portal web para conexão de doadores de sangue animal sob demanda, desenvolvido como Trabalho de Conclusão de Curso no curso de Ciência da Computação da UFV.

## Demo

[uf-vet.vercel.app](https://uf-vet.vercel.app/)

## Estrutura do repositório

| Pasta                  | O que tem                                                  |
| ---------------------- | ---------------------------------------------------------- |
| [frontend/](frontend/) | O site, em React ([como rodar](frontend/README.md))        |
| [backend/](backend/)   | A API e o banco de dados ([como rodar](backend/README.md)) |
| [docs/](docs/)         | Documentação do projeto                                    |

## Stack

- **Front-end:** React, Vite, Tailwind CSS e React Router
- **Back-end:** Node.js e Express, com PostgreSQL acessado pelo Prisma
- **Testes:** Vitest, no back-end e no front-end
- **Formatação:** Prettier, com a configuração em `.prettierrc.json`

## Documentação

- [Concepção](docs/concepcao/) — requisitos funcionais e não funcionais, casos
  de uso e diagramas
- [Modelagem do banco](docs/modelagem-bd/) — dicionário de dados, DER e o
  esquema do banco

## Status

- **Front-end:** todas as telas prontas e ligadas à API: login, cadastro, a
  página da conta, os perfis (com os animais, as fotos, os exames e o
  histórico clínico), a busca de doadores e o acesso aos contatos.
- **Back-end:** banco criado e testado, com os dados pessoais cifrados. A API
  já faz cadastro (veterinário só com convite), login, sessão, a própria
  conta (dados, foto, senha e encerramento) e os animais (cadastro, edição,
  exclusão, disponibilidade e fotos, sem a localização guardada pelo
  celular), o histórico clínico (validação veterinária com o tipo
  sanguíneo, doações e observações, só pelo veterinário), os exames (só o
  dono e os veterinários abrem os arquivos), a busca de doadores, pública e
  sem contatos, com o perfil de cada pessoa, e o acesso aos contatos
  (pedidos e liberações por veterinário).
- **Publicação:** no Render, com o banco no Neon
  ([passo a passo](backend/README.md#publicação-render--neon)).
