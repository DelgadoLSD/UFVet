# UFVet — Documento de Requisitos

Fase de Concepção (RUP). Elaborado conforme o modelo de Wazlawick (2004),
apresentado em INF323 — Engenharia de Software II.

TCC — Ciência da Computação, UFV. Versão de 25/09/2026.

---

## 1. Visão geral do sistema

O Hospital Veterinário da UFV não possui banco de sangue animal. Quando um
animal chega precisando de transfusão, encontrar um doador compatível depende
de ligações, grupos de mensagens e da memória de quem está de plantão.

O UFVet é um portal web que encurta esse caminho **durante** a emergência. Ele
não estoca sangue: mantém um cadastro de animais doadores, permite filtrar por
critérios que importam para a transfusão e controla quem pode falar com o tutor
de cada doador.

Três características orientam todo o sistema:

1. **A confiança no dado é o produto.** Um doador cujos exames foram conferidos
   por um veterinário encurta a triagem no hospital. Por isso a validação
   clínica é um ato assinado, com prazo e rastreável.
2. **O contato é protegido.** Quem cadastra um doador aceita ser procurado em
   uma emergência, não ter o telefone aberto a qualquer pessoa cadastrada.
3. **O sistema atende vários locais.** Hospitais e clínicas são cadastros do
   sistema, não constantes.

### Atores

| Ator | Descrição |
|---|---|
| **Visitante** | Pessoa não autenticada. Consulta o conteúdo informativo e a busca de doadores, sem ver contatos. |
| **Tutor** | Usuário autenticado que cadastra animais como doadores e procura doadores quando precisa. |
| **Veterinário** | Usuário autenticado com CRMV, vinculado a um estabelecimento. Faz tudo o que um tutor faz — inclusive cadastrar os próprios animais — e ainda valida doadores, registra coletas e autoriza o acesso de tutores aos contatos. |

O Veterinário **é um** Tutor com atribuições adicionais. Essa generalização é o
motivo de os dois papéis compartilharem o mesmo cadastro.

---

## 2. Índice de requisitos

### Requisitos funcionais

| Código | Nome | Categoria | Obrigatoriedade |
|---|---|---|---|
| F1 | Cadastrar usuário | Evidente | Obrigatório |
| F2 | Autenticar usuário | Evidente | Obrigatório |
| F3 | Manter dados da conta | Evidente | Obrigatório |
| F4 | Alterar senha | Evidente | Obrigatório |
| F5 | Encerrar conta | Evidente | Obrigatório |
| F6 | Gerar código público de identificação | Oculto | Obrigatório |
| F7 | Registrar aceite dos termos | Oculto | Obrigatório |
| F8 | Cadastrar animal doador | Evidente | Obrigatório |
| F9 | Editar dados do animal | Evidente | Obrigatório |
| F10 | Excluir animal | Evidente | Obrigatório |
| F11 | Alterar disponibilidade do animal | Evidente | Obrigatório |
| F12 | Derivar a idade do animal | Oculto | Obrigatório |
| F13 | Controlar o intervalo de recuperação | Oculto | Obrigatório |
| F14 | Enviar exames do animal | Evidente | Obrigatório |
| F15 | Versionar exames enviados | Oculto | Obrigatório |
| F16 | Buscar doadores | Evidente | Obrigatório |
| F17 | Ordenar resultados da busca | Evidente | Desejável |
| F18 | Restringir resultados por tipagem confirmada | Oculto | Obrigatório |
| F19 | Validar critérios de doação | Evidente | Obrigatório |
| F20 | Registrar o tipo sanguíneo confirmado | Evidente | Obrigatório |
| F21 | Invalidar validação por alteração de dado conferido | Oculto | Obrigatório |
| F22 | Expirar validação por decurso de prazo | Oculto | Obrigatório |
| F23 | Registrar observação sobre a coleta | Evidente | Desejável |
| F24 | Registrar doação realizada | Evidente | Obrigatório |
| F25 | Consultar histórico de doações | Evidente | Obrigatório |
| F26 | Derivar total e data da última doação | Oculto | Obrigatório |
| F27 | Solicitar liberação de acesso aos contatos | Evidente | Obrigatório |
| F28 | Liberar acesso aos contatos | Evidente | Obrigatório |
| F29 | Recusar pedido de liberação | Evidente | Obrigatório |
| F30 | Renovar liberação | Evidente | Desejável |
| F31 | Encerrar liberação | Evidente | Obrigatório |
| F32 | Expirar liberação por decurso de prazo | Oculto | Obrigatório |
| F33 | Exibir contato conforme a permissão vigente | Oculto | Obrigatório |
| F34 | Encerrar pedido pendente ao conceder liberação | Oculto | Desejável |
| F35 | Consultar informações sobre doação de sangue animal | Evidente | Desejável |

