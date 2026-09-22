# UFVet — Modelo de dados

Documento de apoio ao TCC "Doação de Sangue Animal". Descreve o modelo de
dados do portal UFVet, as decisões que o sustentam e o dicionário de dados.

Atualizado em 20/09/2026. Banco: PostgreSQL. ORM: Prisma.

Arquivos que acompanham este documento:

| Arquivo | Para que serve |
|---|---|
| `ufvet.dbml` | Gera o DER em [dbdiagram.io](https://dbdiagram.io). Cole o conteúdo e exporte a imagem para o texto. |
| `der.pdf` | A última exportação do DER a partir do dbdiagram.io. |
| [`../../backend/prisma/schema.prisma`](../../backend/prisma/schema.prisma) | O esquema executável. É dele que saem as tabelas reais e o cliente de acesso do back-end. |

Os três descrevem o mesmo modelo em níveis diferentes: o DER para leitura
humana, este documento para consulta, o schema para a máquina.

---

## 1. O que o sistema precisa guardar

O UFVet conecta tutores de animais doadores a quem precisa de sangue durante
uma emergência. Não existe banco de sangue na UFV: o portal não estoca nada,
ele encurta o caminho até um doador compatível e disponível.

Disso decorrem quatro perguntas que o banco precisa responder:

1. **Quem são os doadores e onde estão?** Animais com espécie, porte, idade e
   localização aproximada, ligados a um tutor que aceitou ser procurado.
2. **Em quem dá para confiar?** Um veterinário confere exames e assina que o
   animal atende aos critérios de doação. Essa assinatura tem validade e
   precisa ser rastreável.
3. **Quem pode falar com quem?** O telefone de um tutor não fica aberto a
   qualquer pessoa cadastrada. Veterinários veem sempre; tutores só com
   autorização temporária de um veterinário, que expira sozinha.
4. **O que já aconteceu?** Cada coleta realizada, para controlar o intervalo
   de recuperação do animal e sustentar o histórico.

## 2. Entidades

### Pessoas e locais

**`usuario`** — uma conta, de tutor ou de veterinário. Os dois papéis dividem
a mesma tabela porque um veterinário também é tutor dos próprios animais: no
sistema ele valida, registra coletas e ainda cadastra o cachorro dele.
Separar em duas tabelas exigiria duplicar quem é as duas coisas.

**`veterinario`** — extensão 1:1 de `usuario` com o que só existe para quem é
profissional: CRMV, UF do conselho e o estabelecimento onde atua. Fica em
tabela própria para não deixar metade das colunas nulas em toda conta de
tutor.

**`estabelecimento`** — hospital veterinário ou clínica. A clínica particular
de um veterinário entra aqui como mais um registro; não existe caso especial
para ela.

**`aceite`** — registro de que o usuário aceitou os termos de uso e declarou
ciência sobre os custos de insumos, com a versão vigente na data. É a prova
documental do consentimento.

### Animal e seus exames

**`animal`** — o doador. Espécie, raça, sexo, castração, idade, peso, tipo
sanguíneo e disponibilidade.

**`animal_foto`** — até cinco fotos, com ordem; a de ordem zero é a principal.

**`documento`** e **`documento_versao`** — os exames. O documento é a
identidade ("hemograma deste animal"); as versões são os arquivos. Um exame
refeito não substitui o anterior: entra como versão nova, e o histórico fica
disponível para o veterinário comparar a evolução.

### Validação clínica

**`validacao`** — o ato assinado por um veterinário atestando que conferiu os
critérios de doação. Guarda quem assinou, o CRMV, quando, até quando vale
(um ano) e uma nota opcional.

**`validacao_criterio`** — os cinco critérios avaliados, cada um marcado como
atendido ou não. Ficam em tabela própria, e não em cinco colunas booleanas,
porque a lista pode mudar quando o protocolo do hospital mudar — acrescentar
um critério vira uma linha, não uma alteração de esquema.

**`observacao`** — anotações de veterinários sobre o comportamento do animal
durante a coleta, para a próxima equipe se preparar. São distintas da
validação: não atestam nada, orientam o manejo.

### Doação

**`doacao`** — uma coleta que aconteceu, registrada pelo veterinário que a
acompanhou: data, volume, local e assinatura.

### Acesso aos contatos

**`pedido_liberacao`** — um tutor pede a um veterinário específico que libere
o acesso aos contatos, explicando o caso.

**`liberacao_contato`** — a autorização concedida, com prazo. Vence sozinha, e
o veterinário pode renovar ou encerrar antes.

## 3. Relacionamentos e cardinalidades

| Relacionamento | Cardinalidade | Leitura |
|---|---|---|
| `usuario` → `veterinario` | 1:1 (opcional) | Uma conta tem, no máximo, um registro profissional |
| `estabelecimento` → `veterinario` | 1:N | Um local tem vários veterinários; cada um atua em um local |
| `usuario` → `animal` | 1:N | Um tutor tem vários animais; cada animal tem um tutor |
| `animal` → `animal_foto` | 1:N | Até cinco fotos por animal |
| `animal` → `documento` | 1:N | Um documento por tipo e por animal |
| `documento` → `documento_versao` | 1:N | Cada envio é uma versão |
| `animal` → `validacao` | 1:N | Histórico: renovar gera uma validação nova |
| `validacao` → `validacao_criterio` | 1:N | Cinco linhas por validação |
| `validacao` → `animal` | 1:1 (opcional) | A validação que confirmou o tipo sanguíneo vigente |
| `animal` → `doacao` | 1:N | Um animal doa várias vezes |
| `estabelecimento` → `doacao` | 1:N | Onde a coleta foi feita |
| `usuario` → `doacao` | 1:N | Quem registrou a coleta |
| `usuario` → `pedido_liberacao` | 1:N (duas vezes) | Um como solicitante, outro como destinatário |
| `usuario` → `liberacao_contato` | 1:N (duas vezes) | Um como autorizado, outro como quem autorizou |

Os relacionamentos duplos com `usuario` (pedido e liberação) existem porque
essas duas entidades registram sempre uma relação entre **duas** pessoas: quem
pede e quem autoriza.

## 4. Regras que o modelo sustenta

**O tipo sanguíneo não é preenchido pelo tutor.** A coluna
`animal.tipo_sanguineo` nasce nula e só é escrita quando um veterinário
assina o critério de tipagem. Um palpite de tutor exibido com a mesma
aparência de um dado conferido engana quem procura doador e pode levar outro
veterinário a considerar a tipagem já validada.

**Registro assinado nunca é editado.** Uma validação não muda depois de
assinada. Ela perde efeito de três formas: vence (um ano), é invalidada (o
tutor alterou peso ou data de nascimento, dados que o veterinário havia
conferido) ou é substituída por uma validação mais recente. As colunas
`invalidada_em` e `invalidada_motivo` registram a segunda hipótese.

**Total de doações e data da última não são colunas.** Saem de `COUNT` e
`MAX` sobre `doacao`. Não existe contador guardado que possa discordar do
histórico. O intervalo de recuperação de 90 dias conta a partir da
`data_coleta` mais recente.

**Autorização de contato expira sozinha.** `liberacao_contato.expira_em` é
absoluta; nenhuma rotina precisa rodar para revogar. Uma autorização está
ativa quando `encerrada_em IS NULL AND expira_em > agora()`. O controle de
quem vê um contato está aí, no momento em que o acesso é concedido, e não numa
auditoria posterior.

**Cada veterinário administra apenas o que liberou.** O painel do profissional
filtra por `liberacao_contato.veterinario_id`: renovar ou encerrar é
prerrogativa de quem assumiu a responsabilidade por aquele acesso. A
verificação de duplicidade, porém, considera todas as autorizações ativas do
tutor — quem já tem acesso concedido por um colega não precisa de uma segunda
autorização.

## 5. Decisões de projeto

### Cópias deliberadas (desnormalização)

O modelo está em terceira forma normal, com duas exceções conscientes:

**Nome e CRMV copiados em `validacao` e `doacao`.** Poderiam ser lidos do
cadastro do veterinário por chave estrangeira. São copiados porque a
assinatura precisa continuar legível mesmo que o profissional mude de
registro ou encerre a conta. É o mesmo princípio de uma nota fiscal, que
guarda o endereço do comprador na data da emissão e não busca o endereço
atual.

**`animal.tipo_sanguineo` duplicado da validação.** O valor canônico está na
validação que o confirmou, e `tipagem_validacao_id` aponta para ela. A cópia
existe porque esse campo é lido em toda linha de resultado da busca;
derivá-lo exigiria, para cada animal, buscar a validação mais recente não
invalidada e verificar o critério de tipagem.

### Ausências deliberadas

**Sem coluna de idade.** O modelo guarda a data de nascimento e deriva a idade
a cada exibição. Guardar o número seria guardar um dado com prazo de validade:
estaria certo no dia do cadastro e errado no aniversário seguinte, e nenhum
tutor volta ao sistema para corrigir isso.

Uma versão anterior tinha duas colunas alternativas — a data, quando conhecida,
e uma idade estimada em anos, quando não. A estimativa, porém, congelava no ano
do cadastro: o animal envelhecia e o número não. Isso importa porque a idade
alimenta o critério `PESO_IDADE` da validação veterinária, e um critério
assinado sobre idade defasada é exatamente o que `EDICAO_NASCIMENTO` existe para
evitar — só que o decurso do tempo não dispara invalidação nenhuma.

A solução foi converter a estimativa na data equivalente no momento do cadastro,
marcando-a como aproximada. Restou uma única coluna de data, obrigatória, e uma
única regra de derivação; o booleano decide apenas se a tela escreve "5 anos" ou
"~5 anos". A troca também eliminou a restrição `CHECK` que garantia o
preenchimento de uma coluna ou da outra, e nada se afirma com precisão que o
dado não tem: a data aproximada nunca é exibida.

**Sem latitude e longitude.** Uma versão anterior da busca filtrava por
distância em quilômetros, o que exigiria geocodificar o CEP e guardar a
coordenada da casa de cada tutor. Foi substituída por filtro de cidade e
bairro: quem conhece a cidade já sabe quais bairros ficam perto do hospital,
e o ganho não justificava coletar dado de localização precisa.

**Sem registro de consultas aos contatos.** Uma versão anterior do modelo
guardava cada abertura de contato: quem viu, de quem era e sob qual
autorização. A ideia era dar rastreabilidade ao tutor. Foi removida por não
entregar retorno proporcional ao custo.

O argumento é que o controle já acontece antes, e não depois: o contato só
aparece para quem um veterinário autorizou, por prazo determinado. Saber
depois o nome de quem abriu não dá ao tutor nenhuma ação possível — não havia
denúncia, bloqueio ou consequência ligada àquele registro. Em troca, a tabela
custava uma entidade, duas telas e, principalmente, uma exceção na regra de
exclusão de conta, já que precisava sobreviver ao encerramento para continuar
servindo ao outro titular. Remover devolveu ao modelo uma regra de exclusão
uniforme.

**Sem métricas agregadas.** Não há tabelas de estatística por período. Os
números que a interface mostra são contagens diretas. Relatórios ficam como
trabalho futuro.

**Sem tabela associativa entre veterinário e estabelecimento.** Cada
veterinário atua em um local. O caso de atuação simultânea em dois lugares
existe na realidade, mas exigiria refazer as telas que hoje assumem um local
único, sem resolver nenhum problema do escopo.

## 6. Encerramento de conta e LGPD

O art. 18 da LGPD garante ao titular o direito à eliminação dos dados
tratados com consentimento; o art. 16 admite conservação em hipóteses
específicas, e o art. 12 coloca dado anonimizado fora do alcance da lei.

O modelo implementa a seguinte regra: **apaga-se o que é só sobre a pessoa;
preserva-se o que documenta um ato praticado sobre o animal de outra pessoa.**

Na prática, encerrar uma conta remove em cascata o usuário, seus animais,
fotos, documentos, validações desses animais, doações desses animais, seus
pedidos e as autorizações de que participou. É o comportamento das chaves
estrangeiras marcadas com `ON DELETE CASCADE`.

Apenas um caso escapa da cascata, em duas tabelas:

**Validações e doações assinadas em animais de terceiros.** Se um veterinário
encerra a conta, as validações que ele assinou e as coletas que registrou nos
animais de outros tutores permanecem. Apagá-las destruiria dado clínico de
quem não pediu nada — a tutora perderia a validação do animal dela por decisão
de um terceiro, e teria de refazer exames. A chave estrangeira é anulada
(`ON DELETE SET NULL`), enquanto o nome e o CRMV permanecem nas colunas de
cópia, mantendo a assinatura legível.

Cabe confirmar com o hospital se a guarda desse registro está sujeita às
regras de prontuário do CFMV. Se estiver, a base legal deixa de ser
consentimento e passa a ser obrigação regulatória, prevista no art. 16, I.

## 7. Consultas que o modelo precisa responder bem

| Consulta | Onde acontece | Índice |
|---|---|---|
| Doadores de uma espécie, disponíveis | Busca | `animal (especie, disponivel)` |
| Filtro por tipo sanguíneo | Busca | `animal (tipo_sanguineo)` |
| Animais de um tutor | Perfil | `animal (tutor_id)` |
| Doadores de uma cidade e bairro | Busca | `usuario (cidade, bairro)` |
| Pedidos pendentes de um veterinário | Painel do veterinário | `pedido_liberacao (veterinario_id, status)` |
| Autorização ativa de um tutor | Toda tela que mostra contato | `liberacao_contato (tutor_id, expira_em)` |
| Histórico de coletas de um animal | Ficha do animal | `doacao (animal_id, data_coleta)` |

## 8. Restrições a implementar fora do esquema

Algumas regras não são expressáveis em declaração de tabela e ficam na camada
da aplicação ou em migração com SQL puro:

- No máximo cinco fotos por animal.
- No máximo um pedido com status `PENDENTE` por tutor (índice único parcial:
  `CREATE UNIQUE INDEX ... ON pedido_liberacao (tutor_id) WHERE status = 'PENDENTE'`).
- `validacao.valida_ate` é sempre `realizada_em` mais um ano.
- `tipo_sanguineo_confirmado` é obrigatório quando o critério `TIPAGEM` está
  atendido.
- Os valores de tipo sanguíneo aceitos dependem da espécie (DEA para cães,
  A/B/AB para gatos).

---

## Dicionário de dados

Tipos em notação PostgreSQL. PK = chave primária, FK = chave estrangeira,
UQ = restrição de unicidade.

### `estabelecimento`

| Campo | Tipo | Restrições | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador |
| nome | varchar(120) | NOT NULL | Nome do hospital ou clínica |
| cidade | varchar(80) | NOT NULL | Cidade |
| uf | char(2) | NOT NULL | Unidade federativa |
| endereco | varchar(160) | NULL | Logradouro |
| telefone | varchar(20) | NULL | Telefone do local |
| criado_em | timestamptz | NOT NULL | Data de cadastro |

### `usuario`

| Campo | Tipo | Restrições | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador |
| codigo | char(6) | UQ, NOT NULL | Código público (#T3M8P1) usado para liberar acesso e endereçar pedidos |
| papel | enum | NOT NULL | TUTOR ou VETERINARIO |
| nome_completo | varchar(120) | NOT NULL | Nome civil |
| cpf | char(11) | UQ, NOT NULL | Identifica a pessoa nos registros de doação |
| email | varchar(160) | UQ, NOT NULL | Login e contato |
| senha_hash | varchar(72) | NOT NULL | Hash bcrypt; a senha nunca é armazenada em texto |
| telefone | varchar(20) | NOT NULL | Contato protegido pelas regras de liberação |
| cep | char(8) | NOT NULL | CEP |
| cidade | varchar(80) | NOT NULL | Cidade, usada no filtro da busca |
| bairro | varchar(80) | NOT NULL | Bairro, usado no filtro da busca |
| foto_url | varchar(255) | NULL | Foto de perfil |
| criado_em | timestamptz | NOT NULL | Data de cadastro |
| atualizado_em | timestamptz | NOT NULL | Última alteração |

### `veterinario`

| Campo | Tipo | Restrições | Descrição |
|---|---|---|---|
| usuario_id | uuid | PK, FK → usuario | Extensão 1:1 da conta |
| crmv | varchar(12) | NOT NULL, UQ com uf_crmv | Registro profissional |
| uf_crmv | char(2) | NOT NULL | UF do conselho |
| tratamento | enum | NOT NULL | DR ou DRA; existe apenas para a assinatura na interface |
| estabelecimento_id | uuid | FK → estabelecimento | Onde atua |

### `aceite`

| Campo | Tipo | Restrições | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador |
| usuario_id | uuid | FK → usuario | Quem aceitou |
| tipo | enum | NOT NULL | TERMOS_DE_USO ou CIENCIA_RESPONSABILIDADE |
| versao | varchar(20) | NOT NULL | Versão do texto aceito |
| aceito_em | timestamptz | NOT NULL | Momento do aceite |

### `animal`

| Campo | Tipo | Restrições | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador |
| codigo | char(6) | UQ, NOT NULL | Código público do animal |
| tutor_id | uuid | FK → usuario | Dono |
| nome | varchar(60) | NOT NULL | Nome do animal |
| especie | enum | NOT NULL | CAO ou GATO |
| raca | varchar(60) | NULL | Nulo quando SRD ou desconhecida |
| sexo | enum | NOT NULL | MACHO ou FEMEA |
| castrado | boolean | NOT NULL | Afeta a aptidão de fêmeas em cio, gestação ou lactação |
| data_nascimento | date | NOT NULL | A idade é sempre derivada dela, nunca armazenada |
| nascimento_aproximado | boolean | NOT NULL, default false | Verdadeiro quando a data veio de estimativa do tutor; afeta só a exibição |
| peso_kg | decimal(5,2) | NOT NULL | Peso; critério mínimo e filtro da busca |
| tipo_sanguineo | varchar(20) | NULL | Só preenchido por veterinário ao assinar a tipagem |
| tipagem_validacao_id | uuid | UQ, FK → validacao, NULL | Validação que confirmou o tipo |
| disponivel | boolean | NOT NULL, default true | O tutor pode pausar a disponibilidade |
| criado_em | timestamptz | NOT NULL | Data de cadastro |
| atualizado_em | timestamptz | NOT NULL | Última alteração |

### `animal_foto`

| Campo | Tipo | Restrições | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador |
| animal_id | uuid | FK → animal | Animal |
| url | varchar(255) | NOT NULL | Endereço do arquivo |
| ordem | smallint | NOT NULL, UQ com animal_id | Zero é a foto principal |
| criado_em | timestamptz | NOT NULL | Data do envio |

### `documento`

| Campo | Tipo | Restrições | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador |
| animal_id | uuid | FK → animal, UQ com tipo | Animal |
| tipo | enum | NOT NULL | HEMOGRAMA, SOROLOGIA ou VACINACAO |
| criado_em | timestamptz | NOT NULL | Criação |

### `documento_versao`

| Campo | Tipo | Restrições | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador |
| documento_id | uuid | FK → documento | Documento |
| arquivo_url | varchar(255) | NOT NULL | Endereço do arquivo enviado |
| enviado_por_id | uuid | FK → usuario, NULL | Quem enviou |
| enviado_por_nome | varchar(120) | NOT NULL | Nome copiado no envio |
| enviado_em | timestamptz | NOT NULL | Momento do envio |

### `validacao`

| Campo | Tipo | Restrições | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador |
| animal_id | uuid | FK → animal | Animal validado |
| veterinario_id | uuid | FK → usuario, NULL | Quem assinou; anulado se a conta for encerrada |
| veterinario_nome | varchar(120) | NOT NULL | Nome copiado na assinatura |
| crmv | varchar(12) | NOT NULL | CRMV copiado na assinatura |
| uf_crmv | char(2) | NOT NULL | UF do conselho |
| realizada_em | date | NOT NULL | Data da validação |
| valida_ate | date | NOT NULL | Um ano após a validação |
| tipo_sanguineo_confirmado | varchar(20) | NULL | Resultado da tipagem, quando conferida |
| nota | text | NULL | Observação do veterinário sobre pendências |
| invalidada_em | timestamptz | NULL | Preenchido quando perde efeito antes do vencimento |
| invalidada_motivo | enum | NULL | EDICAO_PESO, EDICAO_NASCIMENTO ou NOVA_VALIDACAO |
| criado_em | timestamptz | NOT NULL | Criação do registro |

### `validacao_criterio`

| Campo | Tipo | Restrições | Descrição |
|---|---|---|---|
| validacao_id | uuid | PK composta, FK → validacao | Validação |
| criterio | enum | PK composta | TIPAGEM, PESO_IDADE, VACINACAO, SOROLOGIAS, SEM_TRANSFUSAO |
| atendido | boolean | NOT NULL | Se o critério foi cumprido |

### `observacao`

| Campo | Tipo | Restrições | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador |
| animal_id | uuid | FK → animal | Animal |
| autor_id | uuid | FK → usuario, NULL | Veterinário que anotou |
| autor_nome | varchar(120) | NOT NULL | Nome copiado na anotação |
| texto | text | NOT NULL | A observação |
| criado_em | timestamptz | NOT NULL | Momento |

### `doacao`

| Campo | Tipo | Restrições | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador |
| animal_id | uuid | FK → animal | Doador |
| estabelecimento_id | uuid | FK → estabelecimento | Onde a coleta foi feita |
| veterinario_id | uuid | FK → usuario, NULL | Quem registrou |
| veterinario_nome | varchar(120) | NOT NULL | Nome copiado no registro |
| crmv | varchar(12) | NOT NULL | CRMV copiado no registro |
| uf_crmv | char(2) | NOT NULL | UF do conselho |
| data_coleta | date | NOT NULL | Dia da coleta; base do intervalo de recuperação |
| volume_ml | smallint | NOT NULL | Volume coletado |
| nota | text | NULL | Como foi a coleta |
| criado_em | timestamptz | NOT NULL | Momento do registro |

### `pedido_liberacao`

| Campo | Tipo | Restrições | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador |
| tutor_id | uuid | FK → usuario | Quem pede |
| veterinario_id | uuid | FK → usuario | A quem o pedido é endereçado |
| caso | text | NOT NULL | O que está acontecendo |
| status | enum | NOT NULL, default PENDENTE | PENDENTE, ATENDIDO ou RECUSADO |
| criado_em | timestamptz | NOT NULL | Envio |
| respondido_em | timestamptz | NULL | Resposta |

### `liberacao_contato`

| Campo | Tipo | Restrições | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador |
| tutor_id | uuid | FK → usuario | Quem recebeu o acesso |
| veterinario_id | uuid | FK → usuario | Quem autorizou |
| pedido_id | uuid | UQ, FK → pedido_liberacao, NULL | Pedido que originou, se houve |
| caso | varchar(160) | NULL | Identificação do atendimento |
| concedida_em | timestamptz | NOT NULL | Início |
| duracao_horas | smallint | NOT NULL | 24, 72 ou 168 |
| expira_em | timestamptz | NOT NULL | Vencimento automático |
| encerrada_em | timestamptz | NULL | Encerramento manual antes do prazo |
| criado_em | timestamptz | NOT NULL | Criação |
