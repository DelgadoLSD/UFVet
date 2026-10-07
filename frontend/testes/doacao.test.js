import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  REFERENCIA_DOADOR,
  dataUltimaDoacao,
  nomeRaca,
  situacaoRecuperacao,
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

describe("intervalo de recuperação (F13)", () => {
  test("90 dias depois da coleta mais recente, o animal volta a ficar apto", () => {
    const doacoes = [
      { dataColeta: "2026-03-10" },
      { dataColeta: "2026-09-05" },
      { dataColeta: "2025-10-22" },
    ];

    const ultima = dataUltimaDoacao(doacoes);
    const situacao = situacaoRecuperacao(ultima, CAO);

    expect(ultima).toBe("2026-09-05");
    // A interface mostra o dia em que ele volta (NF13.2).
    expect(situacao).toEqual({ apto: false, liberadaEm: "2026-12-04" });
  });

  test("passados os 90 dias, ou sem nenhuma coleta, está apto", () => {
    expect(situacaoRecuperacao("2026-07-09", CAO).apto).toBe(true);
    expect(situacaoRecuperacao(dataUltimaDoacao([]), CAO)).toEqual({
      apto: true,
    });
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
