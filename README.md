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

- **Front-end:** todas as telas prontas. Login, cadastro e a página da conta
  já falam com a API; as outras telas ainda usam dados de exemplo.
- **Back-end:** banco criado e testado, com os dados pessoais cifrados. A API
  já faz cadastro (veterinário só com convite), login, sessão e a própria
  conta (dados, senha e encerramento).
- **Próxima etapa:** ligar as outras funcionalidades à API, uma por vez.
