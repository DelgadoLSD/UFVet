import { describe, expect, test } from "vitest";
import {
  PREENCHA,
  erroCpf,
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

describe("CPF", () => {
  test("primeiro confere o tamanho, depois os dígitos verificadores", () => {
    expect(erroCpf("")).toBe("O CPF tem 11 números.");
    expect(erroCpf("123.456.789")).toBe("O CPF tem 11 números.");
    expect(erroCpf("123.456.789-00")).toBe("CPF inválido. Confira os números.");
    expect(erroCpf("529.982.247-25")).toBeUndefined();
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
      cpf: "O CPF tem 11 números.",
      email: "",
    });

    expect(erros).toEqual({ cpf: "O CPF tem 11 números." });
    expect(soComProblema({ nomeCompleto: undefined })).toEqual({});
  });
});
