# UFVet

Portal web para conexão de doadores de sangue animal sob demanda, desenvolvido como Trabalho de Conclusão de Curso no curso de Ciência da Computação da UFV.

## Demo

[uf-vet.vercel.app](https://uf-vet.vercel.app/)

## Estrutura do repositório

| Pasta                  | O que tem                                                           |
| ---------------------- | ------------------------------------------------------------------- |
| [frontend/](frontend/) | O site, em React ([como rodar](frontend/README.md))                 |
| [backend/](backend/)   | Banco de dados e, em breve, a API ([como rodar](backend/README.md)) |
| [docs/](docs/)         | Documentação do projeto                                             |

## Stack

- **Front-end:** React, Vite, Tailwind CSS e React Router
- **Back-end:** Node.js, PostgreSQL e Prisma; a API será em Express
- **Testes:** Vitest
- **Formatação:** Prettier, com a configuração em `.prettierrc.json`

## Documentação

- [Concepção](docs/concepcao/) — requisitos funcionais e não funcionais, casos
  de uso e diagramas
- [Modelagem do banco](docs/modelagem-bd/) — dicionário de dados, DER e o
  esquema do banco

## Status

- **Front-end:** todas as telas prontas, ainda com dados de exemplo no lugar
  da API.
- **Banco de dados:** criado e testado, com os dados pessoais cifrados.
- **Próxima etapa:** a API em Express e a ligação do front-end com ela.