### Requisitos suplementares

| Código | Nome |
|---|---|
| S1 | Tipo de interface |
| S2 | Idioma |
| S3 | Perfis de usuário |
| S4 | Tecnologias de implementação |
| S5 | Proteção de dados pessoais |
| S6 | Acessibilidade |
| S7 | Ajuda contextual |
| S8 | Critérios clínicos de referência |
| S9 | Camada de persistência |

---

## 3. Detalhamento dos requisitos funcionais

Os requisitos não-funcionais aparecem vinculados ao requisito funcional que
restringem. Requisitos sem restrição própria herdam apenas os suplementares da
seção 4.

---

### F1 — Cadastrar usuário · Evidente · Obrigatório

**Descrição:** O sistema deve permitir que uma pessoa crie uma conta,
escolhendo entre os perfis de tutor e de veterinário. São coletados nome
completo, CPF, e-mail, telefone, cidade, bairro e senha. Quando o perfil
escolhido é o de veterinário, também são coletados o CRMV, a UF do conselho e
o estabelecimento onde atua.

| Código | Nome | Restrição | Categoria | Desejável | Permanente |
|---|---|---|---|---|---|
| NF1.1 | Armazenamento de senha | A senha deve ser armazenada como hash bcrypt, nunca em texto legível. | Segurança | ( ) | (x) |
| NF1.2 | Unicidade de identificação | CPF e e-mail não podem se repetir entre contas. | Especificação | ( ) | (x) |
| NF1.3 | Cadastro em etapas | O formulário deve ser dividido em etapas, com indicação de progresso, para não apresentar todos os campos de uma vez. | Interface | (x) | ( ) |
| NF1.4 | Aceite obrigatório | A conta só é criada após o aceite dos termos de uso e da ciência sobre os custos de insumos. | Legal | ( ) | (x) |
| NF1.5 | Cifragem de dados pessoais | CPF, e-mail e telefone devem ser armazenados cifrados, com chave mantida fora do banco de dados. A unicidade exigida por NF1.2 e a localização da conta no login devem ser feitas por índice derivado com chave secreta, sem decifrar os registros. | Segurança | ( ) | (x) |
| NF1.6 | Coleta mínima | Não devem ser coletados dados sem uso no serviço. A localização do usuário se limita a cidade e bairro, sem CEP nem endereço. | Legal | ( ) | (x) |
| NF1.7 | Localidade escolhida em lista | A cidade deve ser escolhida na lista oficial de municípios do IBGE. Ao abrir, o campo já oferece as cidades da região imediata de Viçosa; digitar permite buscar qualquer outra, com tolerância a acentos e grafias próximas ("Vicosa", "Vissosa"). O bairro deve ser escolhido na lista da cidade, quando houver uma, com a opção de informar outro nome. Assim o filtro da busca por cidade e bairro não se perde em grafias diferentes do mesmo lugar. | Interface | ( ) | ( ) |

---

### F2 — Autenticar usuário · Evidente · Obrigatório

**Descrição:** O sistema deve autenticar o usuário por e-mail e senha,
estabelecendo uma sessão que identifica seu perfil e determina o que ele pode
ver e fazer.

