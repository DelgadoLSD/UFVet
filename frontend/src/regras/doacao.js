import {
  diasDesde,
  formatarData,
  hojeISO,
  idadeEmAnos,
  paraData,
  somarAnos,
  somarDias,
  textoIdade,
} from "../util/datas";
import { formatarPeso } from "../util/texto";

// Regras de doação de sangue usadas pelas telas: o que é o ideal para doar, o
// que o veterinário confere e quanto tempo vale cada coisa.
//
// Os critérios são o ideal, e não uma proibição. Na rotina dos hospitais, um
// animal fora de algum deles ainda pode doar, conforme a urgência do caso: quem
// atende a mais critérios tem preferência, o veterinário avalia e explica os
// riscos, e a decisão é do tutor. Por isso nenhum critério tira um animal da
// busca; só o tutor faz isso, marcando-o como indisponível.
//
// Os valores seguem a Nota Técnica nº 3 (2024) da ABVHMT (Associação
// Brasileira Veterinária de Hematologia e Medicina Transfusional), menos o
// peso mínimo dos gatos: 4,5 kg, como Helm e Knottenbelt (2010) e as
// diretrizes da ISFM (2021), mais cuidadoso com o doador que os 4,0 kg da
// ABVHMT. Tudo precisa ser confirmado com a equipe do Hospital Veterinário.
//
// As chaves são as mesmas dos enums do banco (Especie, Sexo, CriterioDoacao,
// TipoDocumento), para o site e a API falarem a mesma língua. A API usa os
// mesmos valores para ordenar a busca (IDEAL_DO_DOADOR, em
// backend/src/validacao.js); aqui eles servem para exibir.

export const ESPECIES = {
  CAO: { rotulo: "Cão", plural: "cães" },
  GATO: { rotulo: "Gato", plural: "gatos" },
};

export const SEXOS = {
  MACHO: "Macho",
  FEMEA: "Fêmea",
};

// O ideal para doar, por espécie.
export const REFERENCIA_DOADOR = {
  CAO: {
    pesoMin: 25,
    idadeMin: 1,
    idadeMax: 8,
    intervaloDias: 90,
    sorologias: "Babesia, Ehrlichia, Anaplasma e Leishmania",
  },
  GATO: {
    pesoMin: 4.5,
    idadeMin: 1,
    idadeMax: 8,
    intervaloDias: 90,
    sorologias: "FeLV, FIV e Mycoplasma",
  },
};

// O peso ideal escrito para as telas: "25 kg", "4,5 kg" (o menor peso dentro do
// ideal).
export const pesoMinimo = (ref) => formatarPeso(ref.pesoMin);

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
    rotulo: "Peso e idade dentro do ideal",
    descricao: (ref) =>
      `A partir de ${pesoMinimo(ref)} e idade entre ${ref.idadeMin} e ${ref.idadeMax} anos.`,
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
    descricao: () =>
      "O ideal é nunca ter recebido. Quem já recebeu pede uma avaliação mais rigorosa.",
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

// O tipo sanguíneo em duas partes, como na etiqueta de uma bolsa de sangue: o
// sistema pequeno em cima ("DEA", "Tipo") e o tipo grande embaixo ("1.1−",
// "AB"). O "-" vira o sinal de menos tipográfico, da largura do "+".
// `porExtenso` é o que o leitor de tela fala: "DEA 1.1 negativo".
export function partesDoTipo(tipo) {
  const espaco = tipo.lastIndexOf(" ");
  return {
    sistema: tipo.slice(0, espaco),
    valor: tipo.slice(espaco + 1).replace(/-$/, "−"),
    porExtenso: tipo.replace(/\+$/, " positivo").replace(/-$/, " negativo"),
  };
}

export const TIPOS_DOCUMENTO = {
  HEMOGRAMA: "Hemograma completo",
  SOROLOGIA: "Sorologias",
  VACINACAO: "Carteira de vacinação",
};

// A validação vale por um ano, porque os testes para doenças transmitidas
// pelo sangue precisam ser refeitos anualmente. Devolve o último dia de
// validade ("AAAA-MM-DD"): o que a API manda (coluna valida_ate do banco) ou,
// nos dados de exemplo, a mesma conta.
export const validaAte = (validacao) =>
  validacao.validaAte ?? somarAnos(validacao.realizadaEm, 1);

// Um critério da validação perde o efeito quando o tutor mexe, depois da
// assinatura, no que o veterinário conferiu (F21): muda o peso ou a data de
// nascimento (o critério de peso e idade), ou apaga um exame que a validação
// conferiu (a sorologia, a carteira de vacinação). O motivo vem do banco; o
// aviso diz à pessoa o que aconteceu. NOVA_VALIDACAO não entra: a validação
// substituída não perde critério nenhum, só deixa de ser a mais recente.
const SEM_EFEITO = {
  EDICAO_PESO: {
    criterio: "PESO_IDADE",
    aviso: (nome) =>
      `O peso de ${nome} mudou depois desta validação: peso e idade precisam ser conferidos de novo.`,
  },
  EDICAO_NASCIMENTO: {
    criterio: "PESO_IDADE",
    aviso: (nome) =>
      `A data de nascimento de ${nome} mudou depois desta validação: peso e idade precisam ser conferidos de novo.`,
  },
  EXCLUSAO_SOROLOGIA: {
    criterio: "SOROLOGIAS",
    aviso: () =>
      "Uma sorologia que esta validação conferiu foi apagada: as sorologias precisam ser conferidas de novo.",
  },
  EXCLUSAO_VACINACAO: {
    criterio: "VACINACAO",
    aviso: () =>
      "Uma carteira de vacinação que esta validação conferiu foi apagada: a vacinação precisa ser conferida de novo.",
  },
};

