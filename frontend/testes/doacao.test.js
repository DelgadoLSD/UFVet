import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  CRITERIOS_DOACAO,
  REFERENCIA_DOADOR,
  criteriosEmVigor,
  pesoMinimo,
  dataUltimaDoacao,
  avisoSemEfeito,
  criterioSemEfeito,
  criteriosParaRevisar,
  marcarCriterios,
  nomeRaca,
  detalhesForaDoIdeal,
  foraDoIdeal,
  podeMarcarCriterio,
  resumoDoIdeal,
  situacaoRecuperacao,
  textoDoacaoRecente,
  statusValidacao,
  textoCastracao,
  todosCriterios,
} from "../src/regras/doacao";

// Regras de doação usadas nos cartões dos animais (regras/doacao.js). O
// "hoje" dos testes é fixo: 07/10/2026.

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 7, 10, 0));
});
afterEach(() => vi.useRealTimers());

const CAO = REFERENCIA_DOADOR.CAO;

describe("intervalo ideal de recuperação (F13)", () => {
  test("mostra até quando o ideal é esperar, contando da coleta mais recente", () => {
    const doacoes = [
      { dataColeta: "2026-03-10" },
      { dataColeta: "2026-09-05" },
      { dataColeta: "2025-10-22" },
    ];

    const ultima = dataUltimaDoacao(doacoes);
    const situacao = situacaoRecuperacao(ultima, CAO);

    expect(ultima).toBe("2026-09-05");
    // A interface mostra o dia em que o intervalo termina (NF13.2).
    expect(situacao).toEqual({
      intervaloCumprido: false,
      idealEsperarAte: "2026-12-04",
    });
  });

  test("passados os 90 dias, ou sem nenhuma coleta, o intervalo está cumprido", () => {
    expect(situacaoRecuperacao("2026-07-09", CAO).intervaloCumprido).toBe(true);
    expect(situacaoRecuperacao(dataUltimaDoacao([]), CAO)).toEqual({
      intervaloCumprido: true,
    });
  });

  test("diz há quanto tempo o animal doou", () => {
    expect(textoDoacaoRecente("2026-10-07")).toBe("Doou hoje");
    expect(textoDoacaoRecente("2026-10-06")).toBe("Doou ontem");
    expect(textoDoacaoRecente("2026-09-05")).toBe("Doou há 32 dias");
  });
});

describe("pontos fora do ideal", () => {
  // Hoje é 07/10/2026: quem nasceu em 2021 tem 5 anos.
  const animal = (dados = {}) => ({
    especie: "CAO",
    pesoKg: 30,
    dataNascimento: "2021-05-10",
    ...dados,
  });

  test("dentro do ideal em peso, idade e intervalo", () => {
    expect(foraDoIdeal(animal(), null)).toEqual([]);
    expect(resumoDoIdeal([], null)).toBe("Peso, idade e intervalo ideais");
  });

  test("os limites do peso, em cães e gatos", () => {
    expect(foraDoIdeal(animal({ pesoKg: 25 }), null)).toEqual([]);
    expect(foraDoIdeal(animal({ pesoKg: 24.9 }), null)).toEqual(["peso"]);
    const gato = { especie: "GATO" };
    expect(foraDoIdeal(animal({ ...gato, pesoKg: 4.5 }), null)).toEqual([]);
    expect(foraDoIdeal(animal({ ...gato, pesoKg: 4.4 }), null)).toEqual([
      "peso",
    ]);
  });

  test("os limites da idade, em anos completos", () => {
    const nasceu = (dataNascimento) =>
      foraDoIdeal(animal({ dataNascimento }), null);
    expect(nasceu("2025-10-07")).toEqual([]);
    expect(nasceu("2025-10-08")).toEqual(["idade"]);
    expect(nasceu("2017-10-08")).toEqual([]);
    expect(nasceu("2017-10-07")).toEqual(["idade"]);
  });

  test("o limite do intervalo: 90 dias depois da coleta, já está cumprido", () => {
    expect(foraDoIdeal(animal(), "2026-07-09")).toEqual([]);
    expect(foraDoIdeal(animal(), "2026-07-10")).toEqual(["intervalo"]);
  });

  test("o resumo nomeia um ponto só e conta quando são vários", () => {
    expect(resumoDoIdeal(["peso"], null)).toBe("Peso abaixo do ideal");
    expect(resumoDoIdeal(["idade"], null)).toBe("Fora da idade ideal");
    expect(resumoDoIdeal(["intervalo"], "2026-10-02")).toBe("Doou há 5 dias");
    expect(resumoDoIdeal(["peso", "idade"], null)).toBe(
      "Não atende a 2 critérios",
    );
  });

  test("os detalhes dizem o valor de cada ponto e o que seria o ideal", () => {
    const leve = animal({ pesoKg: 8, dataNascimento: "2015-01-01" });
    expect(detalhesForaDoIdeal(leve, "2026-10-02")).toEqual([
      "Peso: 8 kg. O ideal é 25 kg ou mais.",
      "Idade: 11 anos. O ideal é de 1 a 8 anos.",
      "Última doação: 02/10/2026. O ideal é esperar até 31/12/2026.",
    ]);
  });
});

