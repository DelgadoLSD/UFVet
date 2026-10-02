import { hojeISO, paraData, somarAnos, somarDias } from "../util/datas";

// Regras de doação de sangue usadas pelas telas: quem pode doar, o que o
// veterinário confere e quanto tempo vale cada coisa.
//
// Os valores seguem a Nota Técnica nº 3 (2024) da ABVHMT (Associação
// Brasileira Veterinária de Hematologia e Medicina Transfusional) e precisam
// ser confirmados com a equipe do Hospital Veterinário antes da produção.
//
// As chaves são as mesmas dos enums do banco (Especie, Sexo, CriterioDoacao,
// TipoDocumento), para o site e a API falarem a mesma língua. Quando a API
// existir, ela aplica estas regras de verdade; aqui elas servem para exibir.

export const ESPECIES = {
  CAO: { rotulo: "Cão", plural: "cães" },
  GATO: { rotulo: "Gato", plural: "gatos" },
};

export const SEXOS = {
  MACHO: "Macho",
  FEMEA: "Fêmea",
};

// Limites para doar, por espécie.
export const REFERENCIA_DOADOR = {
  CAO: {
    pesoMin: 25,
    idadeMin: 1,
    idadeMax: 8,
    intervaloDias: 90,
    sorologias: "Babesia, Ehrlichia, Anaplasma e Leishmania",
  },
  GATO: {
    pesoMin: 4,
    idadeMin: 1,
    idadeMax: 8,
    intervaloDias: 90,
    sorologias: "FeLV, FIV e Mycoplasma",
  },
};

// O que o veterinário confere ao validar um doador. É um checklist do que
// importa para doar sangue; o restante do histórico clínico do animal vive no
// sistema do hospital.
export const CRITERIOS_DOACAO = [
  {
    chave: "TIPAGEM",
    curto: "Tipagem",
    rotulo: "Tipagem sanguínea confirmada",
    descricao: () => "O exame de tipagem foi feito e o tipo está registrado.",
  },
  {
    chave: "PESO_IDADE",
    curto: "Peso e idade",
    rotulo: "Peso e idade dentro dos critérios",
    descricao: (ref) =>
      `Mínimo de ${ref.pesoMin} kg e idade entre ${ref.idadeMin} e ${ref.idadeMax} anos.`,
  },
  {
    chave: "VACINACAO",
    curto: "Vacinação",
    rotulo: "Vacinação e vermifugação em dia",
    descricao: () => "Vacinas e vermífugo dentro da validade.",
  },
  {
    chave: "SOROLOGIAS",
    curto: "Sorologias",
    rotulo: "Sorologias negativas",
    descricao: (ref) => `Negativo para ${ref.sorologias}.`,
  },
  {
    chave: "SEM_TRANSFUSAO",
    curto: "Sem transfusão",
    rotulo: "Nunca recebeu transfusão",
    descricao: () => "Animais já transfundidos não são aceitos como doadores.",
  },
];

export const todosCriterios = (valor) =>
  Object.fromEntries(CRITERIOS_DOACAO.map((c) => [c.chave, valor]));

// Só o veterinário escolhe entre estes, ao assinar a tipagem. Não existe
// "não sei": o campo fica vazio até o exame dizer.
export const TIPOS_SANGUINEOS = {
  CAO: ["DEA 1.1 Universal", "DEA 1.1+", "DEA 1.1-", "DEA 4", "DEA 7"],
  GATO: ["Tipo A", "Tipo B", "Tipo AB"],
};

// Cães DEA 1.1 negativo podem doar para a maioria dos cães.
export const TIPOS_UNIVERSAIS = ["DEA 1.1-", "DEA 1.1 Universal"];

export const TIPOS_DOCUMENTO = {
  HEMOGRAMA: "Hemograma completo",
  SOROLOGIA: "Sorologias",
  VACINACAO: "Carteira de vacinação",
};

// A validação vale por um ano, porque os testes para doenças transmitidas
// pelo sangue precisam ser refeitos anualmente. Devolve o último dia de
// validade ("AAAA-MM-DD"), a mesma conta da coluna valida_ate do banco.
export const validaAte = (validacao) => somarAnos(validacao.realizadaEm, 1);

// "pendente" (nunca validado), "vencida", "validado" ou "pendencias".
export function statusValidacao(validacao) {
  if (!validacao) return "pendente";
  if (hojeISO() > validaAte(validacao)) return "vencida";
  const completa = CRITERIOS_DOACAO.every((c) => validacao.criterios[c.chave]);
  return completa ? "validado" : "pendencias";
}

// A data da última doação sai das próprias coletas registradas, como no banco
// (MAX sobre a tabela de doações): não existe contador guardado à parte.
export const dataUltimaDoacao = (doacoes) =>
  doacoes.reduce(
    (maisRecente, d) =>
      !maisRecente || d.dataColeta > maisRecente ? d.dataColeta : maisRecente,
    null,
  );

// Depois de uma coleta o animal precisa de um intervalo para se recuperar.
// Devolve se ele já pode doar e, se não, a data ("AAAA-MM-DD") em que volta.
export function situacaoRecuperacao(ultimaDoacao, ref) {
  if (!ultimaDoacao) return { apto: true };
  const liberadaEm = somarDias(ultimaDoacao, ref.intervaloDias);
  return { apto: Date.now() >= paraData(liberadaEm), liberadaEm };
}

// ─── Textos sobre o animal ────────────────────────────────────────────────────

// No banco, a raça fica vazia (null) quando o animal é SRD, sem raça definida.
export const nomeRaca = (animal) => animal.raca ?? "SRD";

// "ele" ou "ela", conforme o sexo do animal.
export const pronomeAnimal = ({ sexo }) => (sexo === "FEMEA" ? "ela" : "ele");

// "Castrado", "Não castrada"...
export function textoCastracao({ sexo, castrado }) {
  const final = sexo === "FEMEA" ? "a" : "o";
  return castrado ? `Castrad${final}` : `Não castrad${final}`;
}
