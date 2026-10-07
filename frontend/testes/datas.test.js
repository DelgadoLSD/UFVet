import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  formatarData,
  idadeEmAnos,
  paraData,
  somarAnos,
  somarDias,
  textoIdade,
} from "../src/util/datas";

// Datas e idade (util/datas.js). O "hoje" dos testes é fixo, para a idade
// não mudar conforme o dia em que os testes rodam.

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 7, 10, 0)); // 07/10/2026, 10h
});
afterEach(() => vi.useRealTimers());

describe("idade (F12)", () => {
  test("sai da data de nascimento e só sobe no dia do aniversário", () => {
    expect(idadeEmAnos("2021-10-07")).toBe(5);
    expect(idadeEmAnos("2021-10-08")).toBe(4);
    expect(idadeEmAnos("2021-08-20")).toBe(5);
    expect(idadeEmAnos("2026-01-01")).toBe(0);
  });

  test("o texto da idade, com a idade aproximada marcada como tal (NF12.1)", () => {
    expect(textoIdade(0)).toBe("Menos de 1 ano");
    expect(textoIdade(1)).toBe("1 ano");
    expect(textoIdade(5)).toBe("5 anos");
    expect(textoIdade(5, true)).toBe("Cerca de 5 anos");
    expect(textoIdade(1, true)).toBe("Cerca de 1 ano");
    expect(textoIdade(0, true)).toBe("Menos de 1 ano");
  });
});

describe("datas sem hora", () => {
  test("o dia é lido no fuso do Brasil, sem voltar para o dia anterior", () => {
    // new Date("2026-03-10") seria meia-noite em UTC: 21h do dia 9 no Brasil.
    expect(paraData("2026-03-10").getDate()).toBe(10);
    expect(formatarData("2026-03-10")).toBe("10/03/2026");
  });

  test("somar dias e anos atravessa meses, anos e o 29 de fevereiro", () => {
    expect(somarDias("2026-09-05", 90)).toBe("2026-12-04");
    expect(somarDias("2026-12-20", 15)).toBe("2027-01-04");
    expect(somarAnos("2025-08-10", 1)).toBe("2026-08-10");
    expect(somarAnos("2026-10-07", -30)).toBe("1996-10-07");
    // Num ano sem 29/02, o dia seguinte.
    expect(somarAnos("2024-02-29", 1)).toBe("2025-03-01");
  });
});