describe("situação da validação", () => {
  const validacao = (realizadaEm, criterios = todosCriterios(true)) => ({
    realizadaEm,
    criterios,
  });

  test("nunca validado, validado, com pendências e vencido depois de um ano", () => {
    expect(statusValidacao(null)).toBe("pendente");
    expect(statusValidacao(validacao("2026-01-15"))).toBe("validado");
    expect(
      statusValidacao(
        validacao("2026-01-15", { ...todosCriterios(true), VACINACAO: false }),
      ),
    ).toBe("pendencias");
    // Vale até o mesmo dia do ano seguinte, inclusive.
    expect(statusValidacao(validacao("2025-10-07"))).toBe("validado");
    expect(statusValidacao(validacao("2025-10-06"))).toBe("vencida");
  });

  test("a validade que vem da API é a que vale", () => {
    expect(
      statusValidacao({ ...validacao("2026-01-15"), validaAte: "2026-10-06" }),
    ).toBe("vencida");
  });

  test("peso ou nascimento mudados depois: o critério de peso e idade perde o efeito (F21)", () => {
    const assinada = validacao("2026-08-20");
    const peso = {
      ...assinada,
      invalidacao: { em: "2026-09-01T12:00:00Z", motivo: "EDICAO_PESO" },
    };
    const nascimento = {
      ...assinada,
      invalidacao: { em: "2026-09-01T12:00:00Z", motivo: "EDICAO_NASCIMENTO" },
    };

    expect(criterioSemEfeito(peso)).toBe("PESO_IDADE");
    expect(criterioSemEfeito(nascimento)).toBe("PESO_IDADE");
    expect(avisoSemEfeito(peso, "Zeus")).toBe(
      "O peso de Zeus mudou depois desta validação: peso e idade precisam ser conferidos de novo.",
    );
    expect(avisoSemEfeito(nascimento, "Zeus")).toBe(
      "A data de nascimento de Zeus mudou depois desta validação: peso e idade precisam ser conferidos de novo.",
    );
    expect(statusValidacao(peso)).toBe("pendencias");
    expect(criteriosEmVigor(peso)).toEqual({
      ...todosCriterios(true),
      PESO_IDADE: false,
    });
    // O registro assinado não muda.
    expect(peso.criterios.PESO_IDADE).toBe(true);
  });

  test("substituída por uma validação nova não é F21: os critérios continuam", () => {
    const substituida = {
      ...validacao("2026-08-20"),
      invalidacao: { em: "2026-09-01T12:00:00Z", motivo: "NOVA_VALIDACAO" },
    };

    expect(criterioSemEfeito(substituida)).toBeNull();
    expect(avisoSemEfeito(substituida, "Zeus")).toBeNull();
    expect(criteriosEmVigor(substituida)).toEqual(todosCriterios(true));
  });

  test("exame conferido e apagado pelo tutor: o critério que ele comprova perde o efeito (F21)", () => {
    const assinada = validacao("2026-08-20");
    const sorologia = {
      ...assinada,
      invalidacao: { em: "2026-09-01T12:00:00Z", motivo: "EXCLUSAO_SOROLOGIA" },
    };
    const vacinacao = {
      ...assinada,
      invalidacao: { em: "2026-09-01T12:00:00Z", motivo: "EXCLUSAO_VACINACAO" },
    };

    expect(criteriosEmVigor(sorologia)).toEqual({
      ...todosCriterios(true),
      SOROLOGIAS: false,
    });
    expect(criteriosEmVigor(vacinacao)).toEqual({
      ...todosCriterios(true),
      VACINACAO: false,
    });
    // Sem o critério, o selo deixa de ser "validado".
    expect(statusValidacao(sorologia)).toBe("pendencias");
    expect(avisoSemEfeito(sorologia, "Zeus")).toBe(
      "Uma sorologia que esta validação conferiu foi apagada: as sorologias precisam ser conferidas de novo.",
    );
    expect(avisoSemEfeito(vacinacao, "Zeus")).toBe(
      "Uma carteira de vacinação que esta validação conferiu foi apagada: a vacinação precisa ser conferida de novo.",
    );
    // O registro assinado não muda.
    expect(sorologia.criterios.SOROLOGIAS).toBe(true);
  });
});