| Código | Nome | Restrição | Categoria | Desejável | Permanente |
|---|---|---|---|---|---|
| NF2.1 | Mecanismo de sessão | A sessão deve ser mantida por token JWT assinado pelo servidor. | Implementação | ( ) | ( ) |
| NF2.2 | Mensagem de erro genérica | A falha de autenticação não deve revelar se o e-mail existe no sistema. | Segurança | ( ) | (x) |

---

### F3 — Manter dados da conta · Evidente · Obrigatório

**Descrição:** O sistema deve permitir que o usuário altere seus dados de
contato, cidade, bairro e foto de perfil.

| Código | Nome | Restrição | Categoria | Desejável | Permanente |
|---|---|---|---|---|---|
| NF3.1 | Dados imutáveis | CPF e CRMV não podem ser alterados pelo próprio usuário, por identificarem a pessoa nos registros de doação e nas validações assinadas. | Segurança | ( ) | (x) |
| NF3.2 | Confirmação de alteração | O sistema deve indicar visualmente quando há alterações não salvas e confirmar a gravação. | Interface | (x) | ( ) |

---

### F4 — Alterar senha · Evidente · Obrigatório

**Descrição:** O sistema deve permitir a troca de senha mediante informação da
senha atual.

| Código | Nome | Restrição | Categoria | Desejável | Permanente |
|---|---|---|---|---|---|
| NF4.1 | Comprimento mínimo | A nova senha deve ter ao menos oito caracteres. | Segurança | ( ) | ( ) |
| NF4.2 | Confirmação da nova senha | A nova senha deve ser digitada duas vezes e conferir. | Interface | ( ) | (x) |

---

### F5 — Encerrar conta · Evidente · Obrigatório

**Descrição:** O sistema deve permitir que o usuário encerre sua conta. O
encerramento remove o usuário, seus animais, fotos, exames, validações e
doações desses animais, seus pedidos e as liberações de que participou.
Validações e coletas que ele tenha assinado em animais de terceiros permanecem
registradas, com o nome e o CRMV do signatário.

| Código | Nome | Restrição | Categoria | Desejável | Permanente |
|---|---|---|---|---|---|
| NF5.1 | Confirmação por senha | O encerramento só é efetivado após a digitação da senha. | Segurança | ( ) | (x) |
| NF5.2 | Ciência das consequências | A tela deve listar o que será apagado antes de solicitar a confirmação. | Legal | ( ) | (x) |
| NF5.3 | Alternativa não destrutiva | A tela deve oferecer, antes do encerramento, a alternativa de tornar os animais indisponíveis. | Usabilidade | (x) | ( ) |
| NF5.4 | Preservação de assinatura | Registros clínicos assinados em animais de terceiros não podem ser removidos pelo encerramento de conta do signatário. | Legal | ( ) | (x) |

---

### F6 — Gerar código público de identificação · Oculto · Obrigatório

**Descrição:** A cada usuário e a cada animal o sistema deve atribuir um código
público de seis caracteres alfanuméricos, único, usado para identificação entre
pessoas — nomes se repetem, códigos não.

| Código | Nome | Restrição | Categoria | Desejável | Permanente |
|---|---|---|---|---|---|
| NF6.1 | Unicidade do código | O sistema deve verificar a inexistência do código antes de atribuí-lo. | Especificação | ( ) | (x) |
| NF6.2 | Legibilidade | O código deve ser exibido com o prefixo "#" e permitir cópia com um clique. | Interface | (x) | ( ) |

---

### F7 — Registrar aceite dos termos · Oculto · Obrigatório

**Descrição:** No momento do cadastro, o sistema deve registrar o aceite dos
termos de uso e da ciência sobre a responsabilidade financeira pelos insumos
hospitalares, guardando a versão do texto vigente e a data.

---

### F8 — Cadastrar animal doador · Evidente · Obrigatório

**Descrição:** O tutor deve poder cadastrar um animal informando nome, espécie,
raça, sexo, castração, idade, peso e até cinco fotos. O animal passa a aparecer
na busca imediatamente após o cadastro.

