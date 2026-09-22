# UFVet — Casos de uso, conceitos e consultas

Fase de Concepção (RUP). Organização dos requisitos conforme Wazlawick (2004).
Acompanha o Documento de Requisitos e os diagramas em `diagramas.puml`.

Versão de 21/09/2026.

---

## 1. Critério de caracterização adotado

Só foi considerado caso de uso o processo que atende às três condições do
método: **monossessão** (inicia e termina sem interrupção), **interativo**
(troca informação com um ator nos dois sentidos) e **resultado consistente**
(produz registro completo).

Por esse critério, seis processos do UFVet são casos de uso. As demais funções
foram organizadas como **conceitos** (operações de manutenção, padrão CRUD) ou
**consultas** (acesso a informação, sem alteração de estado).

Uma observação sobre a fronteira: "solicitar liberação" e "liberar acesso"
poderiam parecer um processo único, já que um responde ao outro. São dois casos
de uso porque acontecem em sessões diferentes, de pessoas diferentes, em
momentos diferentes. O tutor solicita e sua sessão termina; o veterinário
libera quando puder.

---

## 2. Casos de uso (processos de negócio)

| Nome | Atores | Descrição | Ref. cruzadas |
|---|---|---|---|
| **Cadastrar animal doador** | Tutor | O tutor informa os dados do animal — nome, espécie, raça, sexo, castração, idade e peso — e envia fotos. O sistema gera o código público do animal e o disponibiliza na busca. | F6, F8, F12 |
| **Encontrar doador compatível** | Tutor, Veterinário, Visitante | Quem precisa de sangue filtra os doadores por espécie, tipo sanguíneo, peso e localização, examina os perfis e, tendo permissão vigente, obtém o contato do tutor para combinar a doação. | F16, F17, F18, F33 |
| **Solicitar liberação de acesso aos contatos** | Tutor | O tutor identifica o veterinário que acompanha seu caso, pelo código ou pela lista do estabelecimento, descreve a situação e envia o pedido. | F27 |
| **Liberar acesso aos contatos** | Veterinário | O veterinário identifica o tutor pelo código, confere os dados exibidos, escolhe a duração e concede o acesso. Pode também recusar um pedido recebido, renovar ou encerrar uma liberação que concedeu. | F28, F29, F30, F31, F34 |
| **Validar doador** | Veterinário | O veterinário examina os exames enviados, marca quais critérios de aptidão foram conferidos, informa o tipo sanguíneo quando confirma a tipagem, registra observação se houver pendência e assina a validação com seu CRMV. | F19, F20, F21, F22 |
| **Registrar doação realizada** | Veterinário | Depois da coleta, o veterinário registra o dia, o volume, o estabelecimento e uma anotação opcional sobre como foi o procedimento. O registro recalcula a disponibilidade do animal. | F13, F24, F26 |

---

## 3. Conceitos (CRUD)

I = incluir · A = alterar · E = excluir · C = consultar

| Conceito | I | A | E | C | Observação | Ref. cruzadas |
|---|---|---|---|---|---|---|
| **Usuário** | x | x | x | x | A exclusão remove o usuário e tudo que é exclusivamente seu. Validações e doações que ele tenha assinado em animais de terceiros permanecem, com a assinatura preservada. CPF e CRMV não são alteráveis. A autenticação (F2) é pré-condição de todos os casos de uso, conforme a seção 4.1. | F1, F2, F3, F4, F5, F6, F7 |
| **Animal** | x | x | x | x | A inclusão acontece pelo caso de uso "Cadastrar animal doador". O tipo sanguíneo não é alterável pelo tutor: só é gravado pelo caso de uso "Validar doador". | F8, F9, F10, F11 |
| **Exame** | x | | | x | Não há alteração nem exclusão: um exame refeito entra como nova versão e o histórico permanece. | F14, F15 |
| **Observação** | x | | | x | Registrada pelo caso de uso "Validar doador" ou isoladamente. Não é editável, por ser anotação datada e assinada. | F23 |
| **Validação** | x | | | x | A inclusão só acontece pelo caso de uso "Validar doador". Não é alterável nem excluível: perde efeito por vencimento, por invalidação automática ou por ser substituída. | F19, F20, F21, F22 |
| **Doação** | x | | | x | A inclusão só acontece pelo caso de uso "Registrar doação realizada". Não é alterável, por ser registro assinado de um fato ocorrido. | F24, F26 |
| **Pedido de liberação** | x | x | | x | A inclusão acontece pelo caso de uso "Solicitar liberação". A alteração se limita à mudança de situação — atendido ou recusado. | F27, F29, F34 |
| **Liberação** | x | x | x | x | A inclusão acontece pelo caso de uso "Liberar acesso". A alteração é a renovação de prazo; a exclusão é o encerramento antecipado. Expira sozinha. | F28, F30, F31, F32 |
| **Estabelecimento** | x | x | x | x | Cadastro administrativo. Não pode ser excluído havendo veterinários ou doações vinculados. | — |