describe("o que o veterinário pode marcar (NF19.7)", () => {
  const dentro = { especie: "CAO", pesoKg: 32, dataNascimento: "2021-08-20" };
  const leve = { ...dentro, pesoKg: 22 };
  const velho = { ...dentro, dataNascimento: "2016-08-20" };
  const filhote = { ...dentro, dataNascimento: "2026-08-20" };
  const gatoLeve = { ...dentro, especie: "GATO", pesoKg: 4 };
  const gatoNoLimite = { ...gatoLeve, pesoKg: 4.5 };

  test("peso e idade só podem ser marcados dentro do ideal", () => {
    expect(podeMarcarCriterio("PESO_IDADE", dentro)).toBe(true);
    expect(podeMarcarCriterio("PESO_IDADE", gatoNoLimite)).toBe(true);
    expect(podeMarcarCriterio("PESO_IDADE", leve)).toBe(false);
    expect(podeMarcarCriterio("PESO_IDADE", velho)).toBe(false);
    expect(podeMarcarCriterio("PESO_IDADE", filhote)).toBe(false);
    expect(podeMarcarCriterio("PESO_IDADE", gatoLeve)).toBe(false);
  });

  test("os outros critérios valem para qualquer animal", () => {
    for (const chave of [
      "TIPAGEM",
      "VACINACAO",
      "SOROLOGIAS",
      "SEM_TRANSFUSAO",
    ]) {
      expect(podeMarcarCriterio(chave, leve)).toBe(true);
    }
  });

  test('"Marcar todos" pula peso e idade fora do ideal', () => {
    expect(marcarCriterios(true, dentro)).toEqual(todosCriterios(true));
    expect(marcarCriterios(true, leve)).toEqual({
      ...todosCriterios(true),
      PESO_IDADE: false,
    });
    expect(marcarCriterios(false, leve)).toEqual(todosCriterios(false));
  });

  test("a revisão desmarca peso e idade de quem hoje está fora do ideal", () => {
    const anterior = {
      criterios: { ...todosCriterios(true), VACINACAO: false },
    };

    expect(criteriosParaRevisar(anterior, leve)).toEqual({
      ...todosCriterios(true),
      VACINACAO: false,
      PESO_IDADE: false,
    });
    expect(criteriosParaRevisar(anterior, dentro)).toEqual(anterior.criterios);
  });

  test("a revisão não traz de volta o critério que perdeu o efeito (F21)", () => {
    const anterior = {
      criterios: todosCriterios(true),
      invalidacao: { em: "2026-09-01T12:00:00Z", motivo: "EXCLUSAO_SOROLOGIA" },
    };

    expect(criteriosParaRevisar(anterior, dentro)).toEqual({
      ...todosCriterios(true),
      SOROLOGIAS: false,
    });
  });
});

describe("peso ideal para doar", () => {
  // Gatos: 4,5 kg, como Helm e Knottenbelt (2010) e as diretrizes da ISFM
  // (2021), em vez dos 4,0 kg da ABVHMT. Cães: 25 kg nas três.
  test("gatos a partir de 4,5 kg e cães a partir de 25 kg", () => {
    expect(REFERENCIA_DOADOR.GATO.pesoMin).toBe(4.5);
    expect(REFERENCIA_DOADOR.CAO.pesoMin).toBe(25);
  });

  test("o peso aparece escrito como no Brasil, com vírgula", () => {
    expect(pesoMinimo(REFERENCIA_DOADOR.GATO)).toBe("4,5 kg");
    expect(pesoMinimo(REFERENCIA_DOADOR.CAO)).toBe("25 kg");
  });

  test("o critério da validação mostra o ideal da espécie", () => {
    const pesoIdade = CRITERIOS_DOACAO.find((c) => c.chave === "PESO_IDADE");
    expect(pesoIdade.descricao(REFERENCIA_DOADOR.GATO)).toBe(
      "A partir de 4,5 kg e idade entre 1 e 8 anos.",
    );
  });
});

describe("textos sobre o animal", () => {
  test("castração e raça no feminino, no masculino e sem raça definida", () => {
    expect(textoCastracao({ sexo: "FEMEA", castrado: true })).toBe("Castrada");
    expect(textoCastracao({ sexo: "MACHO", castrado: false })).toBe(
      "Não castrado",
    );
    expect(nomeRaca({ raca: null })).toBe("SRD");
    expect(nomeRaca({ raca: "Persa" })).toBe("Persa");
  });
});