| Código | Nome | Restrição | Categoria | Desejável | Permanente |
|---|---|---|---|---|---|
| NF8.1 | Tipo sanguíneo não informado pelo tutor | O formulário não deve oferecer campo de tipo sanguíneo. O dado é resultado de exame e só pode ser gravado por um veterinário ao assinar a tipagem. | Segurança | ( ) | (x) |
| NF8.2 | Idade alternativa | O tutor deve informar a data de nascimento ou, quando não a souber, uma idade aproximada, que o sistema converte na data de nascimento equivalente e registra como aproximada. | Especificação | ( ) | (x) |
| NF8.3 | Limite de fotos | No máximo cinco fotos por animal; a primeira é a principal. | Interface | ( ) | ( ) |
| NF8.4 | Espécies atendidas | O sistema atende cães e gatos. | Especificação | ( ) | ( ) |

---

### F9 — Editar dados do animal · Evidente · Obrigatório

**Descrição:** O tutor deve poder alterar os dados do próprio animal. Peso e
data de nascimento são editáveis porque mudam ou podem ter sido digitados
errado; a alteração de qualquer um deles aciona F21.

| Código | Nome | Restrição | Categoria | Desejável | Permanente |
|---|---|---|---|---|---|
| NF9.1 | Aviso de impacto na validação | Antes de salvar, o sistema deve informar quais critérios validados serão invalidados pela alteração, indicando quem os havia assinado e quando. | Usabilidade | ( ) | (x) |
| NF9.2 | Tipagem confirmada bloqueada | Havendo tipagem confirmada, o tipo sanguíneo deve ser exibido apenas para leitura, com indicação de quem assinou. | Segurança | ( ) | (x) |

---

### F10 — Excluir animal · Evidente · Obrigatório

**Descrição:** O tutor deve poder excluir um animal do sistema, removendo junto
suas fotos, exames, validações, observações e histórico de doações.

| Código | Nome | Restrição | Categoria | Desejável | Permanente |
|---|---|---|---|---|---|
| NF10.1 | Confirmação com consequências | A exclusão exige confirmação em tela que enumere o que será perdido, com os números reais do animal. | Usabilidade | ( ) | (x) |
| NF10.2 | Alternativa não destrutiva | A confirmação deve oferecer a alternativa de marcar o animal como indisponível. | Usabilidade | (x) | ( ) |

---

### F11 — Alterar disponibilidade do animal · Evidente · Obrigatório

**Descrição:** O tutor deve poder pausar e retomar a disponibilidade do animal
para doação, sem excluí-lo. Animal indisponível não pode ser contatado para
doação pela busca.

---

### F12 — Derivar a idade do animal · Oculto · Obrigatório

**Descrição:** A idade deve ser calculada a partir da data de nascimento a cada
exibição, e nunca armazenada como número — assim não fica desatualizada. Quando
o tutor não sabe a data, informa uma idade aproximada e o sistema grava a data
de nascimento equivalente, registrando que ela é aproximada. A derivação é, por
isso, a mesma nos dois casos: a estimativa envelhece junto com o animal, em vez
de congelar no ano do cadastro.

| Código | Nome | Restrição | Categoria | Desejável | Permanente |
|---|---|---|---|---|---|
| NF12.1 | Distinção de procedência | A idade derivada de data aproximada deve ser apresentada como aproximada, sem sugerir precisão que o dado não tem. | Interface | ( ) | (x) |
| NF12.2 | Data aproximada não exibida | Sendo a data de nascimento aproximada, ela não deve ser apresentada ao usuário; dela se exibe apenas a idade derivada. | Interface | ( ) | (x) |

---

### F13 — Controlar o intervalo de recuperação · Oculto · Obrigatório

**Descrição:** A partir da data da coleta mais recente, o sistema deve calcular
o período de recuperação e apresentar o animal como indisponível até o fim
desse prazo.

| Código | Nome | Restrição | Categoria | Desejável | Permanente |
|---|---|---|---|---|---|
| NF13.1 | Intervalo mínimo | O intervalo entre coletas é de 90 dias para cães e gatos. | Especificação | ( ) | ( ) |
| NF13.2 | Informação do prazo | A interface deve exibir a data em que o animal volta a ficar apto. | Interface | (x) | ( ) |