// O critério que perdeu o efeito ("PESO_IDADE", "SOROLOGIAS" ou
// "VACINACAO"), ou null.
export const criterioSemEfeito = (validacao) =>
  SEM_EFEITO[validacao?.invalidacao?.motivo]?.criterio ?? null;

// O aviso sobre o critério que perdeu o efeito, ou null.
export const avisoSemEfeito = (validacao, nomeAnimal) =>
  SEM_EFEITO[validacao?.invalidacao?.motivo]?.aviso(nomeAnimal) ?? null;

// Os critérios que valem hoje: os que o veterinário assinou, menos o que
// perdeu o efeito (F21). O registro assinado não muda; só o efeito dele.
export function criteriosEmVigor(validacao) {
  const criterio = criterioSemEfeito(validacao);
  return criterio
    ? { ...validacao.criterios, [criterio]: false }
    : validacao.criterios;
}

// "pendente" (nunca validado), "vencida", "validado" ou "pendencias".
export function statusValidacao(validacao) {
  if (!validacao) return "pendente";
  if (hojeISO() > validaAte(validacao)) return "vencida";
  const criterios = criteriosEmVigor(validacao);
  const completa = CRITERIOS_DOACAO.every((c) => criterios[c.chave]);
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

// Depois de uma coleta, o ideal é um intervalo para o animal se recuperar.
// Devolve se ele já passou e, se não, até quando ("AAAA-MM-DD") o ideal é
// esperar. É só um aviso: o animal continua disponível, e quem decide é o tutor,
// com o veterinário.
export function situacaoRecuperacao(ultimaDoacao, ref) {
  if (!ultimaDoacao) return { intervaloCumprido: true };
  const idealEsperarAte = somarDias(ultimaDoacao, ref.intervaloDias);
  return {
    intervaloCumprido: Date.now() >= paraData(idealEsperarAte),
    idealEsperarAte,
  };
}

// "Doou hoje", "Doou ontem", "Doou há 32 dias".
export function textoDoacaoRecente(ultimaDoacao) {
  const dias = diasDesde(ultimaDoacao);
  if (dias <= 0) return "Doou hoje";
  if (dias === 1) return "Doou ontem";
  return `Doou há ${dias} dias`;
}

// ─── O ideal ──────────────────────────────────────────────────────────────────

// O que dizer de um animal fora do ideal, em todo lugar que fala disso.
export const FORA_DO_IDEAL_PODE_DOAR =
  "Isso não impede a doação: o veterinário avalia o caso e explica os riscos, e a decisão de doar é do tutor.";

// Os pontos que o site consegue conferir sozinho, pelos dados do animal, em que
// ele está fora do ideal: "peso", "idade" e "intervalo". Vacinas e exames são
// conferidos pelo veterinário, na validação. A API usa a mesma conta para pôr
// primeiro quem atende a mais critérios.
export function foraDoIdeal(animal, ultimaDoacao) {
  const ref = REFERENCIA_DOADOR[animal.especie];
  const anos = idadeEmAnos(animal.dataNascimento);
  return [
    animal.pesoKg < ref.pesoMin && "peso",
    (anos < ref.idadeMin || anos > ref.idadeMax) && "idade",
    !situacaoRecuperacao(ultimaDoacao, ref).intervaloCumprido && "intervalo",
  ].filter(Boolean);
}

// A situação numa frase curta, para caber numa linha do cartão. Com mais de um
// ponto, o "?" do cartão diz quais são.
export function resumoDoIdeal(fora, ultimaDoacao) {
  if (fora.length === 0) return "Peso, idade e intervalo ideais";
  if (fora.length > 1) return `Não atende a ${fora.length} critérios`;
  if (fora[0] === "peso") return "Peso abaixo do ideal";
  if (fora[0] === "idade") return "Fora da idade ideal";
  return textoDoacaoRecente(ultimaDoacao);
}

// Cada ponto fora do ideal, com o valor do animal e o que seria o ideal.
export function detalhesForaDoIdeal(animal, ultimaDoacao) {
  const ref = REFERENCIA_DOADOR[animal.especie];
  const idade = textoIdade(
    idadeEmAnos(animal.dataNascimento),
    animal.nascimentoAproximado,
  ).toLowerCase();
  const detalhes = {
    peso: () =>
      `Peso: ${formatarPeso(animal.pesoKg)}. O ideal é ${pesoMinimo(ref)} ou mais.`,
    idade: () =>
      `Idade: ${idade}. O ideal é de ${ref.idadeMin} a ${ref.idadeMax} anos.`,
    intervalo: () =>
      `Última doação: ${formatarData(ultimaDoacao)}. O ideal é esperar até ${formatarData(situacaoRecuperacao(ultimaDoacao, ref).idealEsperarAte)}.`,
  };
  return foraDoIdeal(animal, ultimaDoacao).map((ponto) => detalhes[ponto]());
}

// ─── Textos sobre o animal ────────────────────────────────────────────────────

// No banco, a raça fica vazia (null) quando o animal é SRD, sem raça definida.
export const nomeRaca = (animal) => animal.raca ?? "SRD";

// "ele" ou "ela", conforme o sexo do animal.
export const pronomeAnimal = ({ sexo }) => (sexo === "FEMEA" ? "ela" : "ele");

// A última letra das palavras sobre o animal: "cadastrada", "castrado".
export const finalDoGenero = ({ sexo }) => (sexo === "FEMEA" ? "a" : "o");

// "Castrado", "Não castrada"...
export function textoCastracao(animal) {
  const final = finalDoGenero(animal);
  return animal.castrado ? `Castrad${final}` : `Não castrad${final}`;
}
