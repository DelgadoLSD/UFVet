import { z } from "zod";
import { normalizarConvite } from "./cifra.js";
import { dataExiste, hojeISO, subtrairAnos } from "./datas.js";
import { BYTES_MAXIMOS_SENHA } from "./senha.js";

// Regras dos dados que chegam à API. A API nunca confia no que recebe: alguém
// pode chamá-la direto, sem passar pelo site, e a conferência do site serve
// só para avisar a pessoa antes de enviar.
//
// Cada campo também é normalizado: espaços sobrando saem, o CPF fica só com
// números, o e-mail em minúsculas e o telefone sempre no mesmo formato. Os
// tamanhos máximos são os das colunas do banco.

// Siglas das 27 unidades da federação.
export const UFS = [
  "AC",
  "AL",
  "AM",
  "AP",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MG",
  "MS",
  "MT",
  "PA",
  "PB",
  "PE",
  "PI",
  "PR",
  "RJ",
  "RN",
  "RO",
  "RR",
  "RS",
  "SC",
  "SE",
  "SP",
  "TO",
];

// Mensagem de campo ausente ou do tipo errado (um número no lugar de texto).
const obrigatorio = {
  error: (problema) =>
    problema.input === undefined || problema.input === null
      ? "Preencha este campo."
      : "Valor inválido.",
};

const PREENCHA = "Preencha este campo.";

// Tira os espaços das pontas e junta espaços repetidos.
const limparEspacos = (valor) =>
  typeof valor === "string" ? valor.trim().replace(/\s+/g, " ") : valor;

const soDigitos = (valor) =>
  typeof valor === "string" ? valor.replace(/\D/g, "") : valor;

// Limites que nenhum cão ou gato passa: servem para pegar erro de digitação
// ("320" no lugar de "32,0"), não para decidir quem pode doar.
const PESO_MAXIMO = 150;
const IDADE_MAXIMA = 30;
const IDADE_FORA = `Informe a idade em anos, de 0 a ${IDADE_MAXIMA}.`;

// ─── CPF ──────────────────────────────────────────────────────────────────────

