import { describe, expect, test } from "vitest";
import {
  etapaAnterior,
  numeroDaEtapa,
  proximaEtapa,
  totalDeEtapas,
} from "../src/regras/cadastro";
import { erroConfirmacaoSenha, erroSenhaNova } from "../src/regras/conta";

// As regras do cadastro que não dependem da tela (regras/cadastro.js e
// regras/conta.js): a ordem das etapas de cada papel e a senha nova.

describe("etapas do cadastro", () => {
  test("o tutor pula o convite, ao avançar e ao voltar", () => {
    expect(proximaEtapa("TUTOR", 3)).toBe(5);
    expect(etapaAnterior("TUTOR", 5)).toBe(3);
  });

  test("o veterinário passa pelo convite", () => {
    expect(proximaEtapa("VETERINARIO", 3)).toBe(4);
    expect(proximaEtapa("VETERINARIO", 4)).toBe(5);
    expect(etapaAnterior("VETERINARIO", 5)).toBe(4);
  });

  test("são 4 etapas para o tutor e 5 para o veterinário", () => {
    expect(totalDeEtapas("TUTOR")).toBe(4);
    expect(totalDeEtapas("VETERINARIO")).toBe(5);
  });

  test("a última etapa do tutor aparece como a 4ª", () => {
    expect(numeroDaEtapa("TUTOR", 5)).toBe(4);
    expect(numeroDaEtapa("VETERINARIO", 5)).toBe(5);
  });

  test("antes de escolher o papel, vale a contagem do tutor", () => {
    expect(totalDeEtapas(null)).toBe(4);
    expect(numeroDaEtapa(null, 1)).toBe(1);
  });
});

describe("senha nova", () => {
  test("precisa de pelo menos 8 caracteres", () => {
    expect(erroSenhaNova("1234567")).toBe(
      "A senha precisa ter pelo menos 8 caracteres.",
    );
    expect(erroSenhaNova("12345678")).toBeUndefined();
    expect(erroSenhaNova()).toBeDefined();
  });

  test("a confirmação precisa ser igual", () => {
    expect(erroConfirmacaoSenha("senha-boa", "senha-ruim")).toBe(
      "As duas senhas estão diferentes.",
    );
    expect(erroConfirmacaoSenha("senha-boa", "senha-boa")).toBeUndefined();
  });
});