---

### F14 — Enviar exames do animal · Evidente · Obrigatório

**Descrição:** O tutor deve poder enviar arquivos de hemograma, sorologia e
carteira de vacinação do animal, que ficam disponíveis para consulta pelo
veterinário.

| Código | Nome | Restrição | Categoria | Desejável | Permanente |
|---|---|---|---|---|---|
| NF14.1 | Tipos de documento | Os documentos são de três tipos fixos: hemograma, sorologia e carteira de vacinação. | Especificação | ( ) | ( ) |
| NF14.2 | Formatos aceitos | Devem ser aceitos arquivos de imagem e PDF. | Implementação | ( ) | ( ) |

---

### F15 — Versionar exames enviados · Oculto · Obrigatório

**Descrição:** O envio de um exame do mesmo tipo não substitui o anterior:
entra como nova versão, guardando quem enviou e quando. O histórico permanece
disponível para o veterinário comparar a evolução.

---

### F16 — Buscar doadores · Evidente · Obrigatório

**Descrição:** O sistema deve permitir localizar animais doadores por espécie,
tipo sanguíneo, peso máximo, cidade, bairro e situação de validação, além de
busca textual por nome, raça, bairro ou código.

| Código | Nome | Restrição | Categoria | Desejável | Permanente |
|---|---|---|---|---|---|
| NF16.1 | Localização por bairro | A localização do doador é apresentada por cidade e bairro. O sistema não coleta nem armazena coordenadas geográficas dos usuários. | Segurança | ( ) | (x) |
| NF16.2 | Bairros dependentes da cidade | A lista de bairros disponíveis deve corresponder à cidade selecionada. | Interface | ( ) | ( ) |
| NF16.3 | Carga paginada | Os resultados devem ser apresentados em blocos, com carregamento sob demanda. | Performance | (x) | ( ) |
| NF16.4 | Acesso sem autenticação | A busca deve ser consultável por visitante não autenticado, sem exibição de contatos. | Segurança | (x) | ( ) |

---

### F17 — Ordenar resultados da busca · Evidente · Desejável

**Descrição:** O sistema deve permitir ordenar os resultados por situação de
validação, por peso ou por nome.

---

### F18 — Restringir resultados por tipagem confirmada · Oculto · Obrigatório

**Descrição:** Quando houver filtro por tipo sanguíneo, animais sem tipagem
confirmada por veterinário devem ser omitidos do resultado — o sistema não pode
afirmar um tipo que ninguém mediu.

---

### F19 — Validar critérios de doação · Evidente · Obrigatório

**Descrição:** O veterinário deve poder registrar a conferência dos critérios
de aptidão do animal: tipagem sanguínea, peso e idade, vacinação e
vermifugação, sorologias e ausência de transfusão prévia. Cada critério é
marcado individualmente como atendido ou não, e a validação é assinada com nome
e CRMV.

| Código | Nome | Restrição | Categoria | Desejável | Permanente |
|---|---|---|---|---|---|
| NF19.1 | Controle de acesso | A função só pode ser executada por usuário com perfil de veterinário. | Segurança | ( ) | (x) |
| NF19.2 | Assinatura visível | O nome e o CRMV do veterinário devem ficar visíveis ao tutor na validação. | Legal | ( ) | (x) |
| NF19.3 | Prazo de validade | A validação vale por um ano a contar da data de realização. | Especificação | ( ) | ( ) |
| NF19.4 | Imutabilidade | Uma validação registrada não pode ser editada; a revisão gera uma nova validação. | Legal | ( ) | (x) |
| NF19.5 | Validação parcial | É permitido registrar validação com parte dos critérios atendidos, situação exibida como pendência, com indicação de quais faltam. | Especificação | ( ) | ( ) |
| NF19.6 | Renovação zerada | Ao renovar uma validação vencida, os critérios devem começar desmarcados, obrigando nova conferência. | Especificação | ( ) | (x) |

---