// Confere os dois dígitos verificadores, a conta que a Receita usa para pegar
// erros de digitação. CPFs com todos os números iguais passam na conta, mas
// não existem.
export function cpfValido(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digito = (quantos) => {
    let soma = 0;
    for (let i = 0; i < quantos; i++) {
      soma += Number(cpf[i]) * (quantos + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
}

// ─── Telefone ─────────────────────────────────────────────────────────────────

// DDD sem zero, e depois um celular (9 + 8 dígitos) ou um fixo (8 dígitos,
// começando de 2 a 8).
const TELEFONE = /^[1-9]{2}(?:9\d{8}|[2-8]\d{7})$/;

// "31992047715" -> "(31) 99204-7715"
export function formatarTelefone(digitos) {
  const ddd = digitos.slice(0, 2);
  const numero = digitos.slice(2);
  const corte = numero.length - 4;
  return `(${ddd}) ${numero.slice(0, corte)}-${numero.slice(corte)}`;
}

// ─── Campos ───────────────────────────────────────────────────────────────────

export const campos = {
  nomeCompleto: z.preprocess(
    limparEspacos,
    z
      .string(obrigatorio)
      .min(1, PREENCHA)
      .max(120, "O nome pode ter no máximo 120 caracteres.")
      .refine((nome) => nome.includes(" "), "Informe o nome e o sobrenome."),
  ),

  cpf: z.preprocess(
    soDigitos,
    z
      .string(obrigatorio)
      .min(1, PREENCHA)
      .refine(cpfValido, "CPF inválido. Confira os números."),
  ),

  email: z.preprocess(
    (valor) => (typeof valor === "string" ? valor.trim().toLowerCase() : valor),
    z
      .string(obrigatorio)
      .min(1, PREENCHA)
      .max(254, "E-mail longo demais.")
      .refine(
        (email) => z.email().safeParse(email).success,
        "E-mail inválido. Confira o endereço.",
      ),
  ),

  telefone: z.preprocess(
    soDigitos,
    z
      .string(obrigatorio)
      .min(1, PREENCHA)
      .refine(
        (t) => TELEFONE.test(t),
        "Telefone inválido. Use o DDD e o número.",
      )
      .transform(formatarTelefone),
  ),

  // "Viçosa - MG". A cidade é escolhida da lista do IBGE no site; aqui a API
  // confere o formato e a UF. (Conferir o nome contra a lista do IBGE fica
  // para quando o código IBGE da cidade passar a ser guardado.)
  cidade: z.preprocess(
    limparEspacos,
    z
      .string(obrigatorio)
      .min(1, "Escolha a cidade na lista.")
      .max(80, "Nome de cidade longo demais.")
      .refine((cidade) => {
        const partes = cidade.match(/^.+ - ([A-Z]{2})$/);
        return !!partes && UFS.includes(partes[1]);
      }, "Escolha a cidade na lista."),
  ),

  bairro: z.preprocess(
    limparEspacos,
    z
      .string(obrigatorio)
      .min(1, PREENCHA)
      .max(80, "O bairro pode ter no máximo 80 caracteres."),
  ),

  // Sem limpar espaços: eles podem fazer parte da senha.
  senha: z
    .string(obrigatorio)
    .min(8, "A senha precisa ter pelo menos 8 caracteres.")
    .refine(
      (senha) => Buffer.byteLength(senha, "utf8") <= BYTES_MAXIMOS_SENHA,
      "A senha pode ter no máximo 72 caracteres.",
    ),

  // Código de convite: aceita com traço, sem traço e em minúsculas.
  convite: z.preprocess(
    (valor) => (typeof valor === "string" ? normalizarConvite(valor) : valor),
    z
      .string(obrigatorio)
      .min(1, PREENCHA)
      .length(8, "O código do convite tem 8 letras e números."),
  ),

  tratamento: z.enum(["DR", "DRA"], { error: "Escolha Dr. ou Dra." }),

  crmv: z.preprocess(
    soDigitos,
    z
      .string(obrigatorio)
      .min(1, PREENCHA)
      .max(12, "O CRMV pode ter no máximo 12 números."),
  ),

  uf: z.preprocess(
    (valor) => (typeof valor === "string" ? valor.trim().toUpperCase() : valor),
    z.enum(UFS, { error: "UF inválida." }),
  ),

  // ─── Animal ───

  nomeAnimal: z.preprocess(
    limparEspacos,
    z
      .string(obrigatorio)
      .min(1, PREENCHA)
      .max(60, "O nome pode ter no máximo 60 caracteres."),
  ),

  especie: z.enum(["CAO", "GATO"], { error: "Escolha cão ou gato." }),

  sexo: z.enum(["MACHO", "FEMEA"], { error: "Escolha macho ou fêmea." }),

  // Vazio quer dizer SRD (sem raça definida), que o banco guarda como nulo.
  raca: z.preprocess(
    (valor) =>
      typeof valor === "string" ? limparEspacos(valor) || null : valor,
    z
      .string(obrigatorio)
      .max(60, "A raça pode ter no máximo 60 caracteres.")
      .nullable(),
  ),

  castrado: z.boolean({ error: "Responda se é castrado." }),

  disponivel: z.boolean({ error: "Valor inválido." }),

  // Em kg, com até duas casas (a coluna é decimal(5,2)). Aceita "4,5".
  pesoKg: z.preprocess(
    (valor) =>
      typeof valor === "string" && valor.trim()
        ? Number(valor.replace(",", "."))
        : valor,
    z
      .number({ error: "Informe o peso em kg." })
      .min(0.1, "Informe o peso em kg.")
      .max(PESO_MAXIMO, `Confira o peso: mais de ${PESO_MAXIMO} kg.`)
      .transform((kg) => Math.round(kg * 100) / 100),
  ),

  dataNascimento: z
    .string(obrigatorio)
    .refine(dataExiste, "Informe uma data válida.")
    .refine(
      (dia) => dia <= hojeISO(),
      "A data de nascimento não pode ser depois de hoje.",
    )
    .refine(
      (dia) => dia >= subtrairAnos(hojeISO(), IDADE_MAXIMA),
      `Confira a data: mais de ${IDADE_MAXIMA} anos atrás.`,
    ),

  // A idade que o tutor estima quando não sabe a data, em anos inteiros.
  idadeAproximada: z
    .int({ error: IDADE_FORA })
    .min(0, IDADE_FORA)
    .max(IDADE_MAXIMA, IDADE_FORA),
};

// ─── Pedidos ──────────────────────────────────────────────────────────────────

// O aceite dos termos e da ciência sobre os custos é obrigatório (NF1.4).
const aceite = z.literal(true, {
  error: "É preciso aceitar para criar a conta.",
});

const dadosDaPessoa = {
  nomeCompleto: campos.nomeCompleto,
  cpf: campos.cpf,
  email: campos.email,
  telefone: campos.telefone,
  cidade: campos.cidade,
  bairro: campos.bairro,
  senha: campos.senha,
  aceiteTermos: aceite,
  cienciaResponsabilidade: aceite,
};

// Cadastro (F1). O veterinário traz, além disso, o convite e o tratamento;
// CRMV e estabelecimento vêm do convite, não do que a pessoa digita.
export const esquemaCadastro = z.discriminatedUnion(
  "papel",
  [
    z.object({ papel: z.literal("TUTOR"), ...dadosDaPessoa }),
    z.object({
      papel: z.literal("VETERINARIO"),
      ...dadosDaPessoa,
      convite: campos.convite,
      tratamento: campos.tratamento,
    }),
  ],
  { error: "Escolha se você é tutor ou veterinário." },
);

// Conferência do e-mail e do CPF durante o cadastro: vem um, o outro ou os
// dois, com as mesmas regras do cadastro.
export const esquemaDisponibilidade = z.object({
  email: campos.email.optional(),
  cpf: campos.cpf.optional(),
});

// Senha digitada para entrar ou para confirmar uma mudança. O formato não é
// conferido, só se ela bate com o hash guardado. O teto de 200 caracteres
// evita gastar processamento com textos enormes.
const senhaDigitada = z.string(obrigatorio).min(1, PREENCHA).max(200);

// Login (F2). Aqui o formato do e-mail também não é conferido: e-mail mal
// digitado e senha errada recebem a mesma resposta (NF2.2).
export const esquemaLogin = z.object({
  email: z.preprocess(
    (valor) => (typeof valor === "string" ? valor.trim().toLowerCase() : valor),
    z.string(obrigatorio).min(1, PREENCHA).max(254),
  ),
  senha: senhaDigitada,
});

// Dados da própria conta (F3). Vem só o que a pessoa mudou, e a senha atual
// quando o e-mail muda. CPF, CRMV, papel e código não fazem parte do
// esquema, e o que não faz parte é descartado: não há como mudá-los por aqui
// (NF3.1).
export const esquemaConta = z
  .object({
    nomeCompleto: campos.nomeCompleto.optional(),
    email: campos.email.optional(),
    telefone: campos.telefone.optional(),
    cidade: campos.cidade.optional(),
    bairro: campos.bairro.optional(),
    senhaAtual: senhaDigitada.optional(),
  })
  // O bairro é da cidade: trocar de cidade sem escolher o bairro deixaria a
  // conta com um bairro de outro lugar.
  .refine((dados) => dados.cidade === undefined || dados.bairro !== undefined, {
    message: "Escolha o bairro da nova cidade.",
    path: ["bairro"],
  });

// Troca de senha (F4): a atual, para provar que é a própria pessoa, e a nova,
// com as mesmas regras do cadastro (NF4.1).
export const esquemaTrocaSenha = z.object({
  senhaAtual: senhaDigitada,
  senhaNova: campos.senha,
});

// Encerramento da conta (F5): só com a senha (NF5.1).
export const esquemaEncerramento = z.object({
  senhaAtual: senhaDigitada,
});

// Os dados do animal que o tutor informa. O tipo sanguíneo não está aqui
// (NF8.1): é resultado de exame, e só o veterinário o grava, ao assinar a
// tipagem. O dono também não: é sempre quem está logado. O que não está no
// esquema é descartado.
const dadosDoAnimal = {
  nome: campos.nomeAnimal,
  especie: campos.especie,
  raca: campos.raca.optional(),
  sexo: campos.sexo,
  castrado: campos.castrado,
  pesoKg: campos.pesoKg,
  // A idade vem de um jeito só (NF8.2): a data de nascimento, ou a idade
  // aproximada em anos, que a API converte numa data.
  dataNascimento: campos.dataNascimento.optional(),
  idadeAproximada: campos.idadeAproximada.optional(),
};

const informou = (valor) => valor !== undefined;

// Cadastro de animal (F8).
export const esquemaAnimal = z
  .object(dadosDoAnimal)
  .refine(
    (dados) =>
      informou(dados.dataNascimento) !== informou(dados.idadeAproximada),
    {
      message: "Informe a data de nascimento ou a idade aproximada.",
      path: ["dataNascimento"],
    },
  );

// As fotos do animal depois da edição, na ordem em que ficam (a primeira é
// a principal, NF8.3): o id de cada foto que continua e "nova" no lugar de
// cada foto enviada no pedido, na ordem do envio. Foto que não está na lista
// é removida.
const ordemDasFotos = z
  .array(z.union([z.literal("nova"), z.uuid()]), {
    error: "Lista de fotos inválida.",
  })
  .max(5, "Cada animal pode ter até 5 fotos.")
  .refine(
    (lista) => {
      const ids = lista.filter((item) => item !== "nova");
      return new Set(ids).size === ids.length;
    },
    { message: "Lista de fotos inválida." },
  );

// Edição (F9) e disponibilidade (F11): vem só o que mudou. Sem `fotos`, as
// fotos ficam como estão, e as enviadas entram no fim.
export const esquemaEdicaoAnimal = z
  .object({
    ...Object.fromEntries(
      Object.entries(dadosDoAnimal).map(([campo, regra]) => [
        campo,
        regra.optional(),
      ]),
    ),
    disponivel: campos.disponivel.optional(),
    fotos: ordemDasFotos.optional(),
  })
  .refine(
    (dados) =>
      !informou(dados.dataNascimento) || !informou(dados.idadeAproximada),
    {
      message: "Informe só um: a data de nascimento ou a idade aproximada.",
      path: ["dataNascimento"],
    },
  );

// ─── O que o veterinário registra no animal ───────────────────────────────────

// Os cinco critérios da validação (F19), com as mesmas chaves do banco.
export const CRITERIOS_DOACAO = [
  "TIPAGEM",
  "PESO_IDADE",
  "VACINACAO",
  "SOROLOGIAS",
  "SEM_TRANSFUSAO",
];

// Os tipos sanguíneos de cada espécie (NF20.2): cães na classificação DEA,
// gatos em A, B e AB. São os mesmos valores que o site oferece.
export const TIPOS_SANGUINEOS = {
  CAO: ["DEA 1.1 Universal", "DEA 1.1+", "DEA 1.1-", "DEA 4", "DEA 7"],
  GATO: ["Tipo A", "Tipo B", "Tipo AB"],
};

// O maior volume aceito numa coleta, em mL. Uma bolsa de cão grande fica em
// torno de 450 mL; o teto deixa folga e barra um número digitado errado.
export const VOLUME_MAXIMO_ML = 1000;

const TAMANHO_MAXIMO_NOTA = 500;
const TAMANHO_MAXIMO_OBSERVACAO = 1000;

// Texto livre opcional (as notas): espaços das pontas saem, e vazio vira
// "sem nota".
const notaOpcional = z
  .string({ error: "Valor inválido." })
  .trim()
  .max(
    TAMANHO_MAXIMO_NOTA,
    `Escreva no máximo ${TAMANHO_MAXIMO_NOTA} caracteres.`,
  )
  .optional();

// Validação veterinária (F19 e F20). Cada critério vem marcado como atendido
// ou não; a validação pode ficar com pendências (NF19.5). Quem assina não vem
// no pedido: a assinatura sai da conta de quem está logado. O tipo
// sanguíneo só vem com a tipagem conferida, e com ela é obrigatório (NF20.1).
// Se o tipo existe para a espécie do animal (NF20.2), o controlador confere,
// porque depende do animal.
export const esquemaValidacao = z
  .object({
    criterios: z.object(
      Object.fromEntries(
        CRITERIOS_DOACAO.map((criterio) => [
          criterio,
          z.boolean({ error: "Marque se o critério foi atendido." }),
        ]),
      ),
      { error: "Marque os critérios conferidos." },
    ),
    tipoSanguineo: z
      .string({ error: "Valor inválido." })
      .trim()
      .max(20, "Tipo sanguíneo inválido.")
      .nullish(),
    nota: notaOpcional,
  })
  .refine((dados) => !dados.criterios.TIPAGEM || !!dados.tipoSanguineo, {
    message: "Informe o tipo que o exame de tipagem mostrou.",
    path: ["tipoSanguineo"],
  })
  .refine((dados) => dados.criterios.TIPAGEM || !dados.tipoSanguineo, {
    message: "O tipo sanguíneo só vale com a tipagem conferida.",
    path: ["tipoSanguineo"],
  });

// Doação realizada (F24). A data não pode ser depois de hoje (NF24.2); que
// não seja antes do nascimento do animal o controlador confere. O local é um
// estabelecimento cadastrado, escolhido pelo id.
export const esquemaDoacao = z.object({
  dataColeta: z
    .string(obrigatorio)
    .refine(dataExiste, "Informe uma data válida.")
    .refine(
      (dia) => dia <= hojeISO(),
      "A data da coleta não pode ser depois de hoje.",
    ),
  volumeMl: z
    .int({ error: "Informe o volume em mL, sem casas decimais." })
    .min(1, "Informe o volume em mL.")
    .max(VOLUME_MAXIMO_ML, `Confira o volume: mais de ${VOLUME_MAXIMO_ML} mL.`),
  estabelecimentoId: z.uuid({ error: "Escolha onde a coleta foi feita." }),
  nota: notaOpcional,
});

// Observação sobre a coleta (F23).
export const esquemaObservacao = z.object({
  texto: z
    .string(obrigatorio)
    .trim()
    .min(1, "Escreva a observação.")
    .max(
      TAMANHO_MAXIMO_OBSERVACAO,
      `Escreva no máximo ${TAMANHO_MAXIMO_OBSERVACAO} caracteres.`,
    ),
});

// ─── Busca de doadores (F16 a F18) ────────────────────────────────────────────

// Depois de uma coleta, o animal descansa 90 dias, cão ou gato (NF13.1).
export const INTERVALO_RECUPERACAO_DIAS = 90;

// Quantos doadores vêm de cada vez; o site pede o próximo bloco quando a
// pessoa clica em "Carregar mais" (NF16.3).
export const DOADORES_POR_PAGINA = 6;

// As ordens da busca (F17): validados primeiro, maior peso ou nome.
export const ORDENS_DA_BUSCA = ["validados", "peso", "nome"];

const especieDaBusca = z.enum(["CAO", "GATO"], {
  error: "Escolha cão ou gato.",
});

// Um texto da busca: espaços das pontas saem, e vazio é o mesmo que não
// filtrar.
const textoDaBusca = (maximo, mensagem) =>
  z
    .string({ error: "Valor inválido." })
    .trim()
    .max(maximo, mensagem)
    .optional()
    .transform((valor) => valor || undefined);

// Os filtros chegam pelo endereço (/doadores?especie=CAO&tipos=DEA%204...):
// tudo vem como texto e é convertido aqui. O que não está na lista é
// ignorado, e o que está fora do esperado é recusado com o motivo.
export const esquemaBusca = z
  .object({
    especie: especieDaBusca,
    // Um tipo só chega como texto; vários, como lista (tipos=A&tipos=B).
    tipos: z.preprocess(
      (valor) =>
        valor === undefined ? [] : Array.isArray(valor) ? valor : [valor],
      z.array(z.string()).max(5, "Escolha no máximo 5 tipos."),
    ),
    cidade: textoDaBusca(80, "Escolha a cidade na lista."),
    bairro: textoDaBusca(80, "Escolha o bairro na lista."),
    apenasValidados: z
      .enum(["true", "false"], { error: "Valor inválido." })
      .optional()
      .transform((valor) => valor === "true"),
    busca: textoDaBusca(60, "Busque com até 60 caracteres."),
    ordem: z
      .enum(ORDENS_DA_BUSCA, { error: "Escolha uma das ordens da lista." })
      .default("validados"),
    pagina: z.coerce
      .number({ error: "Página inválida." })
      .int("Página inválida.")
      .min(1, "Página inválida.")
      .max(500, "Página inválida.")
      .default(1),
  })
  .superRefine((filtros, ctx) => {
    // Os tipos são os da espécie escolhida (NF20.2).
    const daEspecie = TIPOS_SANGUINEOS[filtros.especie];
    if (filtros.tipos.some((tipo) => !daEspecie.includes(tipo))) {
      ctx.addIssue({
        code: "custom",
        path: ["tipos"],
        message:
          filtros.especie === "CAO"
            ? "Escolha tipos da classificação DEA, a dos cães."
            : "Escolha tipos A, B ou AB, os dos gatos.",
      });
    }
    // O bairro só faz sentido dentro de uma cidade (NF16.2).
    if (filtros.bairro && !filtros.cidade) {
      ctx.addIssue({
        code: "custom",
        path: ["bairro"],
        message: "Escolha a cidade antes do bairro.",
      });
    }
  });

// Os lugares para os filtros de cidade e bairro, por espécie.
export const esquemaLocais = z.object({ especie: especieDaBusca });

// ─── Acesso aos contatos (F27 a F34) ──────────────────────────────────────────

// Prazos que o veterinário pode escolher ao liberar (NF28.2): 24 horas, 3
// dias ou 7 dias. O banco aceita qualquer número; quem barra é a API.
export const DURACOES_LIBERACAO_HORAS = [24, 72, 168];

// O caso do pedido é obrigatório (NF27.4): é o que o veterinário lê para
// decidir. Na liberação, é opcional e curto (coluna liberacao_contato.caso).
export const TAMANHO_MINIMO_CASO = 5;
const TAMANHO_MAXIMO_CASO_PEDIDO = 500;
const TAMANHO_MAXIMO_CASO_LIBERACAO = 160;

// Um código público digitado por alguém (#T3M8P1, t3m8p1): sem o "#", sem
// espaços e em maiúsculas. `mensagem` diz o que fazer quando falta ou vem
// errado.
const codigoDigitado = (mensagem) =>
  z.preprocess(
    (valor) =>
      typeof valor === "string"
        ? valor.trim().replace(/^#/, "").toUpperCase()
        : valor,
    z.string({ error: mensagem }).regex(/^[A-Z0-9]{6}$/, mensagem),
  );

// Pedido de liberação de um tutor (F27): para um veterinário determinado,
// pelo código (NF27.1), com o caso contado.
export const esquemaPedido = z.object({
  veterinario: codigoDigitado(
    "Escolha o veterinário: digite o código dele ou procure pelo local do atendimento.",
  ),
  caso: z
    .string({ error: "Conte o que está acontecendo." })
    .trim()
    .min(
      TAMANHO_MINIMO_CASO,
      `Conte o que está acontecendo, com pelo menos ${TAMANHO_MINIMO_CASO} caracteres.`,
    )
    .max(
      TAMANHO_MAXIMO_CASO_PEDIDO,
      `Escreva no máximo ${TAMANHO_MAXIMO_CASO_PEDIDO} caracteres.`,
    ),
});

// O prazo escolhido: 24 horas, 3 dias ou 7 dias (NF28.2).
const duracaoLiberacao = z.union(
  DURACOES_LIBERACAO_HORAS.map((horas) => z.literal(horas)),
  { error: "Escolha por quanto tempo: 24 horas, 3 dias ou 7 dias." },
);

// Liberação dada por um veterinário (F28): a um tutor, pelo código, ou
// aceitando um pedido que chegou para ele. Um dos dois, nunca os dois.
export const esquemaLiberacao = z
  .object({
    tutor: codigoDigitado(
      "Digite os 6 caracteres do código do tutor.",
    ).optional(),
    pedido: z.uuid({ error: "Pedido inválido." }).optional(),
    duracaoHoras: duracaoLiberacao,
    caso: z
      .string({ error: "Valor inválido." })
      .trim()
      .max(
        TAMANHO_MAXIMO_CASO_LIBERACAO,
        `Escreva no máximo ${TAMANHO_MAXIMO_CASO_LIBERACAO} caracteres.`,
      )
      .optional(),
  })
  .refine((dados) => !!dados.tutor !== !!dados.pedido, {
    message: "Digite os 6 caracteres do código do tutor.",
    path: ["tutor"],
  });

// Renovação (F30): o novo prazo, contado de agora. Sem ele, vale o prazo da
// própria liberação (o "prazo integral").
export const esquemaRenovacao = z.object({
  duracaoHoras: duracaoLiberacao.optional(),
});