**Nota sobre complexidade.** "Manter Animal" não é um CRUD trivial: a inclusão
tem etapas, aceita anexos e alimenta a busca; a alteração dispara a
invalidação de validações (F21); a exclusão remove registros clínicos
associados. Por isso a inclusão foi tratada como caso de uso próprio, e não
como operação de manutenção.

---

## 4. Consultas

| Nome | Filtros | Atores | Ref. cruzadas |
|---|---|---|---|
| **Doadores disponíveis** | Espécie, tipo sanguíneo, peso máximo, cidade, bairro, situação de validação, texto livre | Visitante, Tutor, Veterinário | F16, F17, F18 |
| **Histórico de doações do animal** | Animal | Tutor, Veterinário | F25, F26 |
| **Exames do animal** | Animal, tipo de documento | Tutor, Veterinário | F14, F15 |
| **Liberações ativas** | Veterinário responsável | Veterinário | F28, F32 |

**Verificação de rastreabilidade.** Todos os trinta e cinco requisitos
funcionais aparecem em pelo menos um caso de uso, conceito ou consulta. Os que
constam apenas em conceitos — F1 a F7 e F11 — são operações de manutenção sem
processo de negócio próprio. F35 é atendido por conteúdo estático, sem
persistência associada, e por isso não figura em nenhum dos três agrupamentos;
é a única exceção, registrada aqui deliberadamente.

### 4.1 Sobre o login

A autenticação (F2) merece registro à parte porque é o caso clássico de
requisito que parece caso de uso e não é. Pelo critério adotado, ela falha no
teste do **resultado consistente**: ninguém liga o computador, faz login e
desliga satisfeito. O login não é um fim, é a condição para começar qualquer
outro processo.

Optou-se, então, por tratá-lo em dois lugares: como operação do conceito
Usuário, onde vive a credencial, e como restrição de acesso nos requisitos
não-funcionais de cada função que exige perfil específico — NF19.1, NF24.1 e
NF28.1. Assim o requisito fica rastreado sem inflar o diagrama com um caso de
uso que não descreve processo de negócio nenhum.

---

## 5. Priorização

Seguindo a orientação de atacar primeiro o que tem mais risco:

| Prioridade | Item | Justificativa |
|---|---|---|
| 1 | Validar doador | Maior risco do trabalho: concentra as regras clínicas, a assinatura profissional e a invalidação automática. Um erro aqui compromete a confiança no dado. |
| 2 | Liberar acesso aos contatos | Segundo maior risco: envolve dois papéis, prazo, expiração autônoma e proteção de dado pessoal. |
| 3 | Encontrar doador compatível | É a razão de o sistema existir, mas tecnicamente mais previsível que os dois anteriores. |
| 4 | Cadastrar animal doador | Processo de negócio com anexos e regras de aptidão. |
| 5 | Registrar doação realizada | Processo curto, com efeito sobre a disponibilidade. |
| 6 | Solicitar liberação de acesso | Processo curto e de baixa incerteza. |
| 7 | Conceitos (CRUD) | Padrão bem definido, risco médio. |
| 8 | Consultas | Não alteram estado, risco baixo. |

A ordem explica por que a interface foi construída antes do serviço: os dois
processos de maior risco são de natureza clínica, e precisavam ser conferidos
com o Hospital Veterinário antes de qualquer decisão de implementação. Construir
a interface primeiro permitiu levar telas navegáveis à conversa, em vez de
descrições.

---

## 6. Relação entre os diagramas e a apresentação

Os blocos do arquivo `diagramas.puml` foram preparados para uso direto em
slides:

| Bloco | Conteúdo | Uso sugerido |
|---|---|---|
| `01-casos-de-uso-concepcao` | Diagrama da Concepção, só processos de negócio | Visão geral, antes da demonstração |
| `02-casos-de-uso-completo` | Todos os agrupamentos, com estereótipos | Apoio, se houver pergunta sobre cobertura |
| `03` a `08` | Um diagrama por caso de uso, com os requisitos rastreados | Exibir antes do vídeo correspondente |
| `09-modelo-conceitual-preliminar` | Modelo conceitual, sem métodos nem multiplicidade | Transição para a modelagem do banco |

O diagrama `01` é deliberadamente a versão da Concepção: sem `<<include>>` nem
`<<extend>>`, que pertencem à Elaboração. Os relacionamentos de inclusão
aparecem apenas nos diagramas individuais, onde ajudam a explicar o processo.

---

## Referências

WAZLAWICK, R. S. *Análise e projeto de sistemas de informação orientados a
objetos*. 1. ed. São Paulo: Campus-Elsevier, 2004.

WAZLAWICK, R. S. *Análise e projeto de sistemas de informação orientados a
objetos*. 2. ed. São Paulo: Campus-Elsevier, 2010.