### F20 — Registrar o tipo sanguíneo confirmado · Evidente · Obrigatório

**Descrição:** Ao marcar o critério de tipagem como atendido, o veterinário
deve informar qual tipo o exame apontou. Esse valor passa a ser o tipo
sanguíneo exibido no perfil e considerado na busca.

| Código | Nome | Restrição | Categoria | Desejável | Permanente |
|---|---|---|---|---|---|
| NF20.1 | Obrigatoriedade do resultado | Não é permitido concluir a validação com o critério de tipagem marcado e o tipo não informado. | Especificação | ( ) | (x) |
| NF20.2 | Tipos por espécie | Cães usam a classificação DEA; gatos, os tipos A, B e AB. | Especificação | ( ) | (x) |
| NF20.3 | Distinção visual | O tipo confirmado em exame deve ser apresentado com destaque distinto da ausência de tipagem, na ficha do animal e na busca. | Interface | ( ) | (x) |

---

### F21 — Invalidar validação por alteração de dado conferido · Oculto · Obrigatório

**Descrição:** Quando o tutor altera o peso ou a data de nascimento do animal,
o critério de peso e idade da validação vigente perde efeito, por ter sido
conferido sobre outro valor. O sistema registra a invalidação e seu motivo, sem
alterar o registro assinado.

---

### F22 — Expirar validação por decurso de prazo · Oculto · Obrigatório

**Descrição:** Decorrido um ano da validação, o sistema deve apresentá-la como
vencida, sem necessidade de rotina de manutenção.

---

### F23 — Registrar observação sobre a coleta · Evidente · Desejável

**Descrição:** O veterinário deve poder registrar anotações sobre o
comportamento do animal durante a coleta, para orientar a equipe em
procedimentos futuros. As observações são identificadas com autor e data.

---

### F24 — Registrar doação realizada · Evidente · Obrigatório

**Descrição:** O veterinário deve registrar cada coleta efetivada, informando o
dia, o volume coletado, o estabelecimento onde ocorreu e, opcionalmente, uma
observação. O registro é assinado com nome e CRMV.

| Código | Nome | Restrição | Categoria | Desejável | Permanente |
|---|---|---|---|---|---|
| NF24.1 | Controle de acesso | A função só pode ser executada por usuário com perfil de veterinário. | Segurança | ( ) | (x) |
| NF24.2 | Data não futura | Não é permitido registrar coleta com data posterior ao dia corrente. | Especificação | ( ) | (x) |
| NF24.3 | Seleção de data | A escolha do dia deve usar componente de calendário do próprio sistema, e não o seletor nativo do navegador. | Interface | (x) | ( ) |
| NF24.4 | Efeito imediato | O registro deve refletir de imediato na disponibilidade do animal, por acionar F13. | Especificação | ( ) | (x) |

---

### F25 — Consultar histórico de doações · Evidente · Obrigatório

**Descrição:** O sistema deve apresentar, para cada animal, a lista de coletas
realizadas, com data, local, volume e responsável.

---

### F26 — Derivar total e data da última doação · Oculto · Obrigatório

**Descrição:** O total de doações e a data da coleta mais recente devem ser
obtidos por contagem e máximo sobre os registros de doação, e não armazenados
como contadores — assim nenhum número pode discordar do histórico.

---

### F27 — Solicitar liberação de acesso aos contatos · Evidente · Obrigatório

**Descrição:** O tutor que precisa falar com doadores deve poder solicitar
liberação a um veterinário específico, identificado pelo código ou escolhido na
lista do estabelecimento, descrevendo o caso que motiva o pedido.

| Código | Nome | Restrição | Categoria | Desejável | Permanente |
|---|---|---|---|---|---|
| NF27.1 | Destinatário definido | O pedido deve ser endereçado a um veterinário determinado; não existe solicitação difundida a todos. | Especificação | ( ) | (x) |
| NF27.2 | Escolha por estabelecimento | A lista de veterinários apresentada deve corresponder ao estabelecimento selecionado. | Interface | ( ) | ( ) |
| NF27.3 | Pedido único | Cada tutor pode manter apenas um pedido pendente por vez. | Especificação | ( ) | ( ) |
| NF27.4 | Justificativa obrigatória | A descrição do caso é obrigatória, por ser o que fundamenta a decisão do veterinário. | Especificação | ( ) | (x) |

