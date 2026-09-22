# Diagramas da Concepção

Um arquivo `.puml` por diagrama. O nome do arquivo é o identificador do
`@startuml`, que também é o nome da imagem gerada.

| Arquivo | Conteúdo | Uso na apresentação |
|---|---|---|
| `01-casos-de-uso-concepcao` | Casos de uso da Concepção, só processos de negócio | Visão geral, antes da demonstração |
| `02-casos-de-uso-completo` | Todos os agrupamentos, com estereótipos de complexidade | Apoio, se houver pergunta sobre cobertura |
| `03-uc-cadastrar-animal` | Caso de uso isolado, com requisitos rastreados | Antes do trecho correspondente da demo |
| `04-uc-encontrar-doador` | Caso de uso isolado, com requisitos rastreados | Antes do trecho correspondente da demo |
| `05-uc-solicitar-liberacao` | Caso de uso isolado, com requisitos rastreados | Antes do trecho correspondente da demo |
| `06-uc-liberar-acesso` | Caso de uso isolado, com requisitos rastreados | Antes do trecho correspondente da demo |
| `07-uc-validar-doador` | Caso de uso isolado, com requisitos rastreados | Antes do trecho correspondente da demo |
| `08-uc-registrar-doacao` | Caso de uso isolado, com requisitos rastreados | Antes do trecho correspondente da demo |
| `09-modelo-conceitual-preliminar` | Modelo conceitual, sem métodos nem multiplicidade | Transição para a modelagem do banco |

O diagrama `01` é deliberadamente a versão da Concepção: sem `<<include>>` nem
`<<extend>>`, que pertencem à Elaboração. Os relacionamentos de inclusão
aparecem apenas nos diagramas individuais, onde ajudam a explicar o processo.

## Como renderizar

- Cole o conteúdo de um arquivo em https://www.plantuml.com/plantuml/uml/
- No VS Code, use a extensão PlantUML (Alt+D para pré-visualizar)
- Com Java e o `plantuml.jar`, para gerar todos de uma vez:

```
java -jar plantuml.jar -tpng *.puml
```
