import { z } from "zod";
import { normalizarConvite } from "./cifra.js";
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