---

### F28 — Liberar acesso aos contatos · Evidente · Obrigatório

**Descrição:** O veterinário deve poder conceder a um tutor, identificado pelo
código, acesso temporário aos contatos dos doadores, escolhendo a duração.

| Código | Nome | Restrição | Categoria | Desejável | Permanente |
|---|---|---|---|---|---|
| NF28.1 | Controle de acesso | A função só pode ser executada por usuário com perfil de veterinário. | Segurança | ( ) | (x) |
| NF28.2 | Durações previstas | A liberação pode ser concedida por 24 horas, 3 dias ou 7 dias. | Especificação | ( ) | ( ) |
| NF28.3 | Conferência antes de confirmar | Os dados do tutor identificado pelo código devem ser exibidos antes da confirmação, para evitar liberação por engano. | Usabilidade | ( ) | (x) |
| NF28.4 | Não duplicação | Não é permitido conceder liberação a tutor que já possua liberação ativa, ainda que concedida por outro veterinário. | Especificação | ( ) | (x) |
| NF28.5 | Administração restrita | Cada veterinário administra apenas as liberações que concedeu. | Segurança | ( ) | (x) |

---

### F29 — Recusar pedido de liberação · Evidente · Obrigatório

**Descrição:** O veterinário deve poder recusar um pedido endereçado a ele.

---

### F30 — Renovar liberação · Evidente · Desejável

**Descrição:** O veterinário deve poder devolver o prazo integral a uma
liberação que concedeu, quando o atendimento se estende.

---

### F31 — Encerrar liberação · Evidente · Obrigatório

**Descrição:** O veterinário deve poder encerrar antecipadamente uma liberação
que concedeu.

---

### F32 — Expirar liberação por decurso de prazo · Oculto · Obrigatório

**Descrição:** A liberação deve perder efeito automaticamente ao fim do prazo,
sem depender de ação de ninguém nem de rotina de manutenção.

---

### F33 — Exibir contato conforme a permissão vigente · Oculto · Obrigatório

**Descrição:** O telefone e o e-mail de um tutor só são apresentados na íntegra
a veterinários autenticados e a tutores com liberação ativa. Nos demais casos
são exibidos de forma mascarada, acompanhados da orientação sobre como obter
acesso.

| Código | Nome | Restrição | Categoria | Desejável | Permanente |
|---|---|---|---|---|---|
| NF33.1 | Mascaramento | Os dados ocultos devem indicar sua existência sem permitir reconstrução — o domínio do e-mail permanece visível, o restante não. | Segurança | ( ) | (x) |
| NF33.2 | Orientação no bloqueio | Ao ocultar o contato, o sistema deve informar como obtê-lo, e não apenas negar o acesso. | Usabilidade | ( ) | (x) |

---

### F34 — Encerrar pedido pendente ao conceder liberação · Oculto · Desejável

**Descrição:** Concedida a liberação a um tutor, eventual pedido pendente desse
mesmo tutor deixa de existir, por ter perdido a finalidade.

---

### F35 — Consultar informações sobre doação de sangue animal · Evidente · Desejável

**Descrição:** O sistema deve apresentar conteúdo informativo sobre a doação de
sangue animal: critérios de aptidão, etapas do procedimento e esclarecimento de
equívocos comuns.

| Código | Nome | Restrição | Categoria | Desejável | Permanente |
|---|---|---|---|---|---|
| NF35.1 | Fontes citadas | As afirmações clínicas devem indicar a fonte consultada. | Legal | ( ) | (x) |
| NF35.2 | Acesso sem autenticação | O conteúdo deve estar disponível a visitantes. | Segurança | ( ) | (x) |

---

## 4. Requisitos suplementares

