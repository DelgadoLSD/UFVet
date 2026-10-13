import { describe, expect, test } from "vitest";
import {
  PREENCHA,
  erroEmail,
  erroNome,
  erroTelefone,
  soComProblema,
} from "../src/regras/conta";

// As mensagens dos campos de dados pessoais (regras/conta.js), as mesmas no
// cadastro e na página da conta. Cada conferência devolve a mensagem do
// problema, ou undefined quando o dado está certo.

describe("nome", () => {
  test("pede o nome e o sobrenome", () => {
    expect(erroNome("")).toBe(PREENCHA);
    expect(erroNome("   ")).toBe(PREENCHA);
    expect(erroNome(undefined)).toBe(PREENCHA);
    expect(erroNome("Beatriz")).toBe("Informe o nome e o sobrenome.");
    expect(erroNome(" Beatriz dos Reis ")).toBeUndefined();
  });
});

describe("e-mail", () => {
  test("pede algo@algo.algo, sem contar os espaços das pontas", () => {
    expect(erroEmail("")).toBe("Informe um e-mail válido.");
    expect(erroEmail("beatriz@")).toBe("Informe um e-mail válido.");
    expect(erroEmail("beatriz@example")).toBe("Informe um e-mail válido.");
    expect(erroEmail("bea triz@example.com")).toBe("Informe um e-mail válido.");
    expect(erroEmail(" BEATRIZ@example.com ")).toBeUndefined();
  });
});

describe("telefone", () => {
  test("primeiro pede o DDD, depois confere o número", () => {
    expect(erroTelefone("")).toBe("Informe o telefone com DDD.");
    expect(erroTelefone("(31) 9999")).toBe("Informe o telefone com DDD.");
    expect(erroTelefone("(31) 1234-5678")).toBe(
      "Telefone inválido. Confira o DDD e o número.",
    );
    expect(erroTelefone("(31) 99999-1234")).toBeUndefined();
  });
});

describe("lista de problemas", () => {
  test("fica só com os campos que têm mensagem", () => {
    const erros = soComProblema({
      nomeCompleto: undefined,
      telefone: "Informe o telefone com DDD.",
      email: "",
    });

    expect(erros).toEqual({ telefone: "Informe o telefone com DDD." });
    expect(soComProblema({ nomeCompleto: undefined })).toEqual({});
  });
});