| Código | Nome | Restrição | Categoria | Desejável | Permanente |
|---|---|---|---|---|---|
| S1 | Tipo de interface | O sistema deve ser uma aplicação web responsiva, utilizável de 360 a 1920 pixels de largura, sem rolagem horizontal. | Interface | ( ) | (x) |
| S2 | Idioma | Toda a interface deve estar em português do Brasil. | Interface | ( ) | (x) |
| S3 | Perfis de usuário | Os perfis de acesso são: **Veterinário** — executa todas as operações de tutor e ainda valida doadores, registra coletas, concede e administra liberações de contato, e consulta contatos sem autorização prévia. **Tutor** — mantém os próprios animais, consulta a busca e acessa contatos apenas com liberação vigente. **Visitante** — consulta o conteúdo informativo e a busca, sem acesso a contatos. | Segurança | ( ) | (x) |
| S4 | Tecnologias de implementação | Interface em React com Vite; serviço em Node.js com Express; persistência em PostgreSQL acessada por ORM Prisma. | Implementação | ( ) | ( ) |
| S5 | Proteção de dados pessoais | O tratamento dos dados deve observar a Lei nº 13.709/2018 (LGPD), incluindo o direito de eliminação, com as conservações admitidas pelo art. 16 para registros clínicos assinados. | Legal | ( ) | (x) |
| S6 | Acessibilidade | Todos os controles devem ser operáveis por teclado, com indicação visível de foco, rótulos acessíveis em botões sem texto e respeito à preferência de movimento reduzido do sistema operacional. | Usabilidade | ( ) | (x) |
| S7 | Ajuda contextual | Termos clínicos apresentados ao tutor devem ter explicação acessível no próprio ponto em que aparecem, por símbolo de ajuda padronizado. | Usabilidade | (x) | ( ) |
| S8 | Critérios clínicos de referência | Os critérios de aptidão adotados seguem a Nota Técnica nº 3 (2024) da Associação Brasileira Veterinária de Hematologia e Medicina Transfusional, devendo ser confirmados com a equipe do Hospital Veterinário antes da implantação. | Legais | ( ) | ( ) |
| S9 | Camada de persistência | O acesso ao banco deve ser mediado por ORM, de modo que a troca do sistema gerenciador não exija reescrita das regras de negócio. | Persistência | (x) | ( ) |

---

## 5. Observações sobre a caracterização

**Sobre permanência.** Foram classificados como **transitórios** os requisitos
cuja mudança é plausível no horizonte do projeto: o prazo de validade da
validação (NF19.3), o intervalo entre coletas (NF13.1), as durações de
liberação (NF28.2), os tipos de documento (NF14.1) e os critérios clínicos
(S8). Todos derivam de protocolo clínico externo, revisado periodicamente, e
por isso foram implementados como dado configurável — os critérios, por
exemplo, são registros do banco e não colunas, de modo que acrescentar um novo
não exige alteração de esquema.

**Sobre obrigatoriedade.** Foram classificados como **desejáveis** os
requisitos cuja ausência não impede o sistema de cumprir sua finalidade:
ordenação de resultados (F17), observações de coleta (F23), renovação de
liberação (F30) e o conteúdo informativo (F35). Todos foram implementados, mas
poderiam ser adiados sem inviabilizar o uso.

**Sobre requisitos ocultos.** Doze dos trinta e cinco requisitos funcionais são
ocultos — consequências que o sistema executa sem interação explícita. Dois
deles concentram a maior parte do valor clínico do trabalho: a invalidação
automática de validação por alteração de dado conferido (F21) e a expiração
autônoma da liberação de contatos (F32). Nenhum dos dois aparece como tela, e
ambos precisam ser lembrados no teste de aceitação.

---

## Referências

WAZLAWICK, R. S. *Análise e projeto de sistemas de informação orientados a
objetos*. 1. ed. São Paulo: Campus-Elsevier, 2004.

VEGI, L. F. M. *Análise e especificação de requisitos funcionais e
não-funcionais (Concepção RUP)*. Notas de aula, INF323 — Engenharia de Software
II, Universidade Federal de Viçosa, 2026.
